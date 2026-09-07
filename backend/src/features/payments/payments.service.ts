// =============================================================================
// Payments Feature — Safepay Integration Business Logic
// =============================================================================

import crypto from "crypto";
import Safepay from "@sfpy/node-core";
import { prisma } from "../../db";

// Minimal fetch types (Node 18+ global fetch)
interface TrackerFetchResult {
  ok?: boolean;
  data?: {
    token?: string;
    state?: string;
    metadata?: {
      order_id?: { value?: string } | string;
    };
    charge?: { is_success?: boolean } | null;
  };
  status?: { message?: string; errors?: unknown[] };
}

// ---------------------------------------------------------------------------
// Safepay Client Initialization
// ---------------------------------------------------------------------------

const SAFEPAY_SECRET_KEY = process.env.SAFEPAY_SECRET_KEY;
const SAFEPAY_API_KEY = process.env.SAFEPAY_API_KEY;
const SAFEPAY_WEBHOOK_SECRET = process.env.SAFEPAY_WEBHOOK_SECRET;
const SAFEPAY_ENV = process.env.SAFEPAY_ENV || "sandbox";

// Startup warning — log clearly but don't crash
const missingVars: string[] = [];
if (!SAFEPAY_SECRET_KEY) missingVars.push("SAFEPAY_SECRET_KEY");
if (!SAFEPAY_API_KEY) missingVars.push("SAFEPAY_API_KEY");
if (!SAFEPAY_WEBHOOK_SECRET) missingVars.push("SAFEPAY_WEBHOOK_SECRET");

if (missingVars.length > 0) {
  console.warn(
    `[Safepay] WARNING: Missing environment variables: ${missingVars.join(", ")}. ` +
    `Card payment features will not work until these are configured.`
  );
}

const safepayHost =
  SAFEPAY_ENV === "production"
    ? "https://api.getsafepay.com"
    : "https://sandbox.api.getsafepay.com";

let safepay: InstanceType<typeof Safepay> | null = null;

if (SAFEPAY_SECRET_KEY) {
  safepay = new Safepay(SAFEPAY_SECRET_KEY, {
    authType: "secret",
    host: safepayHost,
  });
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreateCheckoutInput {
  orderId: string;
}

export interface SafepayCheckoutResult {
  checkoutUrl: string;
  trackerToken: string;
}

// ---------------------------------------------------------------------------
// Custom Error
// ---------------------------------------------------------------------------

export class PaymentError extends Error {
  public statusCode: number;
  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = "PaymentError";
  }
}

// ---------------------------------------------------------------------------
// Create Safepay Checkout Session
// ---------------------------------------------------------------------------

export async function createSafepayCheckout(
  input: CreateCheckoutInput,
  frontendBaseUrl: string
): Promise<SafepayCheckoutResult> {
  if (!safepay || !SAFEPAY_API_KEY) {
    throw new PaymentError(
      "Safepay is not configured. Please check server environment variables.",
      503
    );
  }

  // 1. Fetch the order from DB — NEVER trust client-sent amounts
  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    select: {
      id: true,
      orderNumber: true,
      total: true,
      paymentMethod: true,
      paymentStatus: true,
    },
  });

  if (!order) {
    throw new PaymentError("Order not found.", 404);
  }

  if (order.paymentStatus === "PAID") {
    throw new PaymentError("This order has already been paid.", 400);
  }

  if (order.paymentMethod !== "CARD") {
    throw new PaymentError(
      "This order was not created with card payment method.",
      400
    );
  }

  // 2. Convert total to paisa (lowest denomination for PKR)
  const amountInPaisa = Math.round(Number(order.total) * 100);

  // 3. Create payment session (tracker)
  let sessionResponse: any;
  try {
    sessionResponse = await safepay.payments.session.setup({
      merchant_api_key: SAFEPAY_API_KEY,
      intent: "CYBERSOURCE",
      mode: "payment",
      entry_mode: "raw",
      currency: "PKR",
      amount: amountInPaisa,
      metadata: {
        order_id: order.id,
      },
    });
  } catch (err: any) {
    console.error("[Safepay] Payment session creation failed:", err?.message || err);
    throw new PaymentError(
      "Failed to create payment session. Please try again.",
      502
    );
  }

  const trackerToken = sessionResponse?.data?.tracker?.token;
  if (!trackerToken) {
    console.error("[Safepay] No tracker token in response:", JSON.stringify(sessionResponse));
    throw new PaymentError(
      "Failed to create payment session. Invalid response from Safepay.",
      502
    );
  }

  // 4. Create authentication token
  let authResponse: any;
  try {
    authResponse = await safepay.client.passport.create();
  } catch (err: any) {
    console.error("[Safepay] Auth token creation failed:", err?.message || err);
    throw new PaymentError(
      "Failed to create authentication token. Please try again.",
      502
    );
  }

  const authToken = authResponse?.data;
  if (!authToken) {
    console.error("[Safepay] No auth token in response:", JSON.stringify(authResponse));
    throw new PaymentError(
      "Failed to create authentication token. Invalid response from Safepay.",
      502
    );
  }

  // 5. Generate checkout URL
  let checkoutUrl: string;
  try {
    checkoutUrl = safepay.checkout.createCheckoutUrl({
      tracker: trackerToken,
      tbt: authToken,
      env: SAFEPAY_ENV as "development" | "sandbox" | "production",
      source: "hosted",
      redirect_url: `${frontendBaseUrl}/order-confirmation/${order.orderNumber}`,
      cancel_url: `${frontendBaseUrl}/checkout`,
    });
  } catch (err: any) {
    console.error("[Safepay] Checkout URL generation failed:", err?.message || err);
    throw new PaymentError(
      "Failed to generate checkout URL. Please try again.",
      502
    );
  }

  return { checkoutUrl, trackerToken };
}

// ---------------------------------------------------------------------------
// Verify a tracker token against Safepay (server-side fallback to the webhook).
// Works even when Safepay can't reach us (e.g. localhost dev), and doubles as
// a safety net in production if a webhook delivery is ever delayed/lost.
// ---------------------------------------------------------------------------

export async function verifySafepayTracker(orderId: string, trackerToken: string) {
  if (!SAFEPAY_SECRET_KEY) {
    throw new PaymentError(
      "Safepay is not configured. Please check server environment variables.",
      503
    );
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, paymentMethod: true, paymentStatus: true, status: true },
  });
  if (!order) throw new PaymentError("Order not found.", 404);
  if (order.paymentMethod !== "CARD") {
    throw new PaymentError("This order is not a card payment.", 400);
  }

  // Already resolved — nothing to do
  if (order.paymentStatus === "PAID" || order.paymentStatus === "FAILED") {
    return order;
  }

  let tracker: TrackerFetchResult;
  try {
    if (!safepay) {
      throw new Error("Safepay client is not initialized");
    }
    tracker = (await safepay.reporter.payments.fetch(trackerToken)) as TrackerFetchResult;
  } catch (err: any) {
    console.error("[Safepay] Tracker verification failed:", err?.message || err);
    throw new PaymentError("Could not verify payment status with Safepay. Please try again.", 502);
  }

  const state = tracker?.data?.state || "";
  const metadataOrderId =
    typeof tracker?.data?.metadata?.order_id === "string"
      ? tracker.data.metadata.order_id
      : tracker?.data?.metadata?.order_id?.value;

  console.log(`[Safepay] Tracker ${trackerToken} state=${state} for order ${orderId}`);

  // The tracker must belong to this order — never mark an order paid from a
  // token that points at a different order.
  if (metadataOrderId && metadataOrderId !== orderId) {
    throw new PaymentError("Tracker token does not belong to this order.", 400);
  }

  if (state === "TRACKER_ENDED" || tracker?.data?.charge?.is_success === true) {
    return prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: "PAID", status: "CONFIRMED" },
      select: { id: true, orderNumber: true, paymentMethod: true, paymentStatus: true, status: true, total: true },
    });
  }

  if (state === "TRACKER_FAILED") {
    return prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: "FAILED" },
      select: { id: true, orderNumber: true, paymentMethod: true, paymentStatus: true, status: true, total: true },
    });
  }

  // Still in progress (TRACKER_STARTED / PENDING) — leave the order untouched
  return prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, orderNumber: true, paymentMethod: true, paymentStatus: true, status: true, total: true },
  });
}

// ---------------------------------------------------------------------------
// Verify Webhook Signature
// ---------------------------------------------------------------------------

export function verifyWebhookSignature(
  rawBody: Buffer,
  signatureHeader: string | undefined,
  timestampHeader: string | undefined
): boolean {
  if (!SAFEPAY_WEBHOOK_SECRET) {
    console.error("[Safepay] SAFEPAY_WEBHOOK_SECRET not configured — cannot verify webhook");
    return false;
  }

  if (!signatureHeader || !timestampHeader) {
    console.warn("[Safepay] Webhook missing signature or timestamp header");
    return false;
  }

  // Build signing payload: timestamp + '.' + raw_body
  const signingPayload = timestampHeader + "." + rawBody.toString("utf-8");

  // Base64-decode the webhook secret to get the HMAC key
  let hmacKey: Buffer;
  try {
    hmacKey = Buffer.from(SAFEPAY_WEBHOOK_SECRET, "base64");
  } catch {
    console.error("[Safepay] Failed to decode SAFEPAY_WEBHOOK_SECRET from base64");
    return false;
  }

  // Compute HMAC-SHA256
  const hmac = crypto.createHmac("sha256", hmacKey);
  hmac.update(signingPayload);
  const expectedSignature = "sha256=" + hmac.digest("hex");

  // Constant-time comparison
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "utf-8"),
      Buffer.from(signatureHeader, "utf-8")
    );
  } catch {
    // Lengths differ — not a match
    return false;
  }
}

// ---------------------------------------------------------------------------
// Process Webhook Event
// ---------------------------------------------------------------------------

export async function processWebhookEvent(eventPayload: any): Promise<void> {
  const eventType = eventPayload?.event;
  const trackerToken = eventPayload?.data?.tracker?.token;
  const orderId = eventPayload?.data?.tracker?.metadata?.order_id;
  const trackerState = eventPayload?.data?.tracker?.state;

  if (!eventType || !orderId) {
    console.warn("[Safepay] Webhook event missing eventType or orderId:", JSON.stringify(eventPayload));
    return;
  }

  console.log(`[Safepay] Processing webhook event: ${eventType} for order: ${orderId}, tracker state: ${trackerState}`);

  // Find the order
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, paymentStatus: true, status: true },
  });

  if (!order) {
    console.warn(`[Safepay] Order not found for webhook: ${orderId}`);
    return;
  }

  // Idempotency: skip if already paid
  if (order.paymentStatus === "PAID") {
    console.log(`[Safepay] Order ${orderId} already PAID — skipping duplicate webhook`);
    return;
  }

  // Determine outcome based on event type
  if (
    eventType === "payment.completed" ||
    eventType === "payment.settled" ||
    trackerState === "TRACKER_ENDED"
  ) {
    // Payment successful — mark as PAID
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: "PAID",
        status: "CONFIRMED",
      },
    });
    console.log(`[Safepay] Order ${orderId} marked as PAID`);
    // TODO: Trigger order-confirmation email if/when email feature is added
  } else if (
    eventType === "payment.failed" ||
    eventType === "payment.rejected" ||
    eventType === "payment.reversed"
  ) {
    // Payment failed — mark as FAILED (do NOT touch stock — already reserved at order creation)
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: "FAILED",
      },
    });
    console.log(`[Safepay] Order ${orderId} marked as PAYMENT_FAILED`);
  } else {
    console.log(`[Safepay] Unhandled webhook event type: ${eventType} — no action taken`);
  }
}

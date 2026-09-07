// =============================================================================
// Payments Feature — Request Handlers (Controller)
// =============================================================================

import { Request, Response } from "express";
import {
  createSafepayCheckout,
  verifySafepayTracker,
  verifyWebhookSignature,
  processWebhookEvent,
  PaymentError,
} from "./payments.service";

// ---------------------------------------------------------------------------
// POST /api/payments/safepay/create
// ---------------------------------------------------------------------------

export async function handleCreateCheckout(req: Request, res: Response) {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: "orderId is required." });
    }

    const frontendBaseUrl =
      process.env.CORS_ORIGIN || "http://localhost:3000";

    const result = await createSafepayCheckout({ orderId }, frontendBaseUrl);

    res.status(200).json({
      message: "Safepay checkout session created",
      data: {
        checkoutUrl: result.checkoutUrl,
        trackerToken: result.trackerToken,
      },
    });
  } catch (err: any) {
    if (err instanceof PaymentError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error("Create checkout error:", err?.message || err);
    console.error("Create checkout stack:", err?.stack);
    res.status(500).json({ error: "Internal server error" });
  }
}

// ---------------------------------------------------------------------------
// POST /api/payments/safepay/verify — server-side tracker verification
// ---------------------------------------------------------------------------
// Called by the order-confirmation page after the customer returns from
// Safepay. Works even when the webhook can't reach us (localhost dev) and
// acts as a fallback for delayed webhooks in production.

export async function handleVerifyTracker(req: Request, res: Response) {
  try {
    const { orderId, trackerToken } = req.body;

    if (!orderId || !trackerToken) {
      return res
        .status(400)
        .json({ error: "orderId and trackerToken are required." });
    }

    const order = await verifySafepayTracker(orderId, trackerToken);
    res.json({ data: order });
  } catch (err: any) {
    if (err instanceof PaymentError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error("Verify tracker error:", err?.message || err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// ---------------------------------------------------------------------------
// POST /api/payments/safepay/webhook
// ---------------------------------------------------------------------------

export async function handleSafepayWebhook(req: Request, res: Response) {
  try {
    // express.raw() middleware sets req.body to a raw Buffer.
    // Use it directly for signature verification — never reconstruct from JSON.
    const rawBody = req.body as Buffer;

    if (!Buffer.isBuffer(rawBody)) {
      console.error("[Safepay] Webhook received without raw body buffer");
      return res.status(400).json({ error: "Missing request body" });
    }

    // Verify webhook signature
    const signature = req.headers["x-sfpy-signature"] as string | undefined;
    const timestamp = req.headers["x-sfpy-timestamp"] as string | undefined;

    if (!signature || !timestamp) {
      console.warn("[Safepay] Webhook missing signature or timestamp header");
      return res.status(401).json({ error: "Invalid webhook signature" });
    }

    const isValid = verifyWebhookSignature(rawBody, signature, timestamp);

    if (!isValid) {
      console.warn("[Safepay] Webhook signature verification FAILED — rejecting request");
      return res.status(401).json({ error: "Invalid webhook signature" });
    }

    // Signature valid — parse the raw buffer to get the event data
    let eventPayload: any;
    try {
      eventPayload = JSON.parse(rawBody.toString("utf-8"));
    } catch {
      console.error("[Safepay] Failed to parse webhook body as JSON");
      return res.status(400).json({ error: "Invalid JSON" });
    }

    await processWebhookEvent(eventPayload);

    // Always respond 200 to acknowledge receipt (Safepay retries on non-200)
    res.status(200).json({ received: true });
  } catch (err: any) {
    console.error("Webhook processing error:", err?.message || err);
    // Still return 200 to prevent Safepay from retrying endlessly on our bug
    res.status(200).json({ received: true, note: "Internal processing error logged" });
  }
}

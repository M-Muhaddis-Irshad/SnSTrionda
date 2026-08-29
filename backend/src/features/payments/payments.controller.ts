// =============================================================================
// Payments Feature — Request Handlers (Controller)
// =============================================================================

import { Request, Response } from "express";
import {
  createSafepayCheckout,
  verifyWebhookSignature,
  processWebhookEvent,
  PaymentError,
} from "./payments.service";

// ---------------------------------------------------------------------------
// POST /api/payments/safepay/create
// ---------------------------------------------------------------------------

export async function handleCreateCheckout(req: Request, res: Response) {
  try {
    console.log("[Payments] handleCreateCheckout called, body:", JSON.stringify(req.body));
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
// POST /api/payments/safepay/webhook
// ---------------------------------------------------------------------------

export async function handleSafepayWebhook(req: Request, res: Response) {
  try {
    // For signature verification we need the raw body bytes.
    // If middleware saved req.rawBody, use that; otherwise reconstruct from parsed body.
    let rawBody: Buffer;
    const savedRaw = (req as any).rawBody as Buffer | undefined;

    if (Buffer.isBuffer(savedRaw)) {
      rawBody = savedRaw;
    } else if (typeof req.body === "string") {
      rawBody = Buffer.from(req.body, "utf-8");
    } else if (typeof req.body === "object" && req.body !== null) {
      // Reconstruct from parsed JSON — works for verification if Safepay
      // signed the canonical JSON form. This is a fallback.
      rawBody = Buffer.from(JSON.stringify(req.body), "utf-8");
    } else {
      console.error("[Safepay] Webhook received without body");
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

    // Signature valid — process the event
    const eventPayload = req.body;
    await processWebhookEvent(eventPayload);

    // Always respond 200 to acknowledge receipt (Safepay retries on non-200)
    res.status(200).json({ received: true });
  } catch (err: any) {
    console.error("Webhook processing error:", err?.message || err);
    // Still return 200 to prevent Safepay from retrying endlessly on our bug
    res.status(200).json({ received: true, note: "Internal processing error logged" });
  }
}

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
import cloudinary from "../../config/cloudinary";
import { prisma } from "../../db";

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

// ---------------------------------------------------------------------------
// POST /api/payments/jazzcash/upload-slip
// ---------------------------------------------------------------------------

function uploadSlipToCloudinary(file: Express.Multer.File): Promise<string> {
  const ALLOWED = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
  if (!ALLOWED.includes(file.mimetype)) {
    throw new PaymentError(`Invalid file type: ${file.mimetype}.`, 400);
  }
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "trionda-wears/payment-slips",
        public_id: `slip-${Date.now()}`,
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error("Upload failed"));
        resolve(result.secure_url);
      }
    );
    stream.end(file.buffer);
  });
}

export async function handleUploadJazzCashSlip(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required." });
    }

    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ error: "orderId is required." });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Payment slip image is required." });
    }

    // Verify the order exists, belongs to this user, and is JAZZCASH
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }
    if (order.userId !== userId) {
      return res.status(403).json({ error: "This order does not belong to you." });
    }
    if (order.paymentMethod !== "JAZZCASH") {
      return res.status(400).json({ error: "This order is not a JazzCash payment." });
    }
    // Allow re-upload when payment is PENDING (first time) or FAILED (rejected, re-upload)
    if (order.paymentStatus !== "PENDING" && order.paymentStatus !== "FAILED") {
      return res.status(400).json({ error: `Cannot upload slip — payment status is ${order.paymentStatus}.` });
    }

    // Upload to Cloudinary
    const slipUrl = await uploadSlipToCloudinary(req.file);

    // Store on the order + reset status to PENDING if it was FAILED (re-upload)
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentSlipUrl: slipUrl,
        paymentStatus: "PENDING",
        paymentRejectionReason: null,
      },
    });

    res.json({ data: { paymentSlipUrl: updated.paymentSlipUrl }, message: "Payment slip uploaded successfully." });
  } catch (err: any) {
    if (err instanceof PaymentError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error("Upload slip error:", err?.message || err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/payments/jazzcash/verify — admin approve/reject
// ---------------------------------------------------------------------------

export async function handleVerifyJazzCashSlip(req: Request, res: Response) {
  try {
    const { orderId, action, reason } = req.body;
    if (!orderId || !action) {
      return res.status(400).json({ error: "orderId and action (approve|reject) are required." });
    }
    if (action !== "approve" && action !== "reject") {
      return res.status(400).json({ error: "action must be 'approve' or 'reject'." });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }
    if (order.paymentMethod !== "JAZZCASH") {
      return res.status(400).json({ error: "This order is not a JazzCash payment." });
    }

    if (action === "approve") {
      // Approve: paymentStatus → PAID, order status → CONFIRMED
      const updated = await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: "PAID",
          status: "CONFIRMED",
        },
        include: {
          user: { select: { id: true, email: true, name: true } },
          items: { include: { productVariant: { include: { product: { select: { name: true } } } } } },
          shippingAddress: true,
        },
      });

      // Fire the existing Socket.IO broadcast (order.status changed → notification)
      try {
        const { broadcastOrderStatusUpdate } = await import("../../services/socketService");
        await broadcastOrderStatusUpdate(updated, {
          fromStatus: order.status,
          adminId: (req as any).user?.userId,
          notes: "JazzCash payment verified and approved",
        });
      } catch (broadcastErr: any) {
        console.error("Broadcast failed (order still updated):", broadcastErr?.message);
      }

      res.json({ data: updated, message: "Payment approved. Order confirmed." });
    } else {
      // Reject: paymentStatus → FAILED, order stays PENDING
      const updated = await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: "FAILED",
          paymentRejectionReason: reason || null,
        },
      });
      res.json({ data: updated, message: "Payment rejected. Customer can re-upload." });
    }
  } catch (err: any) {
    console.error("Verify JazzCash error:", err?.message || err);
    res.status(500).json({ error: "Internal server error" });
  }
}

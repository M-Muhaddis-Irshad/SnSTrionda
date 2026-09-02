"use strict";
// =============================================================================
// Payments Feature — Request Handlers (Controller)
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleCreateCheckout = handleCreateCheckout;
exports.handleSafepayWebhook = handleSafepayWebhook;
const payments_service_1 = require("./payments.service");
// ---------------------------------------------------------------------------
// POST /api/payments/safepay/create
// ---------------------------------------------------------------------------
async function handleCreateCheckout(req, res) {
    try {
        console.log("[Payments] handleCreateCheckout called, body:", JSON.stringify(req.body));
        const { orderId } = req.body;
        if (!orderId) {
            return res.status(400).json({ error: "orderId is required." });
        }
        const frontendBaseUrl = process.env.CORS_ORIGIN || "http://localhost:3000";
        const result = await (0, payments_service_1.createSafepayCheckout)({ orderId }, frontendBaseUrl);
        res.status(200).json({
            message: "Safepay checkout session created",
            data: {
                checkoutUrl: result.checkoutUrl,
                trackerToken: result.trackerToken,
            },
        });
    }
    catch (err) {
        if (err instanceof payments_service_1.PaymentError) {
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
async function handleSafepayWebhook(req, res) {
    try {
        // express.raw() middleware sets req.body to a raw Buffer.
        // Use it directly for signature verification — never reconstruct from JSON.
        const rawBody = req.body;
        if (!Buffer.isBuffer(rawBody)) {
            console.error("[Safepay] Webhook received without raw body buffer");
            return res.status(400).json({ error: "Missing request body" });
        }
        // Verify webhook signature
        const signature = req.headers["x-sfpy-signature"];
        const timestamp = req.headers["x-sfpy-timestamp"];
        if (!signature || !timestamp) {
            console.warn("[Safepay] Webhook missing signature or timestamp header");
            return res.status(401).json({ error: "Invalid webhook signature" });
        }
        const isValid = (0, payments_service_1.verifyWebhookSignature)(rawBody, signature, timestamp);
        if (!isValid) {
            console.warn("[Safepay] Webhook signature verification FAILED — rejecting request");
            return res.status(401).json({ error: "Invalid webhook signature" });
        }
        // Signature valid — parse the raw buffer to get the event data
        let eventPayload;
        try {
            eventPayload = JSON.parse(rawBody.toString("utf-8"));
        }
        catch {
            console.error("[Safepay] Failed to parse webhook body as JSON");
            return res.status(400).json({ error: "Invalid JSON" });
        }
        await (0, payments_service_1.processWebhookEvent)(eventPayload);
        // Always respond 200 to acknowledge receipt (Safepay retries on non-200)
        res.status(200).json({ received: true });
    }
    catch (err) {
        console.error("Webhook processing error:", err?.message || err);
        // Still return 200 to prevent Safepay from retrying endlessly on our bug
        res.status(200).json({ received: true, note: "Internal processing error logged" });
    }
}
//# sourceMappingURL=payments.controller.js.map
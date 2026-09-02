"use strict";
// =============================================================================
// Payments Feature — Route Definitions
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payments_controller_1 = require("./payments.controller");
const auth_optional_1 = require("../auth/auth.optional");
const router = (0, express_1.Router)();
// POST /api/payments/safepay/create — create checkout session (optional auth)
router.post("/safepay/create", auth_optional_1.optionalAuth, payments_controller_1.handleCreateCheckout);
// POST /api/payments/safepay/webhook — Safepay payment confirmation callback
// express.raw() gives us the raw Buffer in req.body for signature verification,
// scoped to this route only so all other routes keep using express.json().
router.post("/safepay/webhook", (0, express_1.raw)({ type: "application/json" }), payments_controller_1.handleSafepayWebhook);
exports.default = router;
//# sourceMappingURL=payments.routes.js.map
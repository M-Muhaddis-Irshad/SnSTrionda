// =============================================================================
// Payments Feature — Route Definitions
// =============================================================================

import { Router, raw } from "express";
import {
  handleCreateCheckout,
  handleVerifyTracker,
  handleSafepayWebhook,
} from "./payments.controller";
import { optionalAuth } from "../auth/auth.optional";

const router = Router();

// POST /api/payments/safepay/create — create checkout session (optional auth)
router.post("/safepay/create", optionalAuth, handleCreateCheckout);

// POST /api/payments/safepay/verify — verify a tracker server-side (optional auth)
router.post("/safepay/verify", optionalAuth, handleVerifyTracker);

// POST /api/payments/safepay/webhook — Safepay payment confirmation callback
// express.raw() gives us the raw Buffer in req.body for signature verification,
// scoped to this route only so all other routes keep using express.json().
router.post("/safepay/webhook", raw({ type: "application/json" }), handleSafepayWebhook);

export default router;

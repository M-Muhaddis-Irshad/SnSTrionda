// =============================================================================
// Payments Feature — Route Definitions
// =============================================================================

import { Router } from "express";
import {
  handleCreateCheckout,
  handleSafepayWebhook,
} from "./payments.controller";
import { optionalAuth } from "../auth/auth.optional";

const router = Router();

// POST /api/payments/safepay/create — create checkout session (optional auth)
router.post("/safepay/create", optionalAuth, handleCreateCheckout);

// POST /api/payments/safepay/webhook — Safepay payment confirmation callback
// NOTE: This route needs raw body for signature verification.
// The rawBody middleware is applied in app.ts for this route only.
router.post("/safepay/webhook", handleSafepayWebhook);

export default router;

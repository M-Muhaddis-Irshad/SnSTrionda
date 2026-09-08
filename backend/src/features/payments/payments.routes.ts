// =============================================================================
// Payments Feature — Route Definitions
// =============================================================================

import { Router, raw } from "express";
import multer from "multer";
import {
  handleCreateCheckout,
  handleVerifyTracker,
  handleSafepayWebhook,
  handleUploadJazzCashSlip,
  handleVerifyJazzCashSlip,
} from "./payments.controller";
import { optionalAuth } from "../auth/auth.optional";
import { authenticate } from "../auth/auth.middleware";

// JazzCash slip upload (5MB limit)
const slipUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, WebP, and GIF images are allowed."));
    }
  },
});

const router = Router();

// POST /api/payments/safepay/create — create checkout session (optional auth)
router.post("/safepay/create", optionalAuth, handleCreateCheckout);

// POST /api/payments/safepay/verify — verify a tracker server-side (optional auth)
router.post("/safepay/verify", optionalAuth, handleVerifyTracker);

// POST /api/payments/safepay/webhook — Safepay payment confirmation callback
// express.raw() gives us the raw Buffer in req.body for signature verification,
// scoped to this route only so all other routes keep using express.json().
router.post("/safepay/webhook", raw({ type: "application/json" }), handleSafepayWebhook);

// POST /api/payments/jazzcash/upload-slip — customer uploads payment slip
router.post("/jazzcash/upload-slip", authenticate, slipUpload.single("slip"), handleUploadJazzCashSlip);

// POST /api/payments/jazzcash/verify — admin approve/reject slip
router.post("/jazzcash/verify", authenticate, handleVerifyJazzCashSlip);

export default router;

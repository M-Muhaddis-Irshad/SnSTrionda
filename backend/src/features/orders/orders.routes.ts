// =============================================================================
// Orders Feature — Route Definitions
// =============================================================================

import { Router } from "express";
import {
  handleCreateOrder,
  handleGetOrder,
  handleGetMyOrders,
  handleGetMyOrder,
  handleValidatePromo,
} from "./orders.controller";
import { optionalAuth } from "../auth/auth.optional";
import { authenticate } from "../auth/auth.middleware";

const router = Router();

// GET /api/orders/promo/validate?code=... — public promo code validation
// Must come before /:orderNumber to avoid route collision
router.get("/promo/validate", handleValidatePromo);

// GET /api/orders/mine — customer's own orders list (authenticated)
// Must come before /:orderNumber to avoid route collision
router.get("/mine", authenticate, handleGetMyOrders);

// GET /api/orders/mine/:orderNumber — customer's own single order (authenticated)
router.get("/mine/:orderNumber", authenticate, handleGetMyOrder);

// GET /api/orders/:orderNumber — public, requires email verification
router.get("/:orderNumber", handleGetOrder);

// POST /api/orders — create order (optional auth for guest checkout)
router.post("/", optionalAuth, handleCreateOrder);

export default router;

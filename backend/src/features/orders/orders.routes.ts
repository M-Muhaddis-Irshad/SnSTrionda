// =============================================================================
// Orders Feature — Route Definitions
// =============================================================================

import { Router } from "express";
import { handleCreateOrder, handleGetOrder } from "./orders.controller";
import { optionalAuth } from "../auth/auth.optional";

const router = Router();

// GET /api/orders/:orderNumber — fetch order details
router.get("/:orderNumber", handleGetOrder);

// POST /api/orders — create order (optional auth for guest checkout)
router.post("/", optionalAuth, handleCreateOrder);

export default router;

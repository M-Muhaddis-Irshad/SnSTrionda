// =============================================================================
// Discounts Feature — Route Definitions
// =============================================================================
// Public:  GET  /api/discounts/active
// Admin:   /api/admin/discounts (mounted behind the admin auth middleware)
// =============================================================================

import { Router } from "express";
import {
  handleListActiveDiscounts,
  handleListDiscounts,
  handleCreateDiscount,
  handleUpdateDiscount,
  handleDeleteDiscount,
} from "./discount.controller";

// Public routes
export const discountPublicRoutes = Router();
discountPublicRoutes.get("/active", handleListActiveDiscounts);

// Admin routes (auth handled by the admin router that mounts this)
export const discountAdminRoutes = Router();
discountAdminRoutes.get("/", handleListDiscounts);
discountAdminRoutes.post("/", handleCreateDiscount);
discountAdminRoutes.put("/:discountId", handleUpdateDiscount);
discountAdminRoutes.delete("/:discountId", handleDeleteDiscount);

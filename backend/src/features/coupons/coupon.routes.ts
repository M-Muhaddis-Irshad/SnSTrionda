// =============================================================================
// Coupons Feature — Route Definitions
// =============================================================================
// Public:  GET  /api/coupons/validate?code=...&subtotal=...
// Admin:   /api/admin/coupons (mounted behind the admin auth middleware)
// =============================================================================

import { Router } from "express";
import {
  handleValidateCoupon,
  handleListCoupons,
  handleCreateCoupon,
  handleUpdateCoupon,
  handleDeleteCoupon,
} from "./coupon.controller";

// Public routes
export const couponPublicRoutes = Router();
couponPublicRoutes.get("/validate", handleValidateCoupon);

// Admin routes (auth handled by the admin router that mounts this)
export const couponAdminRoutes = Router();
couponAdminRoutes.get("/", handleListCoupons);
couponAdminRoutes.post("/", handleCreateCoupon);
couponAdminRoutes.put("/:couponId", handleUpdateCoupon);
couponAdminRoutes.delete("/:couponId", handleDeleteCoupon);

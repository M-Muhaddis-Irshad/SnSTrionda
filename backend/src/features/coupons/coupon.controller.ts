// =============================================================================
// Coupons Feature — Request Handlers (Controller)
// =============================================================================

import { Request, Response } from "express";
import {
  listCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCouponCode,
  CouponError,
} from "./coupon.service";
import { logAdminActivity, broadcastCatalogChange } from "../../services/socketService";

function handleError(err: any, res: Response) {
  if (err instanceof CouponError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  console.error("Coupon error:", err?.message || err);
  res.status(500).json({ error: "Internal server error" });
}

// ---------------------------------------------------------------------------
// Public — GET /api/coupons/validate?code=...&subtotal=...
// ---------------------------------------------------------------------------

export async function handleValidateCoupon(req: Request, res: Response) {
  try {
    const code = (req.query.code as string) || "";
    const subtotal = req.query.subtotal
      ? Number(req.query.subtotal)
      : undefined;
    const userId = (req as any).user?.userId;

    const result = await validateCouponCode(code, {
      subtotal: subtotal !== undefined && !isNaN(subtotal) ? subtotal : undefined,
      userId,
    });
    res.json(result);
  } catch (err: any) {
    console.error("Validate coupon error:", err?.message || err);
    res.status(500).json({ valid: false, message: "Could not validate coupon." });
  }
}

// ---------------------------------------------------------------------------
// Admin CRUD
// ---------------------------------------------------------------------------

export async function handleListCoupons(_req: Request, res: Response) {
  try {
    const coupons = await listCoupons();
    res.json({ data: coupons });
  } catch (err: any) {
    handleError(err, res);
  }
}

export async function handleCreateCoupon(req: Request, res: Response) {
  try {
    const coupon = await createCoupon(req.body);
    res.status(201).json({ data: coupon, message: "Coupon created successfully" });
    track(req, "CREATE_COUPON", "Coupon", coupon.id, { code: coupon.code });
    broadcastCatalogChange("created", "coupon", { id: coupon.id, code: coupon.code });
  } catch (err: any) {
    handleError(err, res);
  }
}

export async function handleUpdateCoupon(req: Request, res: Response) {
  try {
    const coupon = await updateCoupon(req.params.couponId as string, req.body);
    res.json({ data: coupon, message: "Coupon updated successfully" });
    track(req, "UPDATE_COUPON", "Coupon", coupon.id, { code: coupon.code });
    broadcastCatalogChange("updated", "coupon", { id: coupon.id, code: coupon.code });
  } catch (err: any) {
    handleError(err, res);
  }
}

export async function handleDeleteCoupon(req: Request, res: Response) {
  try {
    const couponId = req.params.couponId as string;
    const result = await deleteCoupon(couponId);
    res.json({ ...result, message: "Coupon deleted successfully" });
    track(req, "DELETE_COUPON", "Coupon", couponId);
    broadcastCatalogChange("deleted", "coupon", { id: couponId });
  } catch (err: any) {
    handleError(err, res);
  }
}

// ---------------------------------------------------------------------------
// Audit trail helper
// ---------------------------------------------------------------------------

function track(
  req: Request,
  action: string,
  entityType: string,
  entityId: string,
  details?: Record<string, unknown>
) {
  const adminId = req.user?.userId;
  if (!adminId) return;
  logAdminActivity(adminId, action, entityType, entityId, details ?? null).catch(() => {});
}

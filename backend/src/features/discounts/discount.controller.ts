// =============================================================================
// Discounts Feature — Request Handlers (Controller)
// =============================================================================

import { Request, Response } from "express";
import {
  listDiscounts,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  listActiveDiscounts,
  DiscountError,
} from "./discount.service";
import { logAdminActivity, broadcastCatalogChange } from "../../services/socketService";

function handleError(err: any, res: Response) {
  if (err instanceof DiscountError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  console.error("Discount error:", err?.message || err);
  res.status(500).json({ error: "Internal server error" });
}

// ---------------------------------------------------------------------------
// Public — GET /api/discounts/active (live discounts for storefront use)
// ---------------------------------------------------------------------------

export async function handleListActiveDiscounts(_req: Request, res: Response) {
  try {
    const discounts = await listActiveDiscounts();
    res.json({ data: discounts });
  } catch (err: any) {
    console.error("List active discounts error:", err?.message || err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// ---------------------------------------------------------------------------
// Admin CRUD
// ---------------------------------------------------------------------------

export async function handleListDiscounts(_req: Request, res: Response) {
  try {
    const discounts = await listDiscounts();
    res.json({ data: discounts });
  } catch (err: any) {
    handleError(err, res);
  }
}

export async function handleCreateDiscount(req: Request, res: Response) {
  try {
    const discount = await createDiscount(req.body);
    res.status(201).json({ data: discount, message: "Discount created successfully" });
    track(req, "CREATE_DISCOUNT", "Discount", discount.id, { name: discount.name });
    broadcastCatalogChange("created", "discount", { id: discount.id, productId: discount.productId });
  } catch (err: any) {
    handleError(err, res);
  }
}

export async function handleUpdateDiscount(req: Request, res: Response) {
  try {
    const discount = await updateDiscount(req.params.discountId as string, req.body);
    res.json({ data: discount, message: "Discount updated successfully" });
    track(req, "UPDATE_DISCOUNT", "Discount", discount.id, { name: discount.name });
    broadcastCatalogChange("updated", "discount", { id: discount.id, productId: discount.productId });
  } catch (err: any) {
    handleError(err, res);
  }
}

export async function handleDeleteDiscount(req: Request, res: Response) {
  try {
    const discountId = req.params.discountId as string;
    const result = await deleteDiscount(discountId);
    res.json({ ...result, message: "Discount deleted successfully" });
    track(req, "DELETE_DISCOUNT", "Discount", discountId);
    broadcastCatalogChange("deleted", "discount", { id: discountId });
  } catch (err: any) {
    handleError(err, res);
  }
}

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

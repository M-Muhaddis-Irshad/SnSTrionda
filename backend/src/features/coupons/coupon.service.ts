// =============================================================================
// Coupons Feature — Business Logic Service
// =============================================================================
// Coupon types:
//   PERCENT — `value` is a percentage (0-100) off the subtotal, capped at
//             `maxDiscount` when set.
//   FLAT    — `value` is a fixed PKR amount off the subtotal.
// Rules: active flag, date window (startsAt/expiresAt), minimum subtotal,
// total usage limit, and per-user redemption limit are all enforced here so
// both the checkout and the public validate endpoint share one source of truth.
// =============================================================================

import { prisma } from "../../db";

// ---------------------------------------------------------------------------
// Custom error
// ---------------------------------------------------------------------------

export class CouponError extends Error {
  public statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = "CouponError";
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CouponInput {
  code: string;
  description?: string;
  type?: "PERCENT" | "FLAT";
  value: number;
  minOrder?: number;
  maxDiscount?: number;
  usageLimit?: number;
  perUserLimit?: number;
  startsAt?: string | null;
  expiresAt?: string | null;
  active?: boolean;
}

export interface ValidateOptions {
  subtotal?: number;
  userId?: string;
}

export interface ValidateResult {
  valid: boolean;
  code?: string;
  couponId?: string;
  discountPercent?: number;
  discountAmount?: number;
  message: string;
}

// ---------------------------------------------------------------------------
// Admin — list / create / update / delete
// ---------------------------------------------------------------------------

const COUPON_SELECT = {
  id: true,
  code: true,
  description: true,
  type: true,
  value: true,
  minOrder: true,
  maxDiscount: true,
  usageLimit: true,
  perUserLimit: true,
  usedCount: true,
  startsAt: true,
  expiresAt: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function listCoupons() {
  return prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
    select: COUPON_SELECT,
  });
}

function normalizeCouponInput(input: CouponInput) {
  const code = (input.code || "").trim().toUpperCase().replace(/\s+/g, "");
  if (!code) throw new CouponError("Coupon code is required", 400);

  const type = input.type === "FLAT" ? "FLAT" : "PERCENT";
  const value = Number(input.value);
  if (isNaN(value) || value < 0) {
    throw new CouponError("Coupon value must be a positive number", 400);
  }
  if (type === "PERCENT" && value > 100) {
    throw new CouponError("Percentage value cannot exceed 100", 400);
  }

  const numOrUndef = (v: any) => (v === undefined || v === null || v === "" ? undefined : Number(v));
  const dateOrNull = (v: any) => (v === undefined || v === null || v === "" ? null : new Date(v as string));

  const minOrder = numOrUndef(input.minOrder);
  const maxDiscount = numOrUndef(input.maxDiscount);
  const usageLimit = numOrUndef(input.usageLimit);
  const perUserLimit = numOrUndef(input.perUserLimit);

  if (minOrder !== undefined && (isNaN(minOrder) || minOrder < 0)) {
    throw new CouponError("Minimum order must be a positive number", 400);
  }
  if (maxDiscount !== undefined && (isNaN(maxDiscount) || maxDiscount < 0)) {
    throw new CouponError("Maximum discount must be a positive number", 400);
  }
  if (usageLimit !== undefined && (isNaN(usageLimit) || usageLimit < 1)) {
    throw new CouponError("Usage limit must be at least 1", 400);
  }
  if (perUserLimit !== undefined && (isNaN(perUserLimit) || perUserLimit < 1)) {
    throw new CouponError("Per-user limit must be at least 1", 400);
  }

  const startsAt = dateOrNull(input.startsAt);
  const expiresAt = dateOrNull(input.expiresAt);
  if (startsAt && expiresAt && startsAt > expiresAt) {
    throw new CouponError("Start date cannot be after the expiry date", 400);
  }

  return {
    code,
    description: input.description?.trim() || null,
    type,
    value,
    minOrder: minOrder ?? null,
    maxDiscount: maxDiscount ?? null,
    usageLimit: usageLimit ?? null,
    perUserLimit: perUserLimit ?? null,
    startsAt,
    expiresAt,
  };
}

export async function createCoupon(input: CouponInput) {
  const data = normalizeCouponInput(input);
  const existing = await prisma.coupon.findUnique({ where: { code: data.code } });
  if (existing) {
    throw new CouponError(`A coupon with code \"${data.code}\" already exists`, 400);
  }
  return prisma.coupon.create({
    data: { ...data, active: input.active !== undefined ? Boolean(input.active) : true },
    select: COUPON_SELECT,
  });
}

export async function updateCoupon(couponId: string, input: CouponInput) {
  const existing = await prisma.coupon.findUnique({ where: { id: couponId } });
  if (!existing) throw new CouponError("Coupon not found", 404);

  const data = normalizeCouponInput(input);
  if (data.code !== existing.code) {
    const dup = await prisma.coupon.findUnique({ where: { code: data.code } });
    if (dup) throw new CouponError(`A coupon with code \"${data.code}\" already exists`, 400);
  }

  return prisma.coupon.update({
    where: { id: couponId },
    data: { ...data, active: input.active !== undefined ? Boolean(input.active) : existing.active },
    select: COUPON_SELECT,
  });
}

export async function deleteCoupon(couponId: string) {
  const existing = await prisma.coupon.findUnique({ where: { id: couponId } });
  if (!existing) throw new CouponError("Coupon not found", 404);
  await prisma.coupon.delete({ where: { id: couponId } });
  return { deleted: true, couponId };
}

// ---------------------------------------------------------------------------
// Validation — shared by GET /api/coupons/validate and order creation
// ---------------------------------------------------------------------------

export async function validateCouponCode(
  code?: string,
  opts: ValidateOptions = {}
): Promise<ValidateResult> {
  if (!code || !code.trim()) {
    return { valid: false, message: "Enter a coupon code." };
  }
  const normalized = code.trim().toUpperCase();
  const coupon = await prisma.coupon.findUnique({ where: { code: normalized } });

  if (!coupon || !coupon.active) {
    return { valid: false, code: normalized, message: "Invalid or inactive coupon code." };
  }

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) {
    return { valid: false, code: normalized, message: "This coupon is not active yet." };
  }
  if (coupon.expiresAt && coupon.expiresAt < now) {
    return { valid: false, code: normalized, message: "This coupon has expired." };
  }

  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    return { valid: false, code: normalized, message: "This coupon has reached its usage limit." };
  }

  // Per-user limit (only enforceable for identified users; guests still count
  // toward the global usageLimit via the order transaction).
  if (opts.userId) {
    const perUserLimit = coupon.perUserLimit ?? 1;
    const userRedemptions = await prisma.couponRedemption.count({
      where: { couponId: coupon.id, userId: opts.userId },
    });
    if (userRedemptions >= perUserLimit) {
      return {
        valid: false,
        code: normalized,
        message: "You have already used this coupon.",
      };
    }
  }

  const value = Number(coupon.value);
  const subtotal = opts.subtotal ?? 0;

  if (coupon.minOrder !== null && subtotal > 0 && subtotal < Number(coupon.minOrder)) {
    return {
      valid: false,
      code: normalized,
      message: `Add more items — this coupon requires a minimum order of Rs. ${Number(
        coupon.minOrder
      ).toLocaleString("en-PK")}.`,
    };
  }

  // Percent vs flat
  if (coupon.type === "FLAT") {
    const amount = Math.min(value, subtotal > 0 ? subtotal : value);
    return {
      valid: true,
      code: normalized,
      couponId: coupon.id,
      discountAmount: Math.round(amount),
      message: `Coupon applied — Rs. ${Math.round(amount).toLocaleString("en-PK")} off.`,
    };
  }

  const percent = value;
  const cappedAmount = coupon.maxDiscount !== null
    ? Math.min(Math.round((subtotal * percent) / 100), Number(coupon.maxDiscount))
    : Math.round((subtotal * percent) / 100);
  return {
    valid: true,
    code: normalized,
    couponId: coupon.id,
    discountPercent: percent,
    discountAmount: subtotal > 0 ? cappedAmount : undefined,
    message: `Coupon applied — ${percent}% off your subtotal.`,
  };
}

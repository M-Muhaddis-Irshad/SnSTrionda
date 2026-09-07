// =============================================================================
// Discounts Feature — Business Logic Service
// =============================================================================
// Product-level sale pricing. type: PERCENT (value 0-100) or FLAT (value PKR).
// The storefront never reads this table directly — the products API computes a
// `discountedPrice` per product from whichever discount is live right now.
// =============================================================================

import { prisma } from "../../db";

export class DiscountError extends Error {
  public statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = "DiscountError";
  }
}

export interface DiscountInput {
  name: string;
  type?: "PERCENT" | "FLAT";
  value: number;
  productId: string;
  startsAt?: string | null;
  expiresAt?: string | null;
  active?: boolean;
}

const DISCOUNT_SELECT = {
  id: true,
  name: true,
  type: true,
  value: true,
  productId: true,
  startsAt: true,
  expiresAt: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} as const;

// ---------------------------------------------------------------------------
// Admin — list (with product info) / create / update / delete
// ---------------------------------------------------------------------------

export async function listDiscounts() {
  return prisma.discount.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      ...DISCOUNT_SELECT,
      product: { select: { id: true, name: true, slug: true, basePrice: true } },
    },
  });
}

function normalizeInput(input: DiscountInput) {
  const name = input.name?.trim();
  if (!name) throw new DiscountError("Discount name is required", 400);
  if (!input.productId) throw new DiscountError("A product must be selected", 400);

  const type = input.type === "FLAT" ? "FLAT" : "PERCENT";
  const value = Number(input.value);
  if (isNaN(value) || value < 0) {
    throw new DiscountError("Discount value must be a positive number", 400);
  }
  if (type === "PERCENT" && value > 100) {
    throw new DiscountError("Percentage value cannot exceed 100", 400);
  }

  const dateOrNull = (v: any) => (v === undefined || v === null || v === "" ? null : new Date(v as string));
  const startsAt = dateOrNull(input.startsAt);
  const expiresAt = dateOrNull(input.expiresAt);
  if (startsAt && expiresAt && startsAt > expiresAt) {
    throw new DiscountError("Start date cannot be after the expiry date", 400);
  }

  return { name, type, value, productId: input.productId, startsAt, expiresAt };
}

export async function createDiscount(input: DiscountInput) {
  const data = normalizeInput(input);
  const product = await prisma.product.findUnique({ where: { id: data.productId } });
  if (!product) throw new DiscountError("Product not found", 400);

  return prisma.discount.create({
    data: { ...data, active: input.active !== undefined ? Boolean(input.active) : true },
    select: {
      ...DISCOUNT_SELECT,
      product: { select: { id: true, name: true, slug: true, basePrice: true } },
    },
  });
}

export async function updateDiscount(discountId: string, input: DiscountInput) {
  const existing = await prisma.discount.findUnique({ where: { id: discountId } });
  if (!existing) throw new DiscountError("Discount not found", 404);

  const data = normalizeInput(input);
  const product = await prisma.product.findUnique({ where: { id: data.productId } });
  if (!product) throw new DiscountError("Product not found", 400);

  return prisma.discount.update({
    where: { id: discountId },
    data: { ...data, active: input.active !== undefined ? Boolean(input.active) : existing.active },
    select: {
      ...DISCOUNT_SELECT,
      product: { select: { id: true, name: true, slug: true, basePrice: true } },
    },
  });
}

export async function deleteDiscount(discountId: string) {
  const existing = await prisma.discount.findUnique({ where: { id: discountId } });
  if (!existing) throw new DiscountError("Discount not found", 404);
  await prisma.discount.delete({ where: { id: discountId } });
  return { deleted: true, discountId };
}

// ---------------------------------------------------------------------------
// Public — live discounts keyed by product (used by storefront endpoints)
// ---------------------------------------------------------------------------

export async function listActiveDiscounts() {
  const discounts = await prisma.discount.findMany({
    where: { active: true, product: { isActive: true } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      type: true,
      value: true,
      startsAt: true,
      expiresAt: true,
      product: { select: { id: true, slug: true, basePrice: true } },
    },
  });
  // Filter the live date window in JS (null = unbounded)
  const now = new Date();
  return (discounts as any[]).filter(
    (d) =>
      (!d.startsAt || new Date(d.startsAt) <= now) &&
      (!d.expiresAt || new Date(d.expiresAt) >= now)
  );
}

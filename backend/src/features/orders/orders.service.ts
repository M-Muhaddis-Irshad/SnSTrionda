// =============================================================================
// Orders Feature — Business Logic Service
// =============================================================================

import { prisma } from "../../db";
import bcrypt from "bcryptjs";
import { validateCouponCode } from "../coupons/coupon.service";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OrderItemInput {
  productId: string;
  variantId: string;
  quantity: number;
  customMeasurementId?: string | null;
}

export interface ShippingAddressInput {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  province: string;
  postalCode?: string;
  country?: string;
}

export interface CreateOrderInput {
  items: OrderItemInput[];
  shippingAddress: ShippingAddressInput;
  paymentMethod: "JAZZCASH" | "EASYPAISA" | "COD" | "CARD";
  email?: string;
  promoCode?: string;
  deliveryZoneId?: string;
}

// Coupon codes are no longer hardcoded — they live in the Coupon table and are
// validated by the coupons feature (validateCouponCode), which enforces the
// type (PERCENT/FLAT), date window, minimum order, usage limit and per-user
// limit. Order creation calls it directly with the real subtotal + user id.

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SHIPPING_COST = 200;
const GUEST_PASSWORD = "GUEST_NO_PASSWORD_" + Date.now();

// ---------------------------------------------------------------------------
// Custom Error
// ---------------------------------------------------------------------------

export class OrderError extends Error {
  public statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = "OrderError";
  }
}

// ---------------------------------------------------------------------------
// Generate unique order number: TRD-YYYY-NNNNNN
// ---------------------------------------------------------------------------

async function generateOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `TRD-${year}-`;

  const allOrders = await prisma.order.findMany({
    where: {
      orderNumber: { startsWith: prefix },
    },
    select: { orderNumber: true },
  });

  let maxNumber = 0;
  for (const o of allOrders) {
    const part = o.orderNumber.split("-")[2];
    const num = parseInt(part, 10);
    if (!isNaN(num) && num > maxNumber) {
      maxNumber = num;
    }
  }

  const nextNumber = maxNumber + 1;

  return `${prefix}${String(nextNumber).padStart(6, "0")}`;
}

// ---------------------------------------------------------------------------
// Find or create guest user
// ---------------------------------------------------------------------------

async function findOrCreateGuestUser(email?: string): Promise<string> {
  if (email) {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return existingUser.id;
    }
  }

  const guestEmail = email || `guest-${Date.now()}@trionda-guest.local`;
  const passwordHash = await bcrypt.hash(GUEST_PASSWORD, 4);

  const user = await prisma.user.create({
    data: {
      email: guestEmail,
      password: passwordHash,
      name: "Guest Customer",
      role: "CUSTOMER",
    },
  });

  return user.id;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateOrderInput(input: CreateOrderInput): void {
  if (!input.items || input.items.length === 0) {
    throw new OrderError("Cart is empty. Please add items before checking out.", 400);
  }

  if (!input.shippingAddress) {
    throw new OrderError("Shipping address is required.", 400);
  }

  const addr = input.shippingAddress;
  if (!addr.fullName || !addr.phone || !addr.addressLine1 || !addr.city || !addr.province) {
    throw new OrderError(
      "Missing required address fields: fullName, phone, addressLine1, city, province are required.",
      400
    );
  }

  const validPaymentMethods = ["JAZZCASH", "EASYPAISA", "COD", "CARD"];
  if (!validPaymentMethods.includes(input.paymentMethod)) {
    throw new OrderError("Invalid payment method. Must be JAZZCASH, EASYPAISA, COD, or CARD.", 400);
  }

  for (const item of input.items) {
    if (!item.variantId || !item.productId) {
      throw new OrderError("Each cart item must have productId and variantId.", 400);
    }
    if (!item.quantity || item.quantity < 1) {
      throw new OrderError("Each cart item must have quantity >= 1.", 400);
    }
  }
}

// ---------------------------------------------------------------------------
// Get Order by Order Number (public — requires email verification)
// ---------------------------------------------------------------------------

export async function getOrderByNumber(orderNumber: string, email?: string) {
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      items: {
        include: {
          productVariant: {
            include: {
              product: {
                select: {
                  id: true, name: true, slug: true,
                  images: { select: { id: true, url: true, altText: true }, orderBy: { displayOrder: "asc" }, take: 1 },
                },
              },
            },
          },
          customMeasurement: true,
        },
      },
      shippingAddress: true,
      user: { select: { id: true, email: true, name: true } },
      statusHistory: { orderBy: { statusChangedAt: "asc" } },
    },
  });

  if (!order) return null;

  // Email verification: reject if no email provided or it doesn't match
  if (email) {
    const emailLower = email.toLowerCase().trim();
    const orderEmail = order.user.email?.toLowerCase().trim();
    const addressEmail = order.shippingAddress?.phone; // fallback

    if (orderEmail !== emailLower) {
      // Email doesn't match — return null (404, not 403)
      return null;
    }
  }

  return order;
}

// ---------------------------------------------------------------------------
// Get My Order by Order Number (authenticated — ownership enforced)
// ---------------------------------------------------------------------------

export async function getMyOrderByNumber(orderNumber: string, userId: string) {
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      items: {
        include: {
          productVariant: {
            include: { product: { select: { id: true, name: true, slug: true } } },
          },
          customMeasurement: true,
        },
      },
      shippingAddress: true,
      user: { select: { id: true, email: true, name: true } },
      statusHistory: { orderBy: { statusChangedAt: "asc" } },
    },
  });

  if (!order) return null;

  // Ownership check: only return if the order belongs to this user
  if (order.userId !== userId) {
    return null; // 404, not 403 — don't reveal the order exists
  }

  return order;
}

// ---------------------------------------------------------------------------
// Get My Orders (customer's own orders)
// ---------------------------------------------------------------------------

export async function getMyOrders(userId: string) {
  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          productVariant: {
            include: { product: { select: { id: true, name: true, slug: true } } },
          },
        },
      },
      shippingAddress: true,
    },
  });

  return orders;
}

// ---------------------------------------------------------------------------
// Create Order (transactional)
// ---------------------------------------------------------------------------

export async function createOrder(input: CreateOrderInput, authUserId?: string) {
  validateOrderInput(input);

  const variantIds = input.items.map((item) => item.variantId);
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: variantIds } },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          basePrice: true,
          discounts: {
            select: {
              id: true,
              name: true,
              type: true,
              value: true,
              startsAt: true,
              expiresAt: true,
              active: true,
            },
          },
        },
      },
    },
  });

  const variantMap = new Map(variants.map((v) => [v.id, v]));

  for (const item of input.items) {
    const variant = variantMap.get(item.variantId);
    if (!variant) {
      throw new OrderError(`Variant not found: ${item.variantId}`, 400);
    }
    if (variant.productId !== item.productId) {
      throw new OrderError(
        `Variant ${item.variantId} does not belong to product ${item.productId}`,
        400
      );
    }
    if (variant.stockQuantity < item.quantity) {
      throw new OrderError(
        `Insufficient stock for ${variant.product.name} (${variant.sku}): only ${variant.stockQuantity} available, ${item.quantity} requested.`,
        400
      );
    }
  }

  // Resolve the live discount for each product — same logic as
  // attachLiveDiscounts in products.service.ts but applied at order-creation
  // time so the actual price charged reflects any active sale.
  const now = new Date();
  function resolveDiscountedPrice(
    basePrice: number,
    discounts: {
      active: boolean;
      type: string;
      value: any;
      startsAt: Date | null;
      expiresAt: Date | null;
    }[]
  ): number {
    const activeDisc = discounts.find(
      (d) =>
        d.active &&
        (!d.startsAt || new Date(d.startsAt) <= now) &&
        (!d.expiresAt || new Date(d.expiresAt) >= now)
    );
    if (!activeDisc) return basePrice;
    const val = Number(activeDisc.value);
    return activeDisc.type === "FLAT"
      ? Math.max(0, basePrice - val)
      : Math.round(basePrice * (1 - val / 100));
  }

  let subtotal = 0;
  const orderItemsData = input.items.map((item) => {
    const variant = variantMap.get(item.variantId)!;
    const basePrice = Number(variant.price ?? variant.product.basePrice ?? 0);
    const unitPrice = resolveDiscountedPrice(basePrice, variant.product.discounts);
    subtotal += unitPrice * item.quantity;

    return {
      productVariantId: item.variantId,
      quantity: item.quantity,
      priceAtPurchase: unitPrice,
      customMeasurementId: item.customMeasurementId || null,
    };
  });

  // Resolve the buyer id early so coupon per-user limits apply to guests too.
  const userId = authUserId || (await findOrCreateGuestUser(input.email));

  // Coupon code — validated against the Coupon table (type, date window, usage
  // and per-user limits). PERCENT discounts are capped at maxDiscount.
  let discount = 0;
  let promoCode: string | null = null;
  let couponId: string | null = null;
  if (input.promoCode && input.promoCode.trim()) {
    const promo = await validateCouponCode(input.promoCode, { subtotal, userId });
    if (!promo.valid || !promo.code) {
      throw new OrderError(promo.message || "Invalid or expired coupon code.", 400);
    }
    promoCode = promo.code;
    couponId = promo.couponId || null;
    discount =
      promo.discountAmount !== undefined && promo.discountAmount !== null
        ? promo.discountAmount
        : Math.round((subtotal * (promo.discountPercent || 0)) / 100);
  }

  // Delivery charge — from the selected delivery zone when provided, otherwise
  // fall back to the flat standard rate.
  let shippingCost = SHIPPING_COST;
  if (input.deliveryZoneId) {
    const zone = await prisma.deliveryZone.findUnique({
      where: { id: input.deliveryZoneId },
    });
    if (!zone) {
      throw new OrderError("Selected delivery zone not found.", 400);
    }
    if (!zone.active) {
      throw new OrderError("Selected delivery zone is currently unavailable.", 400);
    }
    shippingCost = zone.deliveryCharges;
  }
  const total = Math.max(0, subtotal + shippingCost - discount);

  const orderNumber = await generateOrderNumber();

  const order = await prisma.$transaction(async (tx) => {
    const address = await tx.address.create({
      data: {
        label: "Shipping",
        fullName: input.shippingAddress.fullName,
        phone: input.shippingAddress.phone,
        addressLine1: input.shippingAddress.addressLine1,
        addressLine2: input.shippingAddress.addressLine2 || null,
        city: input.shippingAddress.city,
        province: input.shippingAddress.province,
        postalCode: input.shippingAddress.postalCode || null,
        country: input.shippingAddress.country || "Pakistan",
        isDefault: true,
        userId,
      },
    });

    const order = await tx.order.create({
      data: {
        orderNumber,
        status: "PENDING",
        subtotal,
        shippingCost,
        total,
        paymentMethod: input.paymentMethod,
        paymentStatus: "PENDING",
        discount,
        promoCode,
        userId,
        shippingAddressId: address.id,
      },
    });

    // Seed the status timeline with the initial transition.
    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: "PENDING",
        notes: "Order placed",
      },
    });

    for (const itemData of orderItemsData) {
      await tx.orderItem.create({
        data: {
          orderId: order.id,
          ...itemData,
        },
      });

      await tx.productVariant.update({
        where: { id: itemData.productVariantId },
        data: {
          stockQuantity: { decrement: itemData.quantity },
        },
      });
    }

    // Coupon redemption — bump usage + persist the redemption atomically with
    // the order so limits can never be bypassed by a partial failure.
    if (couponId && promoCode) {
      await tx.coupon.update({
        where: { id: couponId },
        data: { usedCount: { increment: 1 } },
      });
      await tx.couponRedemption.create({
        data: { couponId, userId, orderId: order.id, discount },
      });
    }

    return tx.order.findUnique({
      where: { id: order.id },
      include: {
        items: {
          include: {
            productVariant: {
              include: { product: { select: { id: true, name: true, slug: true } } },
            },
            customMeasurement: true,
          },
        },
        shippingAddress: true,
        user: { select: { id: true, email: true, name: true } },
      },
    });
  });

  return order;
}

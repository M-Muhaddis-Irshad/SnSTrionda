// =============================================================================
// Orders Feature — Business Logic Service
// =============================================================================

import { prisma } from "../../db";
import bcrypt from "bcryptjs";

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
}

// ---------------------------------------------------------------------------
// Promo codes — server-validated, percent discount off subtotal
// ---------------------------------------------------------------------------

export const PROMO_CODES: Record<string, number> = {
  TRIONDA10: 10,
  TRIONDA20: 20,
};

export function validatePromoCode(code?: string) {
  if (!code || !code.trim()) {
    return { valid: false, message: "Enter a promo code." };
  }
  const normalized = code.trim().toUpperCase();
  const percent = PROMO_CODES[normalized];
  if (!percent) {
    return { valid: false, message: "Invalid or expired promo code." };
  }
  return { valid: true, code: normalized, discountPercent: percent, message: `Promo applied — ${percent}% off your subtotal.` };
}

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
            include: { product: { select: { name: true, slug: true } } },
          },
          customMeasurement: true,
        },
      },
      shippingAddress: true,
      user: { select: { id: true, email: true, name: true } },
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
            include: { product: { select: { name: true, slug: true } } },
          },
          customMeasurement: true,
        },
      },
      shippingAddress: true,
      user: { select: { id: true, email: true, name: true } },
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
            include: { product: { select: { name: true, slug: true } } },
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
      product: { select: { id: true, name: true, slug: true, basePrice: true } },
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

  let subtotal = 0;
  const orderItemsData = input.items.map((item) => {
    const variant = variantMap.get(item.variantId)!;
    const unitPrice = Number(variant.price ?? variant.product.basePrice ?? 0);
    subtotal += unitPrice * item.quantity;

    return {
      productVariantId: item.variantId,
      quantity: item.quantity,
      priceAtPurchase: unitPrice,
      customMeasurementId: item.customMeasurementId || null,
    };
  });

  // Promo code — server validated, percent discount off subtotal
  let discount = 0;
  let promoCode: string | null = null;
  if (input.promoCode && input.promoCode.trim()) {
    const promo = validatePromoCode(input.promoCode);
    if (!promo.valid || !promo.code) {
      throw new OrderError("Invalid or expired promo code.", 400);
    }
    discount = (subtotal * promo.discountPercent!) / 100;
    promoCode = promo.code;
  }

  const shippingCost = SHIPPING_COST;
  const total = Math.max(0, subtotal + shippingCost - discount);

  const userId = authUserId || (await findOrCreateGuestUser(input.email));
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

    return tx.order.findUnique({
      where: { id: order.id },
      include: {
        items: {
          include: {
            productVariant: {
              include: { product: { select: { name: true, slug: true } } },
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

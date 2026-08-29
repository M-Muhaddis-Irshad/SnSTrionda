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
  email?: string; // For guest users — used to create/find guest account
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SHIPPING_COST = 200; // Flat rate Rs. 200
const GUEST_PASSWORD = "GUEST_NO_PASSWORD_" + Date.now(); // Random unusable password

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

  // Find the highest existing numeric order number for this year
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
  // If email provided, try to find existing user first
  if (email) {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return existingUser.id;
    }
  }

  // Create a new guest user
  const guestEmail = email || `guest-${Date.now()}@trionda-guest.local`;
  const passwordHash = await bcrypt.hash(GUEST_PASSWORD, 4); // Low rounds — this password is unusable

  const user = await prisma.user.create({
    data: {
      email: guestEmail,
      passwordHash,
      firstName: "Guest",
      lastName: "Customer",
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
// Get Order by Order Number
// ---------------------------------------------------------------------------

export async function getOrderByNumber(orderNumber: string) {
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
      user: { select: { id: true, email: true, firstName: true, lastName: true } },
    },
  });

  return order;
}

// ---------------------------------------------------------------------------
// Create Order (transactional)
// ---------------------------------------------------------------------------

export async function createOrder(input: CreateOrderInput, authUserId?: string) {
  validateOrderInput(input);

  // Fetch all variants in one query for price lookup + stock validation
  const variantIds = input.items.map((item) => item.variantId);
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: variantIds } },
    include: {
      product: { select: { id: true, name: true, slug: true, basePrice: true } },
    },
  });

  // Build a map for quick lookup
  const variantMap = new Map(variants.map((v) => [v.id, v]));

  // Validate all variants exist and have sufficient stock
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

  // Calculate totals server-side (never trust client totals)
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

  const shippingCost = SHIPPING_COST;
  const total = subtotal + shippingCost;

  // Determine userId: use auth user if provided, otherwise find/create guest
  const userId = authUserId || (await findOrCreateGuestUser(input.email));

  // Generate unique order number
  const orderNumber = await generateOrderNumber();

  // Execute everything in a single transaction
  const order = await prisma.$transaction(async (tx) => {
    // 1. Create address
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

    // 2. Create order
    const order = await tx.order.create({
      data: {
        orderNumber,
        status: "PENDING",
        subtotal,
        shippingCost,
        total,
        paymentMethod: input.paymentMethod,
        paymentStatus: "PENDING",
        userId,
        shippingAddressId: address.id,
      },
    });

    // 3. Create order items + decrement stock
    for (const itemData of orderItemsData) {
      await tx.orderItem.create({
        data: {
          orderId: order.id,
          ...itemData,
        },
      });

      // Decrement stock
      await tx.productVariant.update({
        where: { id: itemData.productVariantId },
        data: {
          stockQuantity: { decrement: itemData.quantity },
        },
      });
    }

    // 4. Return the full order with relations
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
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  });

  return order;
}

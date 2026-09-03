// =============================================================================
// Admin Feature — Business Logic Service
// =============================================================================

import { prisma } from "../../db";
import { broadcastOrderStatusUpdate } from "../../services/socketService";

// ---------------------------------------------------------------------------
// Custom Error
// ---------------------------------------------------------------------------

export class AdminError extends Error {
  public statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AdminError";
  }
}

// ===========================================================================
// DASHBOARD STATS
// ===========================================================================

export async function getDashboardStats() {
  const [
    totalOrders,
    totalRevenue,
    totalProducts,
    totalCustomers,
    recentOrders,
    lowStockProducts,
  ] = await Promise.all([
    // Total orders
    prisma.order.count(),

    // Total revenue (sum of PAID orders)
    prisma.order.aggregate({
      where: { paymentStatus: "PAID" },
      _sum: { total: true },
    }),

    // Total products
    prisma.product.count({ where: { isActive: true } }),

    // Total customers
    prisma.user.count({ where: { role: "CUSTOMER" } }),

    // Recent orders (last 10)
    prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { email: true, name: true } },
        items: {
          select: { quantity: true },
        },
      },
    }),

    // Low stock products (stock < 5)
    prisma.productVariant.findMany({
      where: {
        stockQuantity: { lt: 5 },
        product: { isActive: true },
      },
      include: {
        product: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { stockQuantity: "asc" },
      take: 20,
    }),
  ]);

  // Revenue by day (last 7 days) for the chart
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const dailyOrders = await prisma.order.findMany({
    where: {
      createdAt: { gte: sevenDaysAgo },
    },
    select: {
      createdAt: true,
      total: true,
      paymentStatus: true,
    },
    orderBy: { createdAt: "asc" },
  });

  // Aggregate by day
  const dayMap = new Map<string, { revenue: number; orders: number }>();
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Initialize last 7 days
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    dayMap.set(key, { revenue: 0, orders: 0 });
  }

  for (const order of dailyOrders) {
    const key = order.createdAt.toISOString().split("T")[0];
    if (dayMap.has(key)) {
      const entry = dayMap.get(key)!;
      entry.orders++;
      if (order.paymentStatus === "PAID") {
        entry.revenue += Number(order.total);
      }
    }
  }

  const revenueByDay = Array.from(dayMap.entries()).map(([date, data]) => {
    const d = new Date(date + "T00:00:00Z");
    return {
      date,
      day: dayNames[d.getUTCDay()],
      revenue: data.revenue,
      orders: data.orders,
    };
  });

  return {
    totalOrders,
    totalRevenue: Number(totalRevenue._sum.total || 0),
    totalProducts,
    totalCustomers,
    recentOrders,
    lowStockProducts,
    revenueByDay,
  };
}

// ===========================================================================
// ORDER MANAGEMENT (Admin)
// ===========================================================================

export interface OrderListParams {
  page: number;
  limit: number;
  status?: string;
  search?: string;
}

export async function listOrders(params: OrderListParams) {
  const { page, limit, status, search } = params;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (status) {
    where.status = status;
  }
  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: "insensitive" } },
      { user: { email: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, email: true, name: true } },
        items: {
          select: { quantity: true, priceAtPurchase: true },
        },
        shippingAddress: {
          select: { city: true, province: true, country: true },
        },
      },
    }),
    prisma.order.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: orders,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

export async function getOrderById(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { id: true, email: true, name: true } },
      items: {
        include: {
          productVariant: {
            include: {
              product: { select: { id: true, name: true, slug: true } },
            },
          },
          customMeasurement: true,
        },
      },
      shippingAddress: true,
      statusHistory: { orderBy: { statusChangedAt: "asc" } },
    },
  });

  if (!order) {
    throw new AdminError("Order not found", 404);
  }

  return order;
}

const VALID_ORDER_STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
const VALID_PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED", "REFUNDED"];

export async function updateOrderStatus(
  orderId: string,
  body: { status?: string; paymentStatus?: string },
  adminId?: string
) {
  const { status, paymentStatus } = body;

  if (status && !VALID_ORDER_STATUSES.includes(status)) {
    throw new AdminError(`Invalid order status. Must be one of: ${VALID_ORDER_STATUSES.join(", ")}`, 400);
  }
  if (paymentStatus && !VALID_PAYMENT_STATUSES.includes(paymentStatus)) {
    throw new AdminError(`Invalid payment status. Must be one of: ${VALID_PAYMENT_STATUSES.join(", ")}`, 400);
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    throw new AdminError("Order not found", 404);
  }

  const updateData: any = {};
  if (status) updateData.status = status;
  if (paymentStatus) updateData.paymentStatus = paymentStatus;

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: updateData,
    include: {
      user: { select: { id: true, email: true, name: true } },
      items: {
        include: {
          productVariant: {
            include: { product: { select: { name: true } } },
          },
        },
      },
      shippingAddress: true,
    },
  });

  // Real-time fan-out AFTER the DB commit: record the transition, notify the
  // customer, broadcast to the admin room, and log it in the activity feed.
  // Only fires when the order status actually changed (not for payment-only edits).
  if (status && status !== order.status) {
    try {
      await broadcastOrderStatusUpdate(updated, {
        fromStatus: order.status,
        adminId: adminId || undefined,
        notes: null,
      });
    } catch (broadcastErr: any) {
      console.error("Order status broadcast failed (order still updated):", broadcastErr?.message || broadcastErr);
    }
  }

  return updated;
}

// ===========================================================================
// PRODUCT MANAGEMENT (Admin)
// ===========================================================================

export interface AdminProductListParams {
  page: number;
  limit: number;
  search?: string;
  includeInactive?: boolean;
}

export async function adminListProducts(params: AdminProductListParams) {
  const { page, limit, search, includeInactive } = params;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (!includeInactive) {
    where.isActive = true;
  }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
    ];
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        images: {
          select: { id: true, url: true, altText: true, displayOrder: true },
          orderBy: { displayOrder: "asc" },
          take: 1,
        },
        variants: {
          select: { id: true, size: true, color: true, price: true, stockQuantity: true, sku: true },
        },
      },
    }),
    prisma.product.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: products,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

export async function getProductById(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      images: {
        select: { id: true, url: true, altText: true, displayOrder: true },
        orderBy: { displayOrder: "asc" },
      },
      variants: {
        select: {
          id: true, size: true, color: true, fabricType: true, sku: true,
          price: true, stockQuantity: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!product) {
    throw new AdminError("Product not found", 404);
  }

  return product;
}

export interface CreateProductInput {
  name: string;
  slug?: string;
  description?: string;
  basePrice: number;
  isCustomizable?: boolean;
  categoryId: string;
  variants?: {
    size?: string;
    color?: string;
    fabricType?: string;
    sku: string;
    price?: number;
    stockQuantity?: number;
  }[];
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createProduct(input: CreateProductInput) {
  // Check if category exists
  const category = await prisma.category.findUnique({ where: { id: input.categoryId } });
  if (!category) {
    throw new AdminError("Category not found", 400);
  }

  // Generate slug if not provided
  let slug = input.slug || generateSlug(input.name);

  // Ensure slug is unique
  const existingSlug = await prisma.product.findUnique({ where: { slug } });
  if (existingSlug) {
    slug = `${slug}-${Date.now()}`;
  }

  const product = await prisma.product.create({
    data: {
      name: input.name,
      slug,
      description: input.description || null,
      basePrice: input.basePrice,
      isCustomizable: input.isCustomizable || false,
      categoryId: input.categoryId,
      variants: input.variants
        ? {
            create: input.variants.map((v) => ({
              size: v.size || null,
              color: v.color || null,
              fabricType: v.fabricType || null,
              sku: v.sku,
              price: v.price || null,
              stockQuantity: v.stockQuantity || 0,
            })),
          }
        : undefined,
    },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      variants: true,
      images: true,
    },
  });

  return product;
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  basePrice?: number;
  isCustomizable?: boolean;
  isActive?: boolean;
  categoryId?: string;
}

export async function updateProduct(productId: string, input: UpdateProductInput) {
  const existing = await prisma.product.findUnique({ where: { id: productId } });
  if (!existing) {
    throw new AdminError("Product not found", 404);
  }

  // If changing category, validate it exists
  if (input.categoryId) {
    const category = await prisma.category.findUnique({ where: { id: input.categoryId } });
    if (!category) {
      throw new AdminError("Category not found", 400);
    }
  }

  const updateData: any = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.basePrice !== undefined) updateData.basePrice = input.basePrice;
  if (input.isCustomizable !== undefined) updateData.isCustomizable = input.isCustomizable;
  if (input.isActive !== undefined) updateData.isActive = input.isActive;
  if (input.categoryId !== undefined) updateData.categoryId = input.categoryId;

  const product = await prisma.product.update({
    where: { id: productId },
    data: updateData,
    include: {
      category: { select: { id: true, name: true, slug: true } },
      variants: true,
      images: true,
    },
  });

  return product;
}

export async function deleteProduct(productId: string) {
  const existing = await prisma.product.findUnique({ where: { id: productId } });
  if (!existing) {
    throw new AdminError("Product not found", 404);
  }

  // Soft delete — set isActive to false
  await prisma.product.update({
    where: { id: productId },
    data: { isActive: false },
  });

  return { deleted: true, productId };
}

export async function listCategories() {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });
}

// ===========================================================================
// VARIANT MANAGEMENT (Admin)
// ===========================================================================

export interface UpdateVariantInput {
  size?: string;
  color?: string;
  fabricType?: string;
  sku?: string;
  price?: number | null;
  stockQuantity?: number;
}

export async function updateVariant(variantId: string, input: UpdateVariantInput) {
  const existing = await prisma.productVariant.findUnique({ where: { id: variantId } });
  if (!existing) {
    throw new AdminError("Variant not found", 404);
  }

  const updateData: any = {};
  if (input.size !== undefined) updateData.size = input.size;
  if (input.color !== undefined) updateData.color = input.color;
  if (input.fabricType !== undefined) updateData.fabricType = input.fabricType;
  if (input.sku !== undefined) updateData.sku = input.sku;
  if (input.price !== undefined) updateData.price = input.price;
  if (input.stockQuantity !== undefined) updateData.stockQuantity = input.stockQuantity;

  return prisma.productVariant.update({
    where: { id: variantId },
    data: updateData,
  });
}

export async function deleteVariant(variantId: string) {
  const existing = await prisma.productVariant.findUnique({ where: { id: variantId } });
  if (!existing) {
    throw new AdminError("Variant not found", 404);
  }

  await prisma.productVariant.delete({ where: { id: variantId } });
  return { deleted: true, variantId };
}

export async function createVariant(productId: string, input: UpdateVariantInput) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    throw new AdminError("Product not found", 404);
  }

  const variant = await prisma.productVariant.create({
    data: {
      productId,
      size: input.size || null,
      color: input.color || null,
      fabricType: input.fabricType || null,
      sku: input.sku || `SKU-${Date.now()}`,
      price: input.price ?? null,
      stockQuantity: input.stockQuantity || 0,
    },
  });

  return variant;
}

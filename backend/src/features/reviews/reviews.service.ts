// =============================================================================
// Reviews Feature — Business Logic Service
// =============================================================================
// Workflow: users review products from DELIVERED orders → PENDING → admin
// approves (published on product page) or rejects (hidden).
// =============================================================================

import { prisma } from "../../db";

// ---------------------------------------------------------------------------
// Custom Error
// ---------------------------------------------------------------------------

export class ReviewError extends Error {
  public statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = "ReviewError";
  }
}

export interface CreateReviewInput {
  productId: string;
  orderId: string;
  rating: number;
  title?: string;
  comment: string;
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

function validateReviewInput(input: CreateReviewInput): void {
  if (!input.productId) throw new ReviewError("productId is required.", 400);
  if (!input.orderId) throw new ReviewError("orderId is required.", 400);
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    throw new ReviewError("Rating must be a whole number between 1 and 5.", 400);
  }
  if (!input.comment || !input.comment.trim()) {
    throw new ReviewError("Review comment is required.", 400);
  }
  if (input.comment.trim().length > 500) {
    throw new ReviewError("Review comment must be 500 characters or less.", 400);
  }
  if (input.title && input.title.trim().length > 120) {
    throw new ReviewError("Review title must be 120 characters or less.", 400);
  }
}

// ---------------------------------------------------------------------------
// Create review — only from a DELIVERED order that belongs to the user and
// contains the product being reviewed.
// ---------------------------------------------------------------------------

export async function createReview(userId: string, input: CreateReviewInput) {
  validateReviewInput(input);

  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    include: {
      items: {
        select: {
          productVariant: { select: { productId: true } },
        },
      },
    },
  });

  if (!order) {
    throw new ReviewError("Order not found.", 404);
  }
  if (order.userId !== userId) {
    throw new ReviewError("You can only review your own orders.", 403);
  }
  if (order.status !== "DELIVERED") {
    throw new ReviewError("You can only review orders that have been delivered.", 400);
  }

  const productInOrder = order.items.some(
    (item) => item.productVariant.productId === input.productId
  );
  if (!productInOrder) {
    throw new ReviewError("That product was not part of this order.", 400);
  }

  const product = await prisma.product.findUnique({ where: { id: input.productId } });
  if (!product) {
    throw new ReviewError("Product not found.", 404);
  }

  // One review per user per product
  const existing = await prisma.review.findUnique({
    where: { userId_productId: { userId, productId: input.productId } },
  });
  if (existing) {
    throw new ReviewError("You have already reviewed this product.", 409);
  }

  return prisma.review.create({
    data: {
      userId,
      productId: input.productId,
      orderId: input.orderId,
      rating: input.rating,
      title: input.title?.trim() || null,
      comment: input.comment.trim(),
      status: "PENDING",
    },
  });
}

// ---------------------------------------------------------------------------
// Public product reviews — APPROVED only, newest first
// ---------------------------------------------------------------------------

export async function listProductReviews(productId: string) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    throw new ReviewError("Product not found.", 404);
  }

  return prisma.review.findMany({
    where: { productId, status: "APPROVED" },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true } },
    },
  });
}

// ---------------------------------------------------------------------------
// My reviews — all statuses so the user can track moderation
// ---------------------------------------------------------------------------

export async function listMyReviews(userId: string) {
  return prisma.review.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      product: { select: { id: true, name: true, slug: true } },
      order: { select: { orderNumber: true } },
    },
  });
}

// ===========================================================================
// ADMIN MODERATION
// ===========================================================================

export async function adminListReviews(status?: string) {
  if (status && !["PENDING", "APPROVED", "REJECTED"].includes(status)) {
    throw new ReviewError("Invalid status filter. Use PENDING, APPROVED or REJECTED.", 400);
  }

  return prisma.review.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          images: { select: { url: true }, orderBy: { displayOrder: "asc" }, take: 1 },
        },
      },
      order: { select: { orderNumber: true, status: true } },
    },
  });
}

export async function adminGetReview(id: string) {
  const review = await prisma.review.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          images: { select: { url: true }, orderBy: { displayOrder: "asc" }, take: 1 },
        },
      },
      order: { select: { orderNumber: true, status: true } },
    },
  });
  if (!review) {
    throw new ReviewError("Review not found.", 404);
  }
  return review;
}

async function setReviewStatus(id: string, status: string, adminId?: string) {
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) {
    throw new ReviewError("Review not found.", 404);
  }

  return prisma.review.update({
    where: { id },
    data: {
      status,
      approvedAt: status === "APPROVED" ? new Date() : null,
      approvedBy: status === "APPROVED" ? adminId || null : null,
    },
  });
}

export function adminApproveReview(id: string, adminId: string) {
  return setReviewStatus(id, "APPROVED", adminId);
}

export function adminRejectReview(id: string) {
  return setReviewStatus(id, "REJECTED");
}

export function adminUnapproveReview(id: string) {
  return setReviewStatus(id, "PENDING");
}

export async function adminDeleteReview(id: string) {
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) {
    throw new ReviewError("Review not found.", 404);
  }
  await prisma.review.delete({ where: { id } });
  return { deleted: true, id };
}
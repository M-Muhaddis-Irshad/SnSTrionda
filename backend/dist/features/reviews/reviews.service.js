"use strict";
// =============================================================================
// Reviews Feature — Business Logic Service
// =============================================================================
// Workflow: users review products from DELIVERED orders → PENDING → admin
// approves (published on product page) or rejects (hidden).
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewError = void 0;
exports.createReview = createReview;
exports.listProductReviews = listProductReviews;
exports.listMyReviews = listMyReviews;
exports.adminListReviews = adminListReviews;
exports.adminGetReview = adminGetReview;
exports.adminApproveReview = adminApproveReview;
exports.adminRejectReview = adminRejectReview;
exports.adminUnapproveReview = adminUnapproveReview;
exports.adminDeleteReview = adminDeleteReview;
const db_1 = require("../../db");
// ---------------------------------------------------------------------------
// Custom Error
// ---------------------------------------------------------------------------
class ReviewError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.name = "ReviewError";
    }
}
exports.ReviewError = ReviewError;
// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------
function validateReviewInput(input) {
    if (!input.productId)
        throw new ReviewError("productId is required.", 400);
    if (!input.orderId)
        throw new ReviewError("orderId is required.", 400);
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
async function createReview(userId, input) {
    validateReviewInput(input);
    const order = await db_1.prisma.order.findUnique({
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
    const productInOrder = order.items.some((item) => item.productVariant.productId === input.productId);
    if (!productInOrder) {
        throw new ReviewError("That product was not part of this order.", 400);
    }
    const product = await db_1.prisma.product.findUnique({ where: { id: input.productId } });
    if (!product) {
        throw new ReviewError("Product not found.", 404);
    }
    // One review per user per product
    const existing = await db_1.prisma.review.findUnique({
        where: { userId_productId: { userId, productId: input.productId } },
    });
    if (existing) {
        throw new ReviewError("You have already reviewed this product.", 409);
    }
    return db_1.prisma.review.create({
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
async function listProductReviews(productId) {
    const product = await db_1.prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
        throw new ReviewError("Product not found.", 404);
    }
    return db_1.prisma.review.findMany({
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
async function listMyReviews(userId) {
    return db_1.prisma.review.findMany({
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
async function adminListReviews(status) {
    if (status && !["PENDING", "APPROVED", "REJECTED"].includes(status)) {
        throw new ReviewError("Invalid status filter. Use PENDING, APPROVED or REJECTED.", 400);
    }
    return db_1.prisma.review.findMany({
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
async function adminGetReview(id) {
    const review = await db_1.prisma.review.findUnique({
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
async function setReviewStatus(id, status, adminId) {
    const review = await db_1.prisma.review.findUnique({ where: { id } });
    if (!review) {
        throw new ReviewError("Review not found.", 404);
    }
    return db_1.prisma.review.update({
        where: { id },
        data: {
            status,
            approvedAt: status === "APPROVED" ? new Date() : null,
            approvedBy: status === "APPROVED" ? adminId || null : null,
        },
    });
}
function adminApproveReview(id, adminId) {
    return setReviewStatus(id, "APPROVED", adminId);
}
function adminRejectReview(id) {
    return setReviewStatus(id, "REJECTED");
}
function adminUnapproveReview(id) {
    return setReviewStatus(id, "PENDING");
}
async function adminDeleteReview(id) {
    const review = await db_1.prisma.review.findUnique({ where: { id } });
    if (!review) {
        throw new ReviewError("Review not found.", 404);
    }
    await db_1.prisma.review.delete({ where: { id } });
    return { deleted: true, id };
}
//# sourceMappingURL=reviews.service.js.map
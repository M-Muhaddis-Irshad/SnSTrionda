"use strict";
// =============================================================================
// Reviews Feature — Request Handlers (Controller)
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleCreateReview = handleCreateReview;
exports.handleListMyReviews = handleListMyReviews;
exports.handleListProductReviews = handleListProductReviews;
exports.handleAdminListReviews = handleAdminListReviews;
exports.handleAdminGetReview = handleAdminGetReview;
exports.handleAdminApproveReview = handleAdminApproveReview;
exports.handleAdminRejectReview = handleAdminRejectReview;
exports.handleAdminUnapproveReview = handleAdminUnapproveReview;
exports.handleAdminDeleteReview = handleAdminDeleteReview;
const reviews_service_1 = require("./reviews.service");
const socketService_1 = require("../../services/socketService");
function handleReviewError(err, res) {
    if (err instanceof reviews_service_1.ReviewError) {
        return res.status(err.statusCode).json({ error: err.message });
    }
    console.error("Review error:", err?.message || err);
    res.status(500).json({ error: "Internal server error" });
}
// ---------------------------------------------------------------------------
// Moderation helpers — notify the review author + log the admin's action
// ---------------------------------------------------------------------------
const REVIEW_STATUS_MESSAGES = {
    APPROVED: {
        title: "Review approved",
        message: (p) => `Your review of ${p} has been approved and is now live on the product page.`,
    },
    REJECTED: {
        title: "Review not approved",
        message: (p) => `Your review of ${p} did not meet our guidelines.`, // no emoji
    },
    PENDING: {
        title: "Review back under review",
        message: (p) => `Your review of ${p} has been moved back to pending moderation.`,
    },
};
async function afterModeration(adminId, action, reviewId, status) {
    try {
        const review = await (0, reviews_service_1.adminGetReview)(reviewId);
        const productName = review.product?.name || "your product";
        const cfg = REVIEW_STATUS_MESSAGES[status] || REVIEW_STATUS_MESSAGES.PENDING;
        await (0, socketService_1.createNotification)(review.user.id, "REVIEW_STATUS", cfg.title, cfg.message(productName), { reviewId, productId: review.productId, status });
        if (adminId) {
            (0, socketService_1.logAdminActivity)(adminId, action, "Review", reviewId, {
                product: productName,
                status,
            }).catch(() => { });
        }
    }
    catch (err) {
        console.error("Review moderation fan-out failed:", err);
    }
}
// ---------------------------------------------------------------------------
// POST /api/reviews — create review (authenticated)
// ---------------------------------------------------------------------------
async function handleCreateReview(req, res) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: "Authentication required." });
        }
        const { productId, orderId, rating, title, comment } = req.body;
        const review = await (0, reviews_service_1.createReview)(userId, {
            productId,
            orderId,
            rating: Number(rating),
            title,
            comment,
        });
        res.status(201).json({
            message: "Review submitted for moderation.",
            data: review,
        });
    }
    catch (err) {
        handleReviewError(err, res);
    }
}
// ---------------------------------------------------------------------------
// GET /api/reviews/my — user's own reviews (authenticated)
// ---------------------------------------------------------------------------
async function handleListMyReviews(req, res) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: "Authentication required." });
        }
        const reviews = await (0, reviews_service_1.listMyReviews)(userId);
        res.json({ data: reviews });
    }
    catch (err) {
        handleReviewError(err, res);
    }
}
// ---------------------------------------------------------------------------
// GET /api/products/:productId/reviews — approved reviews only (public)
// ---------------------------------------------------------------------------
async function handleListProductReviews(req, res) {
    try {
        const productId = req.params.productId;
        const reviews = await (0, reviews_service_1.listProductReviews)(productId);
        res.json({ data: reviews });
    }
    catch (err) {
        handleReviewError(err, res);
    }
}
// ===========================================================================
// ADMIN — mounted under /api/admin/reviews
// ===========================================================================
async function handleAdminListReviews(req, res) {
    try {
        const status = req.query.status || undefined;
        const reviews = await (0, reviews_service_1.adminListReviews)(status);
        res.json({ data: reviews });
    }
    catch (err) {
        handleReviewError(err, res);
    }
}
async function handleAdminGetReview(req, res) {
    try {
        const review = await (0, reviews_service_1.adminGetReview)(req.params.id);
        res.json({ data: review });
    }
    catch (err) {
        handleReviewError(err, res);
    }
}
async function handleAdminApproveReview(req, res) {
    try {
        const adminId = req.user?.userId;
        const review = await (0, reviews_service_1.adminApproveReview)(req.params.id, adminId || "admin");
        res.json({ data: review, message: "Review approved and published." });
        afterModeration(adminId, "APPROVE_REVIEW", review.id, "APPROVED");
    }
    catch (err) {
        handleReviewError(err, res);
    }
}
async function handleAdminRejectReview(req, res) {
    try {
        const adminId = req.user?.userId;
        const review = await (0, reviews_service_1.adminRejectReview)(req.params.id);
        res.json({ data: review, message: "Review rejected." });
        afterModeration(adminId, "REJECT_REVIEW", review.id, "REJECTED");
    }
    catch (err) {
        handleReviewError(err, res);
    }
}
async function handleAdminUnapproveReview(req, res) {
    try {
        const adminId = req.user?.userId;
        const review = await (0, reviews_service_1.adminUnapproveReview)(req.params.id);
        res.json({ data: review, message: "Review moved back to pending." });
        afterModeration(adminId, "UNAPPROVE_REVIEW", review.id, "PENDING");
    }
    catch (err) {
        handleReviewError(err, res);
    }
}
async function handleAdminDeleteReview(req, res) {
    try {
        const adminId = req.user?.userId;
        const result = await (0, reviews_service_1.adminDeleteReview)(req.params.id);
        res.json({ ...result, message: "Review deleted." });
        if (adminId) {
            (0, socketService_1.logAdminActivity)(adminId, "DELETE_REVIEW", "Review", result.id, null).catch(() => { });
        }
    }
    catch (err) {
        handleReviewError(err, res);
    }
}
//# sourceMappingURL=reviews.controller.js.map
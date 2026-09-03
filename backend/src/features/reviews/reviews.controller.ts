// =============================================================================
// Reviews Feature — Request Handlers (Controller)
// =============================================================================

import { Request, Response } from "express";
import {
  createReview,
  listProductReviews,
  listMyReviews,
  adminListReviews,
  adminGetReview,
  adminApproveReview,
  adminRejectReview,
  adminUnapproveReview,
  adminDeleteReview,
  ReviewError,
} from "./reviews.service";
import { createNotification, logAdminActivity } from "../../services/socketService";

function handleReviewError(err: any, res: Response) {
  if (err instanceof ReviewError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  console.error("Review error:", err?.message || err);
  res.status(500).json({ error: "Internal server error" });
}

// ---------------------------------------------------------------------------
// Moderation helpers — notify the review author + log the admin's action
// ---------------------------------------------------------------------------

const REVIEW_STATUS_MESSAGES: Record<string, { title: string; message: (p: string) => string }> = {
  APPROVED: {
    title: "Review approved",
    message: (p) =>
      `Your review of ${p} has been approved and is now live on the product page.`,
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

async function afterModeration(adminId: string | undefined, action: string, reviewId: string, status: string) {
  try {
    const review = await adminGetReview(reviewId);
    const productName = review.product?.name || "your product";

    const cfg = REVIEW_STATUS_MESSAGES[status] || REVIEW_STATUS_MESSAGES.PENDING;
    await createNotification(
      review.user.id,
      "REVIEW_STATUS",
      cfg.title,
      cfg.message(productName),
      { reviewId, productId: review.productId, status }
    );

    if (adminId) {
      logAdminActivity(adminId, action, "Review", reviewId, {
        product: productName,
        status,
      }).catch(() => {});
    }
  } catch (err) {
    console.error("Review moderation fan-out failed:", err);
  }
}

// ---------------------------------------------------------------------------
// POST /api/reviews — create review (authenticated)
// ---------------------------------------------------------------------------

export async function handleCreateReview(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required." });
    }

    const { productId, orderId, rating, title, comment } = req.body;
    const review = await createReview(userId, {
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
  } catch (err: any) {
    handleReviewError(err, res);
  }
}

// ---------------------------------------------------------------------------
// GET /api/reviews/my — user's own reviews (authenticated)
// ---------------------------------------------------------------------------

export async function handleListMyReviews(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required." });
    }

    const reviews = await listMyReviews(userId);
    res.json({ data: reviews });
  } catch (err: any) {
    handleReviewError(err, res);
  }
}

// ---------------------------------------------------------------------------
// GET /api/products/:productId/reviews — approved reviews only (public)
// ---------------------------------------------------------------------------

export async function handleListProductReviews(req: Request, res: Response) {
  try {
    const productId = req.params.productId as string;
    const reviews = await listProductReviews(productId);
    res.json({ data: reviews });
  } catch (err: any) {
    handleReviewError(err, res);
  }
}

// ===========================================================================
// ADMIN — mounted under /api/admin/reviews
// ===========================================================================

export async function handleAdminListReviews(req: Request, res: Response) {
  try {
    const status = (req.query.status as string) || undefined;
    const reviews = await adminListReviews(status);
    res.json({ data: reviews });
  } catch (err: any) {
    handleReviewError(err, res);
  }
}

export async function handleAdminGetReview(req: Request, res: Response) {
  try {
    const review = await adminGetReview(req.params.id as string);
    res.json({ data: review });
  } catch (err: any) {
    handleReviewError(err, res);
  }
}

export async function handleAdminApproveReview(req: Request, res: Response) {
  try {
    const adminId = req.user?.userId;
    const review = await adminApproveReview(req.params.id as string, adminId || "admin");
    res.json({ data: review, message: "Review approved and published." });
    afterModeration(adminId, "APPROVE_REVIEW", review.id, "APPROVED");
  } catch (err: any) {
    handleReviewError(err, res);
  }
}

export async function handleAdminRejectReview(req: Request, res: Response) {
  try {
    const adminId = req.user?.userId;
    const review = await adminRejectReview(req.params.id as string);
    res.json({ data: review, message: "Review rejected." });
    afterModeration(adminId, "REJECT_REVIEW", review.id, "REJECTED");
  } catch (err: any) {
    handleReviewError(err, res);
  }
}

export async function handleAdminUnapproveReview(req: Request, res: Response) {
  try {
    const adminId = req.user?.userId;
    const review = await adminUnapproveReview(req.params.id as string);
    res.json({ data: review, message: "Review moved back to pending." });
    afterModeration(adminId, "UNAPPROVE_REVIEW", review.id, "PENDING");
  } catch (err: any) {
    handleReviewError(err, res);
  }
}

export async function handleAdminDeleteReview(req: Request, res: Response) {
  try {
    const adminId = req.user?.userId;
    const result = await adminDeleteReview(req.params.id as string);
    res.json({ ...result, message: "Review deleted." });
    if (adminId) {
      logAdminActivity(adminId, "DELETE_REVIEW", "Review", result.id, null).catch(() => {});
    }
  } catch (err: any) {
    handleReviewError(err, res);
  }
}
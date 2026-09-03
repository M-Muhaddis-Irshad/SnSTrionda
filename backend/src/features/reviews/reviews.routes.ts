// =============================================================================
// Reviews Feature — User Route Definitions
// =============================================================================

import { Router } from "express";
import { authenticate } from "../auth/auth.middleware";
import { handleCreateReview, handleListMyReviews } from "./reviews.controller";

const router = Router();

// POST /api/reviews — create a review (requires auth)
router.post("/", authenticate, handleCreateReview);

// GET /api/reviews/my — current user's reviews (requires auth)
router.get("/my", authenticate, handleListMyReviews);

export default router;
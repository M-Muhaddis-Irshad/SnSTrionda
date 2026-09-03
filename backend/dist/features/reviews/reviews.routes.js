"use strict";
// =============================================================================
// Reviews Feature — User Route Definitions
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../auth/auth.middleware");
const reviews_controller_1 = require("./reviews.controller");
const router = (0, express_1.Router)();
// POST /api/reviews — create a review (requires auth)
router.post("/", auth_middleware_1.authenticate, reviews_controller_1.handleCreateReview);
// GET /api/reviews/my — current user's reviews (requires auth)
router.get("/my", auth_middleware_1.authenticate, reviews_controller_1.handleListMyReviews);
exports.default = router;
//# sourceMappingURL=reviews.routes.js.map
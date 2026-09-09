// =============================================================================
// Wishlist Feature — Route Definitions
// =============================================================================

import { Router } from "express";
import { authenticate } from "../auth/auth.middleware";
import {
  handleGetWishlist,
  handleToggleWishlist,
  handleAddToWishlist,
  handleRemoveFromWishlist,
} from "./wishlist.controller";

const router = Router();

// All wishlist routes require authentication
router.use(authenticate);

// GET /api/wishlist — list wishlist items (with auto-cleanup of >30-day items)
router.get("/", handleGetWishlist);

// POST /api/wishlist/toggle — toggle a product in/out of wishlist
router.post("/toggle", handleToggleWishlist);

// POST /api/wishlist — add a product to wishlist
router.post("/", handleAddToWishlist);

// DELETE /api/wishlist/:productId — remove a product from wishlist
router.delete("/:productId", handleRemoveFromWishlist);

export default router;

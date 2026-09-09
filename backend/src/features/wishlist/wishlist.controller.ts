// =============================================================================
// Wishlist Feature — Controller (request handlers)
// =============================================================================

import { Request, Response } from "express";
import {
  addToWishlist,
  removeFromWishlist,
  getWishlist,
  toggleWishlist,
} from "./wishlist.service";

// ---------------------------------------------------------------------------
// GET /api/wishlist — list current user's wishlist
// ---------------------------------------------------------------------------

export async function handleGetWishlist(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required." });
    }

    const items = await getWishlist(userId);
    res.json({ data: items });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch wishlist." });
  }
}

// ---------------------------------------------------------------------------
// POST /api/wishlist/toggle — toggle a product in/out of wishlist
// ---------------------------------------------------------------------------

export async function handleToggleWishlist(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required." });
    }

    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ error: "productId is required." });
    }

    const result = await toggleWishlist(userId, productId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to toggle wishlist." });
  }
}

// ---------------------------------------------------------------------------
// POST /api/wishlist — add a product to wishlist
// ---------------------------------------------------------------------------

export async function handleAddToWishlist(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required." });
    }

    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ error: "productId is required." });
    }

    const item = await addToWishlist(userId, productId);
    res.status(201).json({ data: item, message: "Added to wishlist." });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to add to wishlist." });
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/wishlist/:productId — remove a product from wishlist
// ---------------------------------------------------------------------------

export async function handleRemoveFromWishlist(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required." });
    }

    const productId = req.params.productId as string;
    const result = await removeFromWishlist(userId, productId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to remove from wishlist." });
  }
}

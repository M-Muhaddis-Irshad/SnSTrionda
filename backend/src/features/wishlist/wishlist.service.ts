// =============================================================================
// Wishlist Feature — Business Logic Service
// =============================================================================

import { prisma } from "../../db";

// Auto-remove items older than this threshold
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// Safe product select for wishlist responses
const PRODUCT_SELECT = {
  id: true,
  name: true,
  slug: true,
  basePrice: true,
  isCustomizable: true,
  category: { select: { id: true, name: true, slug: true } },
  images: {
    orderBy: { displayOrder: "asc" as const },
    take: 1,
    select: { id: true, url: true, altText: true },
  },
  variants: {
    select: { id: true, size: true, color: true, price: true, stockQuantity: true },
  },
};

// ---------------------------------------------------------------------------
// Add a product to the user's wishlist
// ---------------------------------------------------------------------------

export async function addToWishlist(userId: string, productId: string) {
  // Ensure the product exists and is active
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, isActive: true },
  });

  if (!product || !product.isActive) {
    throw new Error("Product not found.");
  }

  // Upsert — if already exists, just return it (idempotent)
  const item = await prisma.wishlistItem.upsert({
    where: { userId_productId: { userId, productId } },
    create: { userId, productId },
    update: {},
    select: { id: true, createdAt: true },
  });

  return item;
}

// ---------------------------------------------------------------------------
// Remove a product from the user's wishlist
// ---------------------------------------------------------------------------

export async function removeFromWishlist(userId: string, productId: string) {
  const deleted = await prisma.wishlistItem.deleteMany({
    where: { userId, productId },
  });

  return { removed: deleted.count > 0 };
}

// ---------------------------------------------------------------------------
// Get all wishlist items for a user (with product details)
// ---------------------------------------------------------------------------

export async function getWishlist(userId: string) {
  // First, auto-clean expired items
  await cleanupExpiredWishlistItems(userId);

  const items = await prisma.wishlistItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      product: { select: PRODUCT_SELECT },
    },
  });

  return items;
}

// ---------------------------------------------------------------------------
// Toggle — add if not present, remove if present
// ---------------------------------------------------------------------------

export async function toggleWishlist(userId: string, productId: string) {
  const existing = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId, productId } },
    select: { id: true },
  });

  if (existing) {
    await removeFromWishlist(userId, productId);
    return { action: "removed" as const, wishlisted: false };
  }

  await addToWishlist(userId, productId);
  return { action: "added" as const, wishlisted: true };
}

// ---------------------------------------------------------------------------
// Auto-clean: remove wishlist items older than 30 days
// ---------------------------------------------------------------------------

export async function cleanupExpiredWishlistItems(userId: string) {
  const cutoff = new Date(Date.now() - MAX_AGE_MS);

  const deleted = await prisma.wishlistItem.deleteMany({
    where: {
      userId,
      createdAt: { lt: cutoff },
    },
  });

  return { removed: deleted.count };
}

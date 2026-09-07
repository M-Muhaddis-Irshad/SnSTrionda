// =============================================================================
// Collections Feature — Business Logic Service
// =============================================================================
// Curated product groupings with a banner image. Products are assigned via a
// join table (CollectionProduct) with a sort order. The storefront fetches
// active collections with their products through GET /api/collections.
// =============================================================================

import { prisma } from "../../db";
import { attachLiveDiscounts } from "../products/products.service";

export class CollectionError extends Error {
  public statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = "CollectionError";
  }
}

export interface CollectionInput {
  name: string;
  slug?: string;
  description?: string;
  bannerUrl?: string;
  productIds?: string[];
  active?: boolean;
}

const COLLECTION_SELECT = {
  id: true,
  name: true,
  slug: true,
  description: true,
  bannerUrl: true,
  active: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { products: true } },
} as const;

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ---------------------------------------------------------------------------
// Admin — list / create / update / delete
// ---------------------------------------------------------------------------

export async function listCollections() {
  const collections = await prisma.collection.findMany({
    orderBy: { name: "asc" },
    select: {
      ...COLLECTION_SELECT,
      products: {
        orderBy: { sortOrder: "asc" },
        select: { productId: true },
      },
    },
  });
  // Flatten to { productIds } so the admin edit form can pre-select them
  return collections.map((c: any) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    bannerUrl: c.bannerUrl,
    active: c.active,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    _count: c._count,
    productIds: c.products.map((p: any) => p.productId),
  }));
}

async function validateAndNormalize(input: CollectionInput, selfId?: string) {
  const name = input.name?.trim();
  if (!name) throw new CollectionError("Collection name is required", 400);

  let slug = input.slug?.trim() || generateSlug(name);
  if (!slug) throw new CollectionError("Collection slug is required", 400);

  const dup = await prisma.collection.findUnique({ where: { slug } });
  if (dup && dup.id !== selfId) {
    throw new CollectionError(`A collection with the slug \"${slug}\" already exists`, 400);
  }

  // Validate product ids exist before persisting
  const productIds = Array.isArray(input.productIds)
    ? [...new Set(input.productIds.filter(Boolean))]
    : [];
  if (productIds.length > 0) {
    const found = await prisma.product.count({ where: { id: { in: productIds } } });
    if (found !== productIds.length) {
      throw new CollectionError("One or more selected products no longer exist", 400);
    }
  }

  return {
    name,
    slug,
    description: input.description?.trim() || null,
    bannerUrl: input.bannerUrl?.trim() || null,
    productIds,
  };
}

export async function createCollection(input: CollectionInput) {
  const data = await validateAndNormalize(input);
  const collection = await prisma.collection.create({
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description,
      bannerUrl: data.bannerUrl,
      active: input.active !== undefined ? Boolean(input.active) : true,
      products: data.productIds.length
        ? { create: data.productIds.map((productId, i) => ({ productId, sortOrder: i })) }
        : undefined,
    },
    select: COLLECTION_SELECT,
  });
  return collection;
}

export async function updateCollection(collectionId: string, input: CollectionInput) {
  const existing = await prisma.collection.findUnique({ where: { id: collectionId } });
  if (!existing) throw new CollectionError("Collection not found", 404);

  const data = await validateAndNormalize(input, collectionId);

  return prisma.$transaction(async (tx) => {
    const collection = await tx.collection.update({
      where: { id: collectionId },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        bannerUrl: data.bannerUrl,
        active: input.active !== undefined ? Boolean(input.active) : existing.active,
      },
      select: COLLECTION_SELECT,
    });

    // Replace the full product assignment (delete + recreate in sort order)
    if (Array.isArray(input.productIds)) {
      await tx.collectionProduct.deleteMany({ where: { collectionId } });
      if (data.productIds.length) {
        await tx.collectionProduct.createMany({
          data: data.productIds.map((productId, i) => ({
            collectionId,
            productId,
            sortOrder: i,
          })),
        });
      }
    }

    return collection;
  });
}

export async function deleteCollection(collectionId: string) {
  const existing = await prisma.collection.findUnique({ where: { id: collectionId } });
  if (!existing) throw new CollectionError("Collection not found", 404);
  await prisma.collection.delete({ where: { id: collectionId } });
  return { deleted: true, collectionId };
}

// ---------------------------------------------------------------------------
// Public — active collections with their products (for the storefront page)
// ---------------------------------------------------------------------------

const PRODUCT_SELECT = {
  id: true,
  name: true,
  slug: true,
  basePrice: true,
  isCustomizable: true,
  category: { select: { id: true, name: true, slug: true } },
  images: {
    select: { id: true, url: true, altText: true, displayOrder: true },
    orderBy: { displayOrder: "asc" as const },
    take: 1,
  },
  variants: {
    select: { id: true, size: true, color: true, price: true, stockQuantity: true },
  },
  discounts: {
    select: { id: true, name: true, type: true, value: true, startsAt: true, expiresAt: true, active: true },
  },
};

export async function listPublicCollections() {
  const collections = await prisma.collection.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      bannerUrl: true,
      products: {
        orderBy: { sortOrder: "asc" },
        select: { product: { select: PRODUCT_SELECT } },
      },
    },
  });

  return collections.map((c: any) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    bannerUrl: c.bannerUrl,
    products: attachLiveDiscounts(c.products.map((p: any) => p.product)),
  }));
}

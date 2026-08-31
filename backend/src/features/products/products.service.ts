// =============================================================================
// Products Feature — Business Logic Service
// =============================================================================

import { prisma } from "../../db";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ---------------------------------------------------------------------------
// List Products (with pagination)
// ---------------------------------------------------------------------------

export async function listProducts(params: PaginationParams): Promise<PaginatedResult<any>> {
  const { page, limit } = params;
  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        images: {
          select: { id: true, url: true, altText: true, displayOrder: true },
          orderBy: { displayOrder: "asc" },
          take: 1, // Primary image only for list view
        },
        variants: {
          select: { id: true, size: true, color: true, price: true, stockQuantity: true },
        },
      },
    }),
    prisma.product.count({ where: { isActive: true } }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: products,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

// ---------------------------------------------------------------------------
// Get Product by Slug (full detail)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// List Categories (public, for homepage/shop)
// ---------------------------------------------------------------------------

export async function listCategories() {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });
}

// ---------------------------------------------------------------------------
// Get Product by Slug (full detail)
// ---------------------------------------------------------------------------

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: {
        select: { id: true, name: true, slug: true },
      },
      images: {
        select: { id: true, url: true, altText: true, displayOrder: true },
        orderBy: { displayOrder: "asc" },
      },
      variants: {
        select: {
          id: true,
          size: true,
          color: true,
          fabricType: true,
          sku: true,
          price: true,
          stockQuantity: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!product) {
    return null;
  }

  return product;
}

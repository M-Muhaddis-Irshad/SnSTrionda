// =============================================================================
// Products Feature — Business Logic Service
// =============================================================================

import { prisma } from "../../db";

// ---------------------------------------------------------------------------
// Live discount mapping — shared by the products API and the collections API.
// Each product is annotated with its currently-live discount (if any) plus a
// computed `discountedPrice` on the base price, so the storefront can render
// sale badges / strikethrough prices without joining the Discount table itself.
// ---------------------------------------------------------------------------

export function attachLiveDiscounts(products: any[]) {
  const now = new Date();
  return products.map((p: any) => {
    const disc = (p.discounts || []).find(
      (d: any) =>
        d.active &&
        (!d.startsAt || new Date(d.startsAt) <= now) &&
        (!d.expiresAt || new Date(d.expiresAt) >= now)
    );
    let discountedPrice: number | null = null;
    if (disc) {
      const base = Number(p.basePrice);
      discountedPrice =
        disc.type === "FLAT"
          ? Math.max(0, base - Number(disc.value))
          : Math.round(base * (1 - Number(disc.value) / 100));
    }
    const { discounts, ...rest } = p;
    return {
      ...rest,
      discount: disc
        ? {
            id: disc.id,
            name: disc.name,
            type: disc.type,
            value: Number(disc.value),
          }
        : null,
      discountedPrice,
    };
  });
}

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

export interface ListProductsParams extends PaginationParams {
  search?: string;
  category?: string; // category slug
  minPrice?: number;
  maxPrice?: number;
  sizes?: string[];
  colors?: string[];
  materials?: string[];
  sort?: "newest" | "price_asc" | "price_desc" | "name_asc";
}

export async function listProducts(params: ListProductsParams): Promise<PaginatedResult<any>> {
  const { page, limit, search } = params;
  const skip = (page - 1) * limit;

  const searchQuery = search?.trim()
    ? {
        OR: [
          { name: { contains: search.trim(), mode: "insensitive" as const } },
          { description: { contains: search.trim(), mode: "insensitive" as const } },
        ],
      }
    : {};

  // Category filter — comma-separated slugs, merged with the storefront rule
  // that products under deactivated categories never surface (category.active).
  const categoryFilter = {
    active: true,
    ...(params.category
      ? { slug: { in: params.category.split(",").map((c) => c.trim()).filter(Boolean) } }
      : {}),
  };

  const priceQuery =
    params.minPrice !== undefined || params.maxPrice !== undefined
      ? {
          OR: [
            {
              basePrice: {
                ...(params.minPrice !== undefined ? { gte: params.minPrice } : {}),
                ...(params.maxPrice !== undefined ? { lte: params.maxPrice } : {}),
              },
            },
            {
              variants: {
                some: {
                  price: {
                    ...(params.minPrice !== undefined ? { gte: params.minPrice } : {}),
                    ...(params.maxPrice !== undefined ? { lte: params.maxPrice } : {}),
                  },
                },
              },
            },
          ],
        }
      : {};

  const variantQuery: Record<string, unknown> = {};
  if (params.sizes?.length) {
    variantQuery.size = { in: params.sizes };
  }
  if (params.colors?.length) {
    variantQuery.color = { in: params.colors };
  }
  if (params.materials?.length) {
    variantQuery.fabricType = { in: params.materials };
  }

  const facetQuery = Object.keys(variantQuery).length
    ? { variants: { some: variantQuery } }
    : {};

  const sortOrder: Record<string, "asc" | "desc"> =
    params.sort === "price_asc"
      ? { basePrice: "asc" }
      : params.sort === "price_desc"
      ? { basePrice: "desc" }
      : params.sort === "name_asc"
      ? { name: "asc" }
      : { createdAt: "desc" };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true, ...searchQuery, category: categoryFilter, ...priceQuery, ...facetQuery },
      skip,
      take: limit,
      orderBy: sortOrder,
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
        discounts: {
          select: { id: true, name: true, type: true, value: true, startsAt: true, expiresAt: true, active: true },
        },
      },
    }),
    prisma.product.count({
      where: { isActive: true, ...searchQuery, category: categoryFilter, ...priceQuery, ...facetQuery },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: attachLiveDiscounts(products),
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
  // Storefront only sees active categories — inactive ones (e.g. retired
  // Footwear / Accessories) are hidden from nav, cards and filters.
  return prisma.category.findMany({
    where: { active: true },
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
      discounts: {
        select: { id: true, name: true, type: true, value: true, startsAt: true, expiresAt: true, active: true },
      },
    },
  });

  if (!product) {
    return null;
  }

  return attachLiveDiscounts([product])[0];
}

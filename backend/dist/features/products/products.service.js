"use strict";
// =============================================================================
// Products Feature — Business Logic Service
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.listProducts = listProducts;
exports.listCategories = listCategories;
exports.getProductBySlug = getProductBySlug;
const db_1 = require("../../db");
async function listProducts(params) {
    const { page, limit, search } = params;
    const skip = (page - 1) * limit;
    const searchQuery = search?.trim()
        ? {
            OR: [
                { name: { contains: search.trim(), mode: "insensitive" } },
                { description: { contains: search.trim(), mode: "insensitive" } },
            ],
        }
        : {};
    // Category (comma-separated slugs), price window, variant faceting — all REAL filters
    const categoryQuery = params.category
        ? { category: { slug: { in: params.category.split(",").map((c) => c.trim()).filter(Boolean) } } }
        : {};
    const priceQuery = params.minPrice !== undefined || params.maxPrice !== undefined
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
    const variantQuery = {};
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
    const sortOrder = params.sort === "price_asc"
        ? { basePrice: "asc" }
        : params.sort === "price_desc"
            ? { basePrice: "desc" }
            : params.sort === "name_asc"
                ? { name: "asc" }
                : { createdAt: "desc" };
    const [products, total] = await Promise.all([
        db_1.prisma.product.findMany({
            where: { isActive: true, ...searchQuery, ...categoryQuery, ...priceQuery, ...facetQuery },
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
            },
        }),
        db_1.prisma.product.count({
            where: { isActive: true, ...searchQuery, ...categoryQuery, ...priceQuery, ...facetQuery },
        }),
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
async function listCategories() {
    // Storefront only sees active categories — inactive ones (e.g. retired
    // Footwear / Accessories) are hidden from nav, cards and filters.
    return db_1.prisma.category.findMany({
        where: { active: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true, slug: true },
    });
}
// ---------------------------------------------------------------------------
// Get Product by Slug (full detail)
// ---------------------------------------------------------------------------
async function getProductBySlug(slug) {
    const product = await db_1.prisma.product.findUnique({
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
//# sourceMappingURL=products.service.js.map
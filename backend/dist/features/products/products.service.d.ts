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
export interface ListProductsParams extends PaginationParams {
    search?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    sizes?: string[];
    colors?: string[];
    materials?: string[];
    sort?: "newest" | "price_asc" | "price_desc" | "name_asc";
}
export declare function listProducts(params: ListProductsParams): Promise<PaginatedResult<any>>;
export declare function listCategories(): Promise<{
    id: string;
    name: string;
    slug: string;
}[]>;
export declare function getProductBySlug(slug: string): Promise<({
    category: {
        id: string;
        name: string;
        slug: string;
    };
    images: {
        altText: string | null;
        displayOrder: number;
        id: string;
        url: string;
    }[];
    variants: {
        color: string | null;
        fabricType: string | null;
        id: string;
        price: import("@prisma/client-runtime-utils").Decimal | null;
        size: string | null;
        sku: string;
        stockQuantity: number;
    }[];
} & {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    basePrice: import("@prisma/client-runtime-utils").Decimal;
    isCustomizable: boolean;
    isActive: boolean;
    categoryId: string;
    createdAt: Date;
    updatedAt: Date;
}) | null>;
//# sourceMappingURL=products.service.d.ts.map
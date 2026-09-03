export declare class AdminError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number);
}
export declare function getDashboardStats(): Promise<{
    totalOrders: number;
    totalRevenue: number;
    totalProducts: number;
    totalCustomers: number;
    recentOrders: ({
        items: {
            quantity: number;
        }[];
        user: {
            email: string;
            name: string | null;
        };
    } & {
        id: string;
        orderNumber: string;
        status: import("../../generated/prisma/enums").OrderStatus;
        subtotal: import("@prisma/client-runtime-utils").Decimal;
        shippingCost: import("@prisma/client-runtime-utils").Decimal;
        discount: import("@prisma/client-runtime-utils").Decimal;
        promoCode: string | null;
        total: import("@prisma/client-runtime-utils").Decimal;
        paymentMethod: import("../../generated/prisma/enums").PaymentMethod;
        paymentStatus: import("../../generated/prisma/enums").PaymentStatus;
        userId: string;
        shippingAddressId: string;
        createdAt: Date;
        updatedAt: Date;
    })[];
    lowStockProducts: ({
        product: {
            id: string;
            name: string;
            slug: string;
        };
    } & {
        id: string;
        size: string | null;
        color: string | null;
        fabricType: string | null;
        sku: string;
        price: import("@prisma/client-runtime-utils").Decimal | null;
        stockQuantity: number;
        productId: string;
        createdAt: Date;
        updatedAt: Date;
    })[];
    revenueByDay: {
        date: string;
        day: string;
        revenue: number;
        orders: number;
    }[];
}>;
export interface OrderListParams {
    page: number;
    limit: number;
    status?: string;
    search?: string;
}
export declare function listOrders(params: OrderListParams): Promise<{
    data: ({
        items: {
            priceAtPurchase: import("@prisma/client-runtime-utils").Decimal;
            quantity: number;
        }[];
        shippingAddress: {
            city: string;
            country: string;
            province: string;
        };
        user: {
            email: string;
            id: string;
            name: string | null;
        };
    } & {
        id: string;
        orderNumber: string;
        status: import("../../generated/prisma/enums").OrderStatus;
        subtotal: import("@prisma/client-runtime-utils").Decimal;
        shippingCost: import("@prisma/client-runtime-utils").Decimal;
        discount: import("@prisma/client-runtime-utils").Decimal;
        promoCode: string | null;
        total: import("@prisma/client-runtime-utils").Decimal;
        paymentMethod: import("../../generated/prisma/enums").PaymentMethod;
        paymentStatus: import("../../generated/prisma/enums").PaymentStatus;
        userId: string;
        shippingAddressId: string;
        createdAt: Date;
        updatedAt: Date;
    })[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}>;
export declare function getOrderById(orderId: string): Promise<{
    items: ({
        customMeasurement: {
            id: string;
            chest: import("@prisma/client-runtime-utils").Decimal | null;
            waist: import("@prisma/client-runtime-utils").Decimal | null;
            shoulder: import("@prisma/client-runtime-utils").Decimal | null;
            sleeveLength: import("@prisma/client-runtime-utils").Decimal | null;
            neck: import("@prisma/client-runtime-utils").Decimal | null;
            hip: import("@prisma/client-runtime-utils").Decimal | null;
            inseam: import("@prisma/client-runtime-utils").Decimal | null;
            thigh: import("@prisma/client-runtime-utils").Decimal | null;
            rise: import("@prisma/client-runtime-utils").Decimal | null;
            cuff: import("@prisma/client-runtime-utils").Decimal | null;
            height: import("@prisma/client-runtime-utils").Decimal | null;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
        } | null;
        productVariant: {
            product: {
                id: string;
                name: string;
                slug: string;
            };
        } & {
            id: string;
            size: string | null;
            color: string | null;
            fabricType: string | null;
            sku: string;
            price: import("@prisma/client-runtime-utils").Decimal | null;
            stockQuantity: number;
            productId: string;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        quantity: number;
        priceAtPurchase: import("@prisma/client-runtime-utils").Decimal;
        orderId: string;
        productVariantId: string;
        customMeasurementId: string | null;
        createdAt: Date;
        updatedAt: Date;
    })[];
    shippingAddress: {
        id: string;
        label: string;
        fullName: string;
        phone: string;
        addressLine1: string;
        addressLine2: string | null;
        city: string;
        province: string;
        postalCode: string | null;
        country: string;
        isDefault: boolean;
        userId: string;
        createdAt: Date;
        updatedAt: Date;
    };
    user: {
        email: string;
        id: string;
        name: string | null;
    };
} & {
    id: string;
    orderNumber: string;
    status: import("../../generated/prisma/enums").OrderStatus;
    subtotal: import("@prisma/client-runtime-utils").Decimal;
    shippingCost: import("@prisma/client-runtime-utils").Decimal;
    discount: import("@prisma/client-runtime-utils").Decimal;
    promoCode: string | null;
    total: import("@prisma/client-runtime-utils").Decimal;
    paymentMethod: import("../../generated/prisma/enums").PaymentMethod;
    paymentStatus: import("../../generated/prisma/enums").PaymentStatus;
    userId: string;
    shippingAddressId: string;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare function updateOrderStatus(orderId: string, body: {
    status?: string;
    paymentStatus?: string;
}): Promise<{
    items: ({
        productVariant: {
            product: {
                name: string;
            };
        } & {
            id: string;
            size: string | null;
            color: string | null;
            fabricType: string | null;
            sku: string;
            price: import("@prisma/client-runtime-utils").Decimal | null;
            stockQuantity: number;
            productId: string;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        quantity: number;
        priceAtPurchase: import("@prisma/client-runtime-utils").Decimal;
        orderId: string;
        productVariantId: string;
        customMeasurementId: string | null;
        createdAt: Date;
        updatedAt: Date;
    })[];
    shippingAddress: {
        id: string;
        label: string;
        fullName: string;
        phone: string;
        addressLine1: string;
        addressLine2: string | null;
        city: string;
        province: string;
        postalCode: string | null;
        country: string;
        isDefault: boolean;
        userId: string;
        createdAt: Date;
        updatedAt: Date;
    };
    user: {
        email: string;
        id: string;
        name: string | null;
    };
} & {
    id: string;
    orderNumber: string;
    status: import("../../generated/prisma/enums").OrderStatus;
    subtotal: import("@prisma/client-runtime-utils").Decimal;
    shippingCost: import("@prisma/client-runtime-utils").Decimal;
    discount: import("@prisma/client-runtime-utils").Decimal;
    promoCode: string | null;
    total: import("@prisma/client-runtime-utils").Decimal;
    paymentMethod: import("../../generated/prisma/enums").PaymentMethod;
    paymentStatus: import("../../generated/prisma/enums").PaymentStatus;
    userId: string;
    shippingAddressId: string;
    createdAt: Date;
    updatedAt: Date;
}>;
export interface AdminProductListParams {
    page: number;
    limit: number;
    search?: string;
    includeInactive?: boolean;
}
export declare function adminListProducts(params: AdminProductListParams): Promise<{
    data: ({
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
    })[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}>;
export declare function getProductById(productId: string): Promise<{
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
}>;
export interface CreateProductInput {
    name: string;
    slug?: string;
    description?: string;
    basePrice: number;
    isCustomizable?: boolean;
    categoryId: string;
    variants?: {
        size?: string;
        color?: string;
        fabricType?: string;
        sku: string;
        price?: number;
        stockQuantity?: number;
    }[];
}
export declare function createProduct(input: CreateProductInput): Promise<{
    category: {
        id: string;
        name: string;
        slug: string;
    };
    images: {
        id: string;
        url: string;
        altText: string | null;
        displayOrder: number;
        productId: string;
        createdAt: Date;
        updatedAt: Date;
    }[];
    variants: {
        id: string;
        size: string | null;
        color: string | null;
        fabricType: string | null;
        sku: string;
        price: import("@prisma/client-runtime-utils").Decimal | null;
        stockQuantity: number;
        productId: string;
        createdAt: Date;
        updatedAt: Date;
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
}>;
export interface UpdateProductInput {
    name?: string;
    description?: string;
    basePrice?: number;
    isCustomizable?: boolean;
    isActive?: boolean;
    categoryId?: string;
}
export declare function updateProduct(productId: string, input: UpdateProductInput): Promise<{
    category: {
        id: string;
        name: string;
        slug: string;
    };
    images: {
        id: string;
        url: string;
        altText: string | null;
        displayOrder: number;
        productId: string;
        createdAt: Date;
        updatedAt: Date;
    }[];
    variants: {
        id: string;
        size: string | null;
        color: string | null;
        fabricType: string | null;
        sku: string;
        price: import("@prisma/client-runtime-utils").Decimal | null;
        stockQuantity: number;
        productId: string;
        createdAt: Date;
        updatedAt: Date;
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
}>;
export declare function deleteProduct(productId: string): Promise<{
    deleted: boolean;
    productId: string;
}>;
export declare function listCategories(): Promise<{
    id: string;
    name: string;
    slug: string;
}[]>;
export interface UpdateVariantInput {
    size?: string;
    color?: string;
    fabricType?: string;
    sku?: string;
    price?: number | null;
    stockQuantity?: number;
}
export declare function updateVariant(variantId: string, input: UpdateVariantInput): Promise<{
    id: string;
    size: string | null;
    color: string | null;
    fabricType: string | null;
    sku: string;
    price: import("@prisma/client-runtime-utils").Decimal | null;
    stockQuantity: number;
    productId: string;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare function deleteVariant(variantId: string): Promise<{
    deleted: boolean;
    variantId: string;
}>;
export declare function createVariant(productId: string, input: UpdateVariantInput): Promise<{
    id: string;
    size: string | null;
    color: string | null;
    fabricType: string | null;
    sku: string;
    price: import("@prisma/client-runtime-utils").Decimal | null;
    stockQuantity: number;
    productId: string;
    createdAt: Date;
    updatedAt: Date;
}>;
//# sourceMappingURL=admin.service.d.ts.map
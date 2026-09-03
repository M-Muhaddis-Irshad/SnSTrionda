export interface OrderItemInput {
    productId: string;
    variantId: string;
    quantity: number;
    customMeasurementId?: string | null;
}
export interface ShippingAddressInput {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    province: string;
    postalCode?: string;
    country?: string;
}
export interface CreateOrderInput {
    items: OrderItemInput[];
    shippingAddress: ShippingAddressInput;
    paymentMethod: "JAZZCASH" | "EASYPAISA" | "COD" | "CARD";
    email?: string;
    promoCode?: string;
}
export declare const PROMO_CODES: Record<string, number>;
export declare function validatePromoCode(code?: string): {
    valid: boolean;
    message: string;
    code?: undefined;
    discountPercent?: undefined;
} | {
    valid: boolean;
    code: string;
    discountPercent: number;
    message: string;
};
export declare class OrderError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number);
}
export declare function getOrderByNumber(orderNumber: string, email?: string): Promise<({
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
}) | null>;
export declare function getMyOrderByNumber(orderNumber: string, userId: string): Promise<({
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
}) | null>;
export declare function getMyOrders(userId: string): Promise<({
    items: ({
        productVariant: {
            product: {
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
})[]>;
export declare function createOrder(input: CreateOrderInput, authUserId?: string): Promise<({
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
}) | null>;
//# sourceMappingURL=orders.service.d.ts.map
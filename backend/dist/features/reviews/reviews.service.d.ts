export declare class ReviewError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number);
}
export interface CreateReviewInput {
    productId: string;
    orderId: string;
    rating: number;
    title?: string;
    comment: string;
}
export declare function createReview(userId: string, input: CreateReviewInput): Promise<{
    id: string;
    userId: string;
    productId: string;
    orderId: string;
    rating: number;
    title: string | null;
    comment: string;
    status: string;
    approvedAt: Date | null;
    approvedBy: string | null;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare function listProductReviews(productId: string): Promise<({
    user: {
        id: string;
        name: string | null;
    };
} & {
    id: string;
    userId: string;
    productId: string;
    orderId: string;
    rating: number;
    title: string | null;
    comment: string;
    status: string;
    approvedAt: Date | null;
    approvedBy: string | null;
    createdAt: Date;
    updatedAt: Date;
})[]>;
export declare function listMyReviews(userId: string): Promise<({
    order: {
        orderNumber: string;
    };
    product: {
        id: string;
        name: string;
        slug: string;
    };
} & {
    id: string;
    userId: string;
    productId: string;
    orderId: string;
    rating: number;
    title: string | null;
    comment: string;
    status: string;
    approvedAt: Date | null;
    approvedBy: string | null;
    createdAt: Date;
    updatedAt: Date;
})[]>;
export declare function adminListReviews(status?: string): Promise<({
    order: {
        orderNumber: string;
        status: import("../../generated/prisma/enums").OrderStatus;
    };
    product: {
        id: string;
        images: {
            url: string;
        }[];
        name: string;
        slug: string;
    };
    user: {
        email: string;
        id: string;
        name: string | null;
    };
} & {
    id: string;
    userId: string;
    productId: string;
    orderId: string;
    rating: number;
    title: string | null;
    comment: string;
    status: string;
    approvedAt: Date | null;
    approvedBy: string | null;
    createdAt: Date;
    updatedAt: Date;
})[]>;
export declare function adminGetReview(id: string): Promise<{
    order: {
        orderNumber: string;
        status: import("../../generated/prisma/enums").OrderStatus;
    };
    product: {
        id: string;
        images: {
            url: string;
        }[];
        name: string;
        slug: string;
    };
    user: {
        email: string;
        id: string;
        name: string | null;
    };
} & {
    id: string;
    userId: string;
    productId: string;
    orderId: string;
    rating: number;
    title: string | null;
    comment: string;
    status: string;
    approvedAt: Date | null;
    approvedBy: string | null;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare function adminApproveReview(id: string, adminId: string): Promise<{
    id: string;
    userId: string;
    productId: string;
    orderId: string;
    rating: number;
    title: string | null;
    comment: string;
    status: string;
    approvedAt: Date | null;
    approvedBy: string | null;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare function adminRejectReview(id: string): Promise<{
    id: string;
    userId: string;
    productId: string;
    orderId: string;
    rating: number;
    title: string | null;
    comment: string;
    status: string;
    approvedAt: Date | null;
    approvedBy: string | null;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare function adminUnapproveReview(id: string): Promise<{
    id: string;
    userId: string;
    productId: string;
    orderId: string;
    rating: number;
    title: string | null;
    comment: string;
    status: string;
    approvedAt: Date | null;
    approvedBy: string | null;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare function adminDeleteReview(id: string): Promise<{
    deleted: boolean;
    id: string;
}>;
//# sourceMappingURL=reviews.service.d.ts.map
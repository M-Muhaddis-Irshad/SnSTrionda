export declare const USER_ROLES: readonly ["CUSTOMER", "ADMIN"];
export type UserRoleValue = (typeof USER_ROLES)[number];
export declare class UsersError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number);
}
export interface ListUsersParams {
    page: number;
    limit: number;
    role?: string;
    search?: string;
}
export declare function listUsers(params: ListUsersParams): Promise<{
    data: {
        _count: {
            orders: number;
        };
        createdAt: Date;
        email: string;
        emailVerified: Date | null;
        id: string;
        image: string | null;
        name: string | null;
        phone: string | null;
        role: import("../../generated/prisma/enums").UserRole;
        updatedAt: Date;
    }[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}>;
export declare function getUserProfile(userId: string): Promise<{
    _count: {
        orders: number;
    };
    createdAt: Date;
    email: string;
    emailVerified: Date | null;
    id: string;
    image: string | null;
    name: string | null;
    orders: {
        createdAt: Date;
        id: string;
        orderNumber: string;
        status: import("../../generated/prisma/enums").OrderStatus;
        total: import("@prisma/client-runtime-utils").Decimal;
    }[];
    phone: string | null;
    role: import("../../generated/prisma/enums").UserRole;
    updatedAt: Date;
}>;
export declare function changeUserRole(actorId: string | undefined, userId: string, role: UserRoleValue): Promise<{
    user: {
        createdAt: Date;
        email: string;
        emailVerified: Date | null;
        id: string;
        image: string | null;
        name: string | null;
        phone: string | null;
        role: import("../../generated/prisma/enums").UserRole;
        updatedAt: Date;
    } | null;
    fromRole: import("../../generated/prisma/enums").UserRole;
}>;
//# sourceMappingURL=users.service.d.ts.map
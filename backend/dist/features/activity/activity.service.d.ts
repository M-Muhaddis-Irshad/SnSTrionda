export interface ActivityListParams {
    page: number;
    limit: number;
    action?: string;
    entityType?: string;
    from?: string;
    to?: string;
}
export declare function listAdminActivity(params: ActivityListParams): Promise<{
    data: ({
        admin: {
            email: string;
            id: string;
            name: string | null;
        };
    } & {
        id: string;
        adminId: string;
        action: string;
        entityType: string;
        entityId: string;
        details: import("@prisma/client/runtime/client").JsonValue | null;
        createdAt: Date;
    })[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}>;
//# sourceMappingURL=activity.service.d.ts.map
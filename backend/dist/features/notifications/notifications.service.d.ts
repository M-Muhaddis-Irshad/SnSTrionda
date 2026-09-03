export declare class NotificationError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number);
}
export declare function listNotifications(userId: string, params: {
    page?: number;
    limit?: number;
    type?: string;
    unread?: boolean;
}): Promise<{
    data: {
        id: string;
        userId: string;
        type: string;
        title: string;
        message: string;
        data: import("@prisma/client/runtime/client").JsonValue | null;
        read: boolean;
        readAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }[];
    unreadCount: number;
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}>;
export declare function markRead(userId: string, notificationId: string): Promise<{
    id: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    data: import("@prisma/client/runtime/client").JsonValue | null;
    read: boolean;
    readAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare function markAllRead(userId: string): Promise<{
    updated: number;
}>;
export declare function deleteNotification(userId: string, notificationId: string): Promise<{
    deleted: boolean;
    id: string;
}>;
//# sourceMappingURL=notifications.service.d.ts.map
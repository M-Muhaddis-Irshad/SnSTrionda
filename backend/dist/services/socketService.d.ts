import { broadcastAdminStats } from "../lib/socket";
export declare function safeEmit(room: string, event: string, payload: unknown): void;
export declare const ORDER_STATUS_LABELS: Record<string, string>;
export declare function createNotification(userId: string, type: string, title: string, message: string, data?: Record<string, unknown> | null): Promise<{
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
} | null>;
export declare function logAdminActivity(adminId: string, action: string, entityType: string, entityId: string, details?: Record<string, unknown> | null): Promise<{
    id: string;
    adminId: string;
    action: string;
    entityType: string;
    entityId: string;
    details: import("@prisma/client/runtime/client").JsonValue | null;
    createdAt: Date;
} | null>;
export interface OrderForBroadcast {
    id: string;
    orderNumber: string;
    status: string;
    userId: string;
    user?: {
        id: string;
        name?: string | null;
        email?: string | null;
    } | null;
}
export declare function broadcastOrderStatusUpdate(order: OrderForBroadcast, opts?: {
    fromStatus?: string | null;
    adminId?: string;
    notes?: string | null;
}): Promise<void>;
export declare function notifyAdminsNewChatSession(session: {
    id: string;
    subject: string;
    customer?: {
        id: string;
        name?: string | null;
        email?: string | null;
    } | null;
}): Promise<void>;
export { broadcastAdminStats as pushAdminStats };
//# sourceMappingURL=socketService.d.ts.map
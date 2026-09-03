export declare class ChatError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number);
}
export interface CreateSessionInput {
    subject: string;
    orderId?: string;
}
export declare function createSession(customerId: string, input: CreateSessionInput): Promise<{
    id: string;
    subject: string;
    orderId: string | null;
    customerId: string;
    adminId: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare function listMySessions(userId: string): Promise<({
    _count: {
        messages: number;
    };
    admin: {
        id: string;
        name: string | null;
    } | null;
    messages: {
        id: string;
        chatSessionId: string;
        senderId: string;
        message: string;
        read: boolean;
        readAt: Date | null;
        createdAt: Date;
    }[];
    order: {
        id: string;
        orderNumber: string;
        status: import("../../generated/prisma/enums").OrderStatus;
    } | null;
} & {
    id: string;
    subject: string;
    orderId: string | null;
    customerId: string;
    adminId: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
})[]>;
export declare function listActiveSessions(statusFilter?: string): Promise<({
    _count: {
        messages: number;
    };
    admin: {
        id: string;
        name: string | null;
    } | null;
    customer: {
        email: string;
        id: string;
        name: string | null;
        phone: string | null;
    };
    messages: {
        id: string;
        chatSessionId: string;
        senderId: string;
        message: string;
        read: boolean;
        readAt: Date | null;
        createdAt: Date;
    }[];
    order: {
        id: string;
        orderNumber: string;
        status: import("../../generated/prisma/enums").OrderStatus;
        total: import("@prisma/client-runtime-utils").Decimal;
    } | null;
} & {
    id: string;
    subject: string;
    orderId: string | null;
    customerId: string;
    adminId: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
})[]>;
export declare function getSession(sessionId: string, actorId: string, role: string): Promise<{
    id: string;
    subject: string;
    orderId: string | null;
    customerId: string;
    adminId: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    unreadCount: number;
    admin: {
        email: string;
        id: string;
        name: string | null;
    } | null;
    customer: {
        email: string;
        id: string;
        name: string | null;
    };
    messages: {
        id: string;
        chatSessionId: string;
        senderId: string;
        message: string;
        read: boolean;
        readAt: Date | null;
        createdAt: Date;
    }[];
    order: {
        id: string;
        orderNumber: string;
        status: import("../../generated/prisma/enums").OrderStatus;
    } | null;
}>;
export declare function sendMessage(sessionId: string, senderId: string, role: string, text: string): Promise<{
    id: string;
    chatSessionId: string;
    senderId: string;
    message: string;
    read: boolean;
    readAt: Date | null;
    createdAt: Date;
}>;
export declare function closeSession(sessionId: string, actorId: string, role: string, resolve: boolean): Promise<{
    id: string;
    subject: string;
    orderId: string | null;
    customerId: string;
    adminId: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare function markMessagesRead(sessionId: string, actorId: string, role: string, messageIds?: string[]): Promise<{
    updated: number;
}>;
//# sourceMappingURL=chat.service.d.ts.map
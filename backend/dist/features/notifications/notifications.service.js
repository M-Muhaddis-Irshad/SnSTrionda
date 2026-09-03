"use strict";
// =============================================================================
// Notifications Feature — Business Logic Service
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationError = void 0;
exports.listNotifications = listNotifications;
exports.markRead = markRead;
exports.markAllRead = markAllRead;
exports.deleteNotification = deleteNotification;
const db_1 = require("../../db");
const socketService_1 = require("../../services/socketService");
// ---------------------------------------------------------------------------
// Custom Error
// ---------------------------------------------------------------------------
class NotificationError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.name = "NotificationError";
    }
}
exports.NotificationError = NotificationError;
// ---------------------------------------------------------------------------
// List — paginated, optional type / unread filter
// ---------------------------------------------------------------------------
async function listNotifications(userId, params) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(50, Math.max(1, params.limit || 20));
    const where = { userId };
    if (params.type)
        where.type = params.type;
    if (params.unread !== undefined)
        where.read = !params.unread;
    const [data, total, unreadCount] = await Promise.all([
        db_1.prisma.notification.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        }),
        db_1.prisma.notification.count({ where }),
        db_1.prisma.notification.count({ where: { userId, read: false } }),
    ]);
    return {
        data,
        unreadCount,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}
// ---------------------------------------------------------------------------
// Mark one as read (ownership enforced)
// ---------------------------------------------------------------------------
async function markRead(userId, notificationId) {
    const notification = await db_1.prisma.notification.findUnique({
        where: { id: notificationId },
    });
    if (!notification)
        throw new NotificationError("Notification not found.", 404);
    if (notification.userId !== userId) {
        throw new NotificationError("You do not have access to this notification.", 403);
    }
    const updated = await db_1.prisma.notification.update({
        where: { id: notificationId },
        data: { read: true, readAt: new Date() },
    });
    (0, socketService_1.safeEmit)(`user:${userId}`, "notification:marked-read", {
        notificationId,
        readAt: updated.readAt,
    });
    return updated;
}
// ---------------------------------------------------------------------------
// Mark all as read
// ---------------------------------------------------------------------------
async function markAllRead(userId) {
    const result = await db_1.prisma.notification.updateMany({
        where: { userId, read: false },
        data: { read: true, readAt: new Date() },
    });
    (0, socketService_1.safeEmit)(`user:${userId}`, "notification:marked-read", {
        notificationId: null,
        all: true,
        readAt: new Date().toISOString(),
    });
    return { updated: result.count };
}
// ---------------------------------------------------------------------------
// Delete one (ownership enforced)
// ---------------------------------------------------------------------------
async function deleteNotification(userId, notificationId) {
    const notification = await db_1.prisma.notification.findUnique({
        where: { id: notificationId },
    });
    if (!notification)
        throw new NotificationError("Notification not found.", 404);
    if (notification.userId !== userId) {
        throw new NotificationError("You do not have access to this notification.", 403);
    }
    await db_1.prisma.notification.delete({ where: { id: notificationId } });
    return { deleted: true, id: notificationId };
}
//# sourceMappingURL=notifications.service.js.map
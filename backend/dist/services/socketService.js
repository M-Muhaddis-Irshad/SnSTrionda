"use strict";
// =============================================================================
// Realtime Service — DB-backed helpers that fan out events over Socket.IO.
// Controllers/services call these AFTER a DB write succeeds, so a socket
// failure can never corrupt business state (every emit is fire-and-forget).
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.pushAdminStats = exports.ORDER_STATUS_LABELS = void 0;
exports.safeEmit = safeEmit;
exports.createNotification = createNotification;
exports.logAdminActivity = logAdminActivity;
exports.broadcastOrderStatusUpdate = broadcastOrderStatusUpdate;
exports.notifyAdminsNewChatSession = notifyAdminsNewChatSession;
const db_1 = require("../db");
const socket_1 = require("../lib/socket");
Object.defineProperty(exports, "pushAdminStats", { enumerable: true, get: function () { return socket_1.broadcastAdminStats; } });
// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------
function safeEmit(room, event, payload) {
    try {
        (0, socket_1.getIO)().to(room).emit(event, payload);
    }
    catch (err) {
        console.error(`Socket emit to "${room}" (${event}) failed:`, err);
    }
}
exports.ORDER_STATUS_LABELS = {
    PENDING: "Pending",
    CONFIRMED: "Confirmed",
    PROCESSING: "Processing",
    SHIPPED: "Shipped",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
};
// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------
// type: ORDER_STATUS | REVIEW_STATUS | CHAT_MESSAGE | ADMIN_UPDATE
async function createNotification(userId, type, title, message, data) {
    try {
        const notification = await db_1.prisma.notification.create({
            data: {
                userId,
                type,
                title,
                message,
                data: data ?? undefined,
            },
        });
        safeEmit(`user:${userId}`, "notification:new", {
            notificationId: notification.id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            data: notification.data,
            read: notification.read,
            createdAt: notification.createdAt,
        });
        return notification;
    }
    catch (err) {
        console.error("createNotification failed:", err);
        return null;
    }
}
// ---------------------------------------------------------------------------
// Admin activity log — persisted + live to the admin room
// ---------------------------------------------------------------------------
async function logAdminActivity(adminId, action, entityType, entityId, details) {
    try {
        const admin = await db_1.prisma.user.findUnique({
            where: { id: adminId },
            select: { id: true, name: true, email: true },
        });
        const entry = await db_1.prisma.adminActivity.create({
            data: {
                adminId,
                action,
                entityType,
                entityId,
                details: details ?? undefined,
            },
        });
        safeEmit("admin", "admin:activity-logged", {
            activityId: entry.id,
            adminId: entry.adminId,
            adminName: admin?.name || admin?.email || "Admin",
            action: entry.action,
            entityType: entry.entityType,
            entityId: entry.entityId,
            details: entry.details,
            timestamp: entry.createdAt,
        });
        return entry;
    }
    catch (err) {
        console.error("logAdminActivity failed:", err);
        return null;
    }
}
async function broadcastOrderStatusUpdate(order, opts = {}) {
    try {
        // 1. Persist the transition so the customer timeline is accurate
        const history = await db_1.prisma.orderStatusHistory.create({
            data: {
                orderId: order.id,
                status: order.status,
                notes: opts.notes || null,
            },
        });
        const label = exports.ORDER_STATUS_LABELS[order.status] || order.status;
        // 2. Notify + push to the customer (they get both the inbox entry and a
        //    live notification:new + order:status-updated event)
        await createNotification(order.userId, "ORDER_STATUS", `Order ${order.orderNumber} — ${label}`, `Your order ${order.orderNumber} is now ${label.toLowerCase()}${opts.notes ? ` — ${opts.notes}` : ""}.`, { orderId: order.id, orderNumber: order.orderNumber, status: order.status });
        const payload = {
            orderId: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            fromStatus: opts.fromStatus || null,
            statusChangedAt: history.statusChangedAt,
            notes: opts.notes || null,
            userId: order.userId,
        };
        safeEmit(`user:${order.userId}`, "order:status-updated", payload);
        safeEmit("admin", "order:status-updated", { ...payload, adminId: opts.adminId || null });
        // 3. Audit trail for other admins
        if (opts.adminId) {
            await logAdminActivity(opts.adminId, "UPDATE_ORDER_STATUS", "Order", order.orderNumber, {
                fromStatus: opts.fromStatus || null,
                toStatus: order.status,
            });
        }
        // 4. Refresh dashboard stats right away (don't wait for the 30s tick)
        (0, socket_1.broadcastAdminStats)().catch(() => { });
    }
    catch (err) {
        console.error("broadcastOrderStatusUpdate failed:", err);
    }
}
// ---------------------------------------------------------------------------
// Chat — notify admins when a customer opens a new session
// ---------------------------------------------------------------------------
async function notifyAdminsNewChatSession(session) {
    safeEmit("admin", "chat:session-opened", {
        chatSessionId: session.id,
        customerId: session.customer?.id,
        customerName: session.customer?.name || session.customer?.email || "Customer",
        subject: session.subject,
        openedAt: new Date().toISOString(),
    });
}
//# sourceMappingURL=socketService.js.map
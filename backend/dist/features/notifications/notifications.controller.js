"use strict";
// =============================================================================
// Notifications Feature — Request Handlers (Controller)
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleListNotifications = handleListNotifications;
exports.handleMarkRead = handleMarkRead;
exports.handleMarkAllRead = handleMarkAllRead;
exports.handleDeleteNotification = handleDeleteNotification;
const notifications_service_1 = require("./notifications.service");
function handleNotificationError(err, res) {
    if (err instanceof notifications_service_1.NotificationError) {
        return res.status(err.statusCode).json({ error: err.message });
    }
    console.error("Notification error:", err?.message || err);
    res.status(500).json({ error: "Internal server error" });
}
// ---------------------------------------------------------------------------
// GET /api/notifications — current user's notifications (paginated)
// ---------------------------------------------------------------------------
async function handleListNotifications(req, res) {
    try {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ error: "Authentication required." });
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
        const type = req.query.type || undefined;
        const unread = req.query.unread === "true" ? true : req.query.unread === "false" ? false : undefined;
        const result = await (0, notifications_service_1.listNotifications)(userId, { page, limit, type, unread });
        res.json(result);
    }
    catch (err) {
        handleNotificationError(err, res);
    }
}
// ---------------------------------------------------------------------------
// PATCH /api/notifications/:id/read
// ---------------------------------------------------------------------------
async function handleMarkRead(req, res) {
    try {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ error: "Authentication required." });
        const updated = await (0, notifications_service_1.markRead)(userId, req.params.id);
        res.json({ data: updated, message: "Notification marked as read." });
    }
    catch (err) {
        handleNotificationError(err, res);
    }
}
// ---------------------------------------------------------------------------
// POST /api/notifications/read-all
// ---------------------------------------------------------------------------
async function handleMarkAllRead(req, res) {
    try {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ error: "Authentication required." });
        const result = await (0, notifications_service_1.markAllRead)(userId);
        res.json({ ...result, message: "All notifications marked as read." });
    }
    catch (err) {
        handleNotificationError(err, res);
    }
}
// ---------------------------------------------------------------------------
// DELETE /api/notifications/:id
// ---------------------------------------------------------------------------
async function handleDeleteNotification(req, res) {
    try {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ error: "Authentication required." });
        const result = await (0, notifications_service_1.deleteNotification)(userId, req.params.id);
        res.json({ ...result, message: "Notification deleted." });
    }
    catch (err) {
        handleNotificationError(err, res);
    }
}
//# sourceMappingURL=notifications.controller.js.map
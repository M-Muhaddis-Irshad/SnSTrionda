"use strict";
// =============================================================================
// Notifications Feature — Route Definitions
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../auth/auth.middleware");
const notifications_controller_1 = require("./notifications.controller");
const router = (0, express_1.Router)();
// All notification routes require authentication
router.use(auth_middleware_1.authenticate);
// GET /api/notifications — paginated list (+ type / unread filters)
router.get("/", notifications_controller_1.handleListNotifications);
// PATCH /api/notifications/:id/read — mark one as read
router.patch("/:id/read", notifications_controller_1.handleMarkRead);
// POST /api/notifications/read-all — mark everything read
router.post("/read-all", notifications_controller_1.handleMarkAllRead);
// DELETE /api/notifications/:id
router.delete("/:id", notifications_controller_1.handleDeleteNotification);
exports.default = router;
//# sourceMappingURL=notifications.routes.js.map
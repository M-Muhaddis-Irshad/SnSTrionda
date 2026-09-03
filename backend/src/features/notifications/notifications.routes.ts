// =============================================================================
// Notifications Feature — Route Definitions
// =============================================================================

import { Router } from "express";
import { authenticate } from "../auth/auth.middleware";
import {
  handleListNotifications,
  handleMarkRead,
  handleMarkAllRead,
  handleDeleteNotification,
} from "./notifications.controller";

const router = Router();

// All notification routes require authentication
router.use(authenticate);

// GET /api/notifications — paginated list (+ type / unread filters)
router.get("/", handleListNotifications);

// PATCH /api/notifications/:id/read — mark one as read
router.patch("/:id/read", handleMarkRead);

// POST /api/notifications/read-all — mark everything read
router.post("/read-all", handleMarkAllRead);

// DELETE /api/notifications/:id
router.delete("/:id", handleDeleteNotification);

export default router;

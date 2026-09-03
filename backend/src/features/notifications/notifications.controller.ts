// =============================================================================
// Notifications Feature — Request Handlers (Controller)
// =============================================================================

import { Request, Response } from "express";
import {
  listNotifications,
  markRead,
  markAllRead,
  deleteNotification,
  NotificationError,
} from "./notifications.service";

function handleNotificationError(err: any, res: Response) {
  if (err instanceof NotificationError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  console.error("Notification error:", err?.message || err);
  res.status(500).json({ error: "Internal server error" });
}

// ---------------------------------------------------------------------------
// GET /api/notifications — current user's notifications (paginated)
// ---------------------------------------------------------------------------

export async function handleListNotifications(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Authentication required." });

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const type = (req.query.type as string) || undefined;
    const unread =
      req.query.unread === "true" ? true : req.query.unread === "false" ? false : undefined;

    const result = await listNotifications(userId, { page, limit, type, unread });
    res.json(result);
  } catch (err: any) {
    handleNotificationError(err, res);
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/notifications/:id/read
// ---------------------------------------------------------------------------

export async function handleMarkRead(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Authentication required." });

    const updated = await markRead(userId, req.params.id as string);
    res.json({ data: updated, message: "Notification marked as read." });
  } catch (err: any) {
    handleNotificationError(err, res);
  }
}

// ---------------------------------------------------------------------------
// POST /api/notifications/read-all
// ---------------------------------------------------------------------------

export async function handleMarkAllRead(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Authentication required." });

    const result = await markAllRead(userId);
    res.json({ ...result, message: "All notifications marked as read." });
  } catch (err: any) {
    handleNotificationError(err, res);
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/notifications/:id
// ---------------------------------------------------------------------------

export async function handleDeleteNotification(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Authentication required." });

    const result = await deleteNotification(userId, req.params.id as string);
    res.json({ ...result, message: "Notification deleted." });
  } catch (err: any) {
    handleNotificationError(err, res);
  }
}

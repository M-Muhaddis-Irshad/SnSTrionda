// =============================================================================
// Notifications Feature — Business Logic Service
// =============================================================================

import { prisma } from "../../db";
import { safeEmit } from "../../services/socketService";

// ---------------------------------------------------------------------------
// Custom Error
// ---------------------------------------------------------------------------

export class NotificationError extends Error {
  public statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = "NotificationError";
  }
}

// ---------------------------------------------------------------------------
// List — paginated, optional type / unread filter
// ---------------------------------------------------------------------------

export async function listNotifications(
  userId: string,
  params: { page?: number; limit?: number; type?: string; unread?: boolean }
) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(50, Math.max(1, params.limit || 20));

  const where: any = { userId };
  if (params.type) where.type = params.type;
  if (params.unread !== undefined) where.read = !params.unread;

  const [data, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, read: false } }),
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

export async function markRead(userId: string, notificationId: string) {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });
  if (!notification) throw new NotificationError("Notification not found.", 404);
  if (notification.userId !== userId) {
    throw new NotificationError("You do not have access to this notification.", 403);
  }

  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true, readAt: new Date() },
  });

  safeEmit(`user:${userId}`, "notification:marked-read", {
    notificationId,
    readAt: updated.readAt,
  });

  return updated;
}

// ---------------------------------------------------------------------------
// Mark all as read
// ---------------------------------------------------------------------------

export async function markAllRead(userId: string) {
  const result = await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true, readAt: new Date() },
  });

  safeEmit(`user:${userId}`, "notification:marked-read", {
    notificationId: null,
    all: true,
    readAt: new Date().toISOString(),
  });

  return { updated: result.count };
}

// ---------------------------------------------------------------------------
// Delete one (ownership enforced)
// ---------------------------------------------------------------------------

export async function deleteNotification(userId: string, notificationId: string) {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });
  if (!notification) throw new NotificationError("Notification not found.", 404);
  if (notification.userId !== userId) {
    throw new NotificationError("You do not have access to this notification.", 403);
  }

  await prisma.notification.delete({ where: { id: notificationId } });
  return { deleted: true, id: notificationId };
}

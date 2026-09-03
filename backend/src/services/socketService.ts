// =============================================================================
// Realtime Service — DB-backed helpers that fan out events over Socket.IO.
// Controllers/services call these AFTER a DB write succeeds, so a socket
// failure can never corrupt business state (every emit is fire-and-forget).
// =============================================================================

import { prisma } from "../db";
import { getIO, broadcastAdminStats } from "../lib/socket";

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

export function safeEmit(room: string, event: string, payload: unknown): void {
  try {
    getIO().to(room).emit(event, payload);
  } catch (err) {
    console.error(`Socket emit to "${room}" (${event}) failed:`, err);
  }
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
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

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  data?: Record<string, unknown> | null
) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data: (data as any) ?? undefined,
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
  } catch (err) {
    console.error("createNotification failed:", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Admin activity log — persisted + live to the admin room
// ---------------------------------------------------------------------------

export async function logAdminActivity(
  adminId: string,
  action: string,
  entityType: string,
  entityId: string,
  details?: Record<string, unknown> | null
) {
  try {
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { id: true, name: true, email: true },
    });

    const entry = await prisma.adminActivity.create({
      data: {
        adminId,
        action,
        entityType,
        entityId,
        details: (details as any) ?? undefined,
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
  } catch (err) {
    console.error("logAdminActivity failed:", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Order status updates — history record + customer notification + broadcasts
// ---------------------------------------------------------------------------

export interface OrderForBroadcast {
  id: string;
  orderNumber: string;
  status: string;
  userId: string;
  user?: { id: string; name?: string | null; email?: string | null } | null;
}

export async function broadcastOrderStatusUpdate(
  order: OrderForBroadcast,
  opts: { fromStatus?: string | null; adminId?: string; notes?: string | null } = {}
) {
  try {
    // 1. Persist the transition so the customer timeline is accurate
    const history = await prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: order.status,
        notes: opts.notes || null,
      },
    });

    const label = ORDER_STATUS_LABELS[order.status] || order.status;

    // 2. Notify + push to the customer (they get both the inbox entry and a
    //    live notification:new + order:status-updated event)
    await createNotification(
      order.userId,
      "ORDER_STATUS",
      `Order ${order.orderNumber} — ${label}`,
      `Your order ${order.orderNumber} is now ${label.toLowerCase()}${
        opts.notes ? ` — ${opts.notes}` : ""
      }.`,
      { orderId: order.id, orderNumber: order.orderNumber, status: order.status }
    );

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
    broadcastAdminStats().catch(() => {});
  } catch (err) {
    console.error("broadcastOrderStatusUpdate failed:", err);
  }
}

// ---------------------------------------------------------------------------
// Chat — notify admins when a customer opens a new session
// ---------------------------------------------------------------------------

export async function notifyAdminsNewChatSession(session: {
  id: string;
  subject: string;
  customer?: { id: string; name?: string | null; email?: string | null } | null;
}) {
  safeEmit("admin", "chat:session-opened", {
    chatSessionId: session.id,
    customerId: session.customer?.id,
    customerName: session.customer?.name || session.customer?.email || "Customer",
    subject: session.subject,
    openedAt: new Date().toISOString(),
  });
}

// ---------------------------------------------------------------------------
// Refresh admin dashboard stats (e.g. right after an order is placed)
// ---------------------------------------------------------------------------

export { broadcastAdminStats as pushAdminStats };

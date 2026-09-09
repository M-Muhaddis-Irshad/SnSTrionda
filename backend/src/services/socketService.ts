// =============================================================================
// Realtime Service — HTTP bridge to the standalone Socket.IO server.
//
// Instead of calling getIO().to(room).emit(...) directly (which only worked
// when Socket.IO was co-located), we now POST to the socket server's /emit
// endpoint. This allows the backend (Vercel) and socket server (Render)
// to run as separate deployments.
// =============================================================================

import { prisma } from "../db";

const SOCKET_SERVER_URL = process.env.SOCKET_SERVER_URL || "http://localhost:5001";
const EMIT_API_KEY = process.env.EMIT_API_KEY || "";

// ---------------------------------------------------------------------------
// HTTP-based emit — posts to the socket server's /emit bridge
// ---------------------------------------------------------------------------

async function emitToSocket(room: string, event: string, payload: unknown): Promise<void> {
  try {
    await fetch(`${SOCKET_SERVER_URL}/emit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${EMIT_API_KEY}`,
      },
      body: JSON.stringify({ room, event, payload }),
      signal: AbortSignal.timeout(5000), // 5s timeout — fire and forget
    });
  } catch (err) {
    // Socket server may be cold-starting on Render — log but never crash
    console.error(`Socket emit to "${room}" (${event}) failed:`, err);
  }
}

// Safe emit wrapper — same API as before, just HTTP under the hood
export function safeEmit(room: string, event: string, payload: unknown): void {
  emitToSocket(room, event, payload).catch(() => {});
}

// Batch emit — multiple rooms in one HTTP call
async function emitBatch(
  emits: Array<{ room: string; event: string; payload: unknown }>
): Promise<void> {
  try {
    await fetch(`${SOCKET_SERVER_URL}/emit/batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${EMIT_API_KEY}`,
      },
      body: JSON.stringify({ emits }),
      signal: AbortSignal.timeout(5000),
    });
  } catch (err) {
    console.error("Socket batch emit failed:", err);
  }
}

// ---------------------------------------------------------------------------
// Catalog change — broadcast after admin writes that affect storefront data
// ---------------------------------------------------------------------------

export function broadcastCatalogChange(
  action: "created" | "updated" | "deleted",
  entityType: "product" | "category" | "coupon" | "discount" | "collection" | "settings",
  entity?: Record<string, unknown> | null
): void {
  safeEmit("storefront", "catalog:changed", {
    action,
    entityType,
    entity: entity ?? null,
    at: new Date().toISOString(),
  });
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
// Admin activity log
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
// Order status updates
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
    // 1. Persist the transition
    const history = await prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: order.status,
        notes: opts.notes || null,
      },
    });

    const label = ORDER_STATUS_LABELS[order.status] || order.status;

    // 2. Notify + push to the customer
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

    // 3. Audit trail
    if (opts.adminId) {
      await logAdminActivity(opts.adminId, "UPDATE_ORDER_STATUS", "Order", order.orderNumber, {
        fromStatus: opts.fromStatus || null,
        toStatus: order.status,
      });
    }

    // 4. Refresh dashboard stats
    // Note: admin stats are computed by the socket server itself on a 30s tick
    // We just trigger a refresh via the emit bridge
    safeEmit("admin", "admin:refresh-stats", {});
  } catch (err) {
    console.error("broadcastOrderStatusUpdate failed:", err);
  }
}

// ---------------------------------------------------------------------------
// Chat
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
// Dashboard stats refresh (trigger socket server to recompute)
// ---------------------------------------------------------------------------

export function pushAdminStats(): void {
  safeEmit("admin", "admin:refresh-stats", {});
}

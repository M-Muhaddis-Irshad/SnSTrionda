// =============================================================================
// Socket.IO Server — Real-time layer for Trionda Wears (standalone)
// =============================================================================
//
// Rooms:
//   user:<userId>      — private room for one user (notifications, order status)
//   admin              — all connected admins (stats, activity, new orders)
//   admin:<adminId>    — per-admin room
//   chat:<sessionId>   — participants of a single chat session
//   storefront         — catalog changes for live storefront refresh
// =============================================================================

import { Server, Socket } from "socket.io";
import http from "http";
import jwt from "jsonwebtoken";
import { prisma } from "../db";
import { getAllowedOrigins } from "../config/corsOrigins";
import { setIO } from "../services/emitService";

const JWT_SECRET = process.env.JWT_SECRET!;
const ADMIN_STATS_INTERVAL_MS = 30_000;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AuthPayload {
  userId: string;
  email: string;
  role: string;
  type: "access";
}

export interface AdminStats {
  totalOrders: number;
  totalRevenue: number;
  ordersToday: number;
  revenueToday: number;
  pendingReviews: number;
  activeChats: number;
  connectedAdmins: number;
}

// ---------------------------------------------------------------------------
// JWT verification
// ---------------------------------------------------------------------------

function verifySocketToken(token: string): AuthPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    if (decoded.type !== "access") return null;
    return decoded;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Admin stats
// ---------------------------------------------------------------------------

export async function computeAdminStats(): Promise<AdminStats> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [
    totalOrders,
    paidAgg,
    ordersToday,
    paidTodayAgg,
    pendingReviews,
    activeChats,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.aggregate({
      where: { paymentStatus: "PAID" },
      _sum: { total: true },
    }),
    prisma.order.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.order.aggregate({
      where: { paymentStatus: "PAID", createdAt: { gte: startOfDay } },
      _sum: { total: true },
    }),
    prisma.review.count({ where: { status: "PENDING" } }),
    prisma.chatSession.count({ where: { status: "OPEN" } }),
  ]);

  const io = getIOInstance();
  const connectedAdmins = io
    ? io.sockets.adapter.rooms.get("admin")?.size || 0
    : 0;

  return {
    totalOrders,
    totalRevenue: Number(paidAgg._sum.total || 0),
    ordersToday,
    revenueToday: Number(paidTodayAgg._sum.total || 0),
    pendingReviews,
    activeChats,
    connectedAdmins,
  };
}

let ioInstance: Server | null = null;
function getIOInstance(): Server | null {
  return ioInstance;
}

export async function broadcastAdminStats(): Promise<void> {
  try {
    const roomSize = ioInstance?.sockets.adapter.rooms.get("admin")?.size || 0;
    if (roomSize === 0) return;
    const stats = await computeAdminStats();
    ioInstance?.to("admin").emit("admin:stats-updated", {
      ...stats,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("admin:stats-updated broadcast failed:", err);
  }
}

// ---------------------------------------------------------------------------
// initSocket — creates and configures the Socket.IO server
// ---------------------------------------------------------------------------

export function initSocket(httpServer: http.Server): Server {
  const CORS_ORIGINS = getAllowedOrigins();

  const io = new Server(httpServer, {
    cors: {
      origin: CORS_ORIGINS,
      credentials: true,
    },
    transports: ["websocket", "polling"],
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  ioInstance = io;
  setIO(io);

  // Auth middleware
  io.use((socket: Socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      (socket.handshake.headers?.authorization?.startsWith("Bearer ")
        ? socket.handshake.headers.authorization.split(" ")[1]
        : null);

    if (!token) {
      return next(new Error("Authentication required. Please provide a valid token."));
    }

    const payload = verifySocketToken(token);
    if (!payload) {
      return next(new Error("Invalid or expired token."));
    }

    (socket as any).user = payload;
    next();
  });

  // Connection handler
  io.on("connection", (socket: Socket) => {
    const user = (socket as any).user as AuthPayload;
    const isAdmin = user.role === "ADMIN";
    console.log(`🔌 Socket connected: ${socket.id} (user: ${user.userId}, role: ${user.role})`);

    socket.join(`user:${user.userId}`);
    socket.join("storefront");

    if (isAdmin) {
      socket.join("admin");
      socket.join(`admin:${user.userId}`);
      console.log(`   ↳ Joined admin room (${user.userId})`);

      broadcastAdminStats().catch(() => {});

      prisma.adminActivity
        .findMany({
          take: 10,
          orderBy: { createdAt: "desc" },
          include: { admin: { select: { id: true, name: true, email: true } } },
        })
        .then((recent) => {
          for (const entry of recent) {
            socket.emit("admin:activity-logged", {
              activityId: entry.id,
              adminId: entry.adminId,
              adminName: entry.admin.name || entry.admin.email || "Admin",
              action: entry.action,
              entityType: entry.entityType,
              entityId: entry.entityId,
              details: entry.details,
              timestamp: entry.createdAt,
            });
          }
        })
        .catch((err) => console.error("Activity replay failed:", err));
    }

    // Chat room membership
    socket.on("chat:join", async (sessionId: string, ack?: (ok: boolean) => void) => {
      try {
        if (!sessionId) return;
        const session = await prisma.chatSession.findUnique({
          where: { id: sessionId },
          select: { id: true, customerId: true, adminId: true },
        });
        if (!session) return;
        const isParticipant =
          session.customerId === user.userId ||
          isAdmin ||
          session.adminId === user.userId;
        if (!isParticipant) return;
        socket.join(`chat:${sessionId}`);
        console.log(`   ↳ ${user.userId} joined chat:${sessionId}`);
        ack?.(true);
      } catch (err) {
        console.error("chat:join failed:", err);
      }
    });

    socket.on("chat:leave", (sessionId: string) => {
      if (sessionId) socket.leave(`chat:${sessionId}`);
    });

    socket.on("join-user-room", () => {
      socket.join(`user:${user.userId}`);
    });

    socket.emit("server:ready", {
      connectedAt: new Date().toISOString(),
      role: user.role,
    });

    socket.on("disconnect", (reason) => {
      console.log(`🔌 Socket disconnected: ${socket.id} (reason: ${reason})`);
    });
  });

  console.log("🔌 Socket.IO server initialized");

  // Periodic stats push
  const statsTimer = setInterval(() => {
    broadcastAdminStats().catch(() => {});
  }, ADMIN_STATS_INTERVAL_MS);
  if (typeof statsTimer.unref === "function") statsTimer.unref();

  return io;
}

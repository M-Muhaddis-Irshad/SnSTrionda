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
//
// This server has NO direct database connection. All DB reads are performed
// by the backend (Vercel) via internal HTTP endpoints, keeping the socket
// server as a pure Socket.IO relay.
// =============================================================================

import { Server, Socket } from "socket.io";
import http from "http";
import jwt from "jsonwebtoken";
import { getAllowedOrigins } from "../config/corsOrigins";
import { setIO } from "../services/emitService";

// Read lazily after dotenv.config() has run in server.ts
let JWT_SECRET = "";
let BACKEND_URL = "http://localhost:5000";
let EMIT_API_KEY = "";
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
// HTTP helper — calls the backend's internal endpoints
// ---------------------------------------------------------------------------

async function backendGet<T = any>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/internal${path}`, {
      headers: { Authorization: `Bearer ${EMIT_API_KEY}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch (err) {
    console.error(`Backend GET ${path} failed:`, err);
    return null;
  }
}

async function backendPost<T = any>(path: string, body: unknown): Promise<T | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/internal${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${EMIT_API_KEY}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch (err) {
    console.error(`Backend POST ${path} failed:`, err);
    return null;
  }
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
// Admin stats — fetched from the backend via HTTP
// ---------------------------------------------------------------------------

let ioInstance: Server | null = null;

function getIOInstance(): Server | null {
  return ioInstance;
}

export async function broadcastAdminStats(): Promise<void> {
  try {
    const roomSize = ioInstance?.sockets.adapter.rooms.get("admin")?.size || 0;
    if (roomSize === 0) return;

    const dbStats = await backendGet<{
      totalOrders: number;
      totalRevenue: number;
      ordersToday: number;
      revenueToday: number;
      pendingReviews: number;
      activeChats: number;
    }>("/admin-stats");

    if (!dbStats) return; // backend may be cold-starting

    const connectedAdmins = ioInstance?.sockets.adapter.rooms.get("admin")?.size || 0;

    ioInstance?.to("admin").emit("admin:stats-updated", {
      ...dbStats,
      connectedAdmins,
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
  // Env vars are now available because dotenv.config() ran before this call
  JWT_SECRET = process.env.JWT_SECRET || "";
  BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";
  EMIT_API_KEY = process.env.EMIT_API_KEY || "";
  console.log(`📋 JWT_SECRET loaded: ${JWT_SECRET ? "YES" : "NO"}, BACKEND_URL: ${BACKEND_URL}`);

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

      // Push stats immediately
      broadcastAdminStats().catch(() => {});

      // Replay recent admin activity via backend HTTP
      backendPost<{ activities: Array<Record<string, unknown>> }>("/admin-connected", {
        adminId: user.userId,
      })
        .then((result) => {
          if (!result?.activities) return;
          for (const entry of result.activities) {
            socket.emit("admin:activity-logged", entry);
          }
        })
        .catch((err) => console.error("Activity replay failed:", err));
    }

    // Chat room membership — validated via backend HTTP
    socket.on("chat:join", async (sessionId: string, ack?: (ok: boolean) => void) => {
      try {
        if (!sessionId) return;
        const result = await backendPost<{ isParticipant: boolean }>(
          "/validate-chat-member",
          { sessionId, userId: user.userId, isAdmin }
        );
        if (!result?.isParticipant) return;
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

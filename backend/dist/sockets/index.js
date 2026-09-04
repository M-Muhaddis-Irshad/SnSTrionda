"use strict";
// =============================================================================
// Socket.IO Server — Real-time layer for Trionda Wears
// =============================================================================
//
// Rooms:
//   user:<userId>      — private room for one user (notifications, order status)
//   admin              — all connected admins (stats, activity, new orders)
//   admin:<adminId>    — per-admin room (future per-admin targeting)
//   chat:<sessionId>   — participants of a single chat session
//
// Namespaces: the app intentionally uses ONE namespace (the default) with
// room-based targeting — simpler to secure and reason about at this scale.
// =============================================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifySocketToken = verifySocketToken;
exports.getIO = getIO;
exports.computeAdminStats = computeAdminStats;
exports.broadcastAdminStats = broadcastAdminStats;
exports.initSocket = initSocket;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../db");
const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_STATS_INTERVAL_MS = 30000; // push admin:stats-updated every 30s
// ---------------------------------------------------------------------------
// Reusable JWT verification (same logic as auth.middleware.ts)
// ---------------------------------------------------------------------------
function verifySocketToken(token) {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        if (decoded.type !== "access")
            return null;
        return decoded;
    }
    catch {
        return null;
    }
}
// ---------------------------------------------------------------------------
// CORS origins — must match existing Express CORS config
// ---------------------------------------------------------------------------
const CORS_ORIGINS = [
    process.env.CORS_ORIGIN || "http://localhost:3000",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:3003",
    "http://localhost:3004",
    "http://localhost:3005",
    "http://localhost:3006",
    "http://localhost:3007",
];
// ---------------------------------------------------------------------------
// Singleton io instance (exported for other modules to emit events later)
// ---------------------------------------------------------------------------
let io = null;
function getIO() {
    if (!io)
        throw new Error("Socket.IO not initialized yet. Call initSocket() first.");
    return io;
}
// ---------------------------------------------------------------------------
// Admin stats — computed from the DB, broadcast to the admin room
// ---------------------------------------------------------------------------
async function computeAdminStats() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const [totalOrders, paidAgg, ordersToday, paidTodayAgg, pendingReviews, activeChats,] = await Promise.all([
        db_1.prisma.order.count(),
        db_1.prisma.order.aggregate({
            where: { paymentStatus: "PAID" },
            _sum: { total: true },
        }),
        db_1.prisma.order.count({ where: { createdAt: { gte: startOfDay } } }),
        db_1.prisma.order.aggregate({
            where: { paymentStatus: "PAID", createdAt: { gte: startOfDay } },
            _sum: { total: true },
        }),
        db_1.prisma.review.count({ where: { status: "PENDING" } }),
        db_1.prisma.chatSession.count({ where: { status: "OPEN" } }),
    ]);
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
// Broadcast latest stats to all connected admins (fire and forget).
// Skips the DB work entirely when no admin is connected.
async function broadcastAdminStats() {
    try {
        const roomSize = io?.sockets.adapter.rooms.get("admin")?.size || 0;
        if (roomSize === 0)
            return;
        const stats = await computeAdminStats();
        io?.to("admin").emit("admin:stats-updated", {
            ...stats,
            timestamp: new Date().toISOString(),
        });
    }
    catch (err) {
        console.error("admin:stats-updated broadcast failed:", err);
    }
}
// ---------------------------------------------------------------------------
// initSocket — creates and configures the Socket.IO server
// ---------------------------------------------------------------------------
function initSocket(httpServer) {
    io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: CORS_ORIGINS,
            credentials: true,
        },
        transports: ["websocket", "polling"],
        pingInterval: 25000,
        pingTimeout: 20000,
    });
    // -------------------------------------------------------------------------
    // Auth middleware — runs before every connection
    // -------------------------------------------------------------------------
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token ||
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
        socket.user = payload;
        next();
    });
    // -------------------------------------------------------------------------
    // Connection handler
    // -------------------------------------------------------------------------
    io.on("connection", (socket) => {
        const user = socket.user;
        const isAdmin = user.role === "ADMIN";
        console.log(`🔌 Socket connected: ${socket.id} (user: ${user.userId}, role: ${user.role})`);
        // Personal room — notifications & order status updates target this
        socket.join(`user:${user.userId}`);
        // Admin room — new orders, stats, activity feed
        if (isAdmin) {
            socket.join("admin");
            socket.join(`admin:${user.userId}`);
            console.log(`   ↳ Joined admin room (${user.userId})`);
            // Immediate sync so a fresh dashboard is populated before the 30s tick
            broadcastAdminStats().catch(() => { });
            // Replay the most recent activity so a freshly opened feed is not empty
            db_1.prisma.adminActivity
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
        // -----------------------------------------------------------------------
        // Chat room membership (requested by the chat UI when a session is opened)
        // -----------------------------------------------------------------------
        socket.on("chat:join", async (sessionId, ack) => {
            try {
                if (!sessionId)
                    return;
                const session = await db_1.prisma.chatSession.findUnique({
                    where: { id: sessionId },
                    select: { id: true, customerId: true, adminId: true },
                });
                if (!session)
                    return;
                const isParticipant = session.customerId === user.userId ||
                    isAdmin ||
                    session.adminId === user.userId;
                if (!isParticipant)
                    return;
                socket.join(`chat:${sessionId}`);
                console.log(`   ↳ ${user.userId} joined chat:${sessionId}`);
                ack?.(true);
            }
            catch (err) {
                console.error("chat:join failed:", err);
            }
        });
        socket.on("chat:leave", (sessionId) => {
            if (sessionId)
                socket.leave(`chat:${sessionId}`);
        });
        // Support explicit room join (parity with the mobile/customer apps)
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
    // -------------------------------------------------------------------------
    // Periodic stats push to the admin room (every 30 seconds)
    // -------------------------------------------------------------------------
    const statsTimer = setInterval(() => {
        broadcastAdminStats().catch(() => { });
    }, ADMIN_STATS_INTERVAL_MS);
    // Do not keep the process alive solely for the timer (server listen does that)
    if (typeof statsTimer.unref === "function")
        statsTimer.unref();
    return io;
}
//# sourceMappingURL=index.js.map
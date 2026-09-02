"use strict";
// =============================================================================
// Socket.IO Server — Real-time layer for Trionda Wears
// =============================================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifySocketToken = verifySocketToken;
exports.getIO = getIO;
exports.initSocket = initSocket;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET;
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
// initSocket — creates and configures the Socket.IO server
// ---------------------------------------------------------------------------
function initSocket(httpServer) {
    io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: CORS_ORIGINS,
            credentials: true,
        },
        // Allow upgrade from polling to websocket
        transports: ["websocket", "polling"],
        // Ping interval / timeout for connection health
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
        // Attach decoded payload to socket data for use in connection handler
        socket.user = payload;
        next();
    });
    // -------------------------------------------------------------------------
    // Connection handler
    // -------------------------------------------------------------------------
    io.on("connection", (socket) => {
        const user = socket.user;
        console.log(`🔌 Socket connected: ${socket.id} (user: ${user.userId}, role: ${user.role})`);
        // Join personal room so we can target this user directly
        socket.join(`user:${user.userId}`);
        // If admin, also join the admin broadcast room
        if (user.role === "admin") {
            socket.join("admin");
            console.log(`   ↳ Joined admin room`);
        }
        // STEP 7: Emit server:ready to this socket only
        socket.emit("server:ready", {
            connectedAt: new Date().toISOString(),
        });
        // Handle disconnection
        socket.on("disconnect", (reason) => {
            console.log(`🔌 Socket disconnected: ${socket.id} (reason: ${reason})`);
        });
    });
    console.log("🔌 Socket.IO server initialized");
    return io;
}
//# sourceMappingURL=socket.js.map
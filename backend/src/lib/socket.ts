// =============================================================================
// Socket.IO Server — Real-time layer for Trionda Wears
// =============================================================================

import { Server, Socket } from "socket.io";
import http from "http";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuthPayload {
  userId: string;
  email: string;
  role: string;
  type: "access";
}

// ---------------------------------------------------------------------------
// Reusable JWT verification (same logic as auth.middleware.ts)
// ---------------------------------------------------------------------------

export function verifySocketToken(token: string): AuthPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    if (decoded.type !== "access") return null;
    return decoded;
  } catch {
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

let io: Server | null = null;

export function getIO(): Server {
  if (!io) throw new Error("Socket.IO not initialized yet. Call initSocket() first.");
  return io;
}

// ---------------------------------------------------------------------------
// initSocket — creates and configures the Socket.IO server
// ---------------------------------------------------------------------------

export function initSocket(httpServer: http.Server): Server {
  io = new Server(httpServer, {
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

    // Attach decoded payload to socket data for use in connection handler
    (socket as any).user = payload;
    next();
  });

  // -------------------------------------------------------------------------
  // Connection handler
  // -------------------------------------------------------------------------
  io.on("connection", (socket: Socket) => {
    const user = (socket as any).user as AuthPayload;
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

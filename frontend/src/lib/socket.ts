// =============================================================================
// Socket.IO Client — Singleton real-time connection for Trionda Wears
// =============================================================================

import { io, Socket } from "socket.io-client";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

let socket: Socket | null = null;

// ---------------------------------------------------------------------------
// getSocket — lazily creates and returns a single Socket.IO instance
// Only connects if user is authenticated (has an access token).
// ---------------------------------------------------------------------------

export function getSocket(): Socket | null {
  // Avoid SSR issues — only run in browser
  if (typeof window === "undefined") return null;

  // Lazy import to avoid circular deps at module level
  const { useAuthStore } = require("@/stores/authStore");
  const { accessToken, isAuthenticated } = useAuthStore.getState();

  if (!isAuthenticated() || !accessToken) {
    // Don't connect anonymous users
    return null;
  }

  // If already connected, return existing instance
  if (socket?.connected) {
    return socket;
  }

  // If instance exists but disconnected, reconnect
  if (socket) {
    socket.auth = { token: accessToken };
    socket.connect();
    return socket;
  }

  // Create new connection
  socket = io(BACKEND_URL, {
    auth: {
      token: accessToken,
    },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socket.on("connect", () => {
    console.log("🔌 Socket connected:", socket?.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("🔌 Socket disconnected:", reason);
  });

  socket.on("connect_error", (err) => {
    console.error("🔌 Socket connection error:", err.message);
  });

  socket.on("server:ready", (data) => {
    console.log("🔌 Server ready:", data);
  });

  return socket;
}

// ---------------------------------------------------------------------------
// disconnectSocket — cleanly disconnect (e.g. on logout)
// ---------------------------------------------------------------------------

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

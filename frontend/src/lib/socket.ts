// =============================================================================
// Socket.IO Client — Singleton real-time connection for Trionda Wears
// =============================================================================
// Global listeners (attached once per socket instance) keep the notification
// store, toast host and page-level stores in sync. Only authenticated users
// connect — the server rejects anonymous sockets.
// =============================================================================

import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/stores/authStore";
import { useNotificationStore } from "@/stores/notificationStore";
import { useToastStore } from "@/stores/toastStore";
import type { AppNotification } from "@/types/realtime";

export const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

let socket: Socket | null = null;

function isOnPath(segment: string): boolean {
  if (typeof window === "undefined") return false;
  return window.location.pathname.startsWith(segment);
}

// ---------------------------------------------------------------------------
// getSocket — lazily creates and returns the singleton Socket.IO connection.
// Returns null when the user is not authenticated.
// ---------------------------------------------------------------------------

export function getSocket(): Socket | null {
  // Avoid SSR issues — only run in browser
  if (typeof window === "undefined") return null;

  const { accessToken, user } = useAuthStore.getState();
  if (!accessToken || !user) return null;

  // Already connected — return existing instance
  if (socket?.connected) return socket;

  // Instance exists but is disconnected — refresh its token and reconnect
  if (socket) {
    socket.auth = { token: accessToken };
    socket.connect();
    return socket;
  }

  // Create a fresh connection
  socket = io(BACKEND_URL, {
    auth: { token: accessToken },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  attachGlobalHandlers(socket);

  socket.on("connect", () => {
    console.log("Socket connected:", socket?.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", reason);
  });

  socket.on("connect_error", (err) => {
    console.error("Socket connection error:", err.message);
  });

  return socket;
}

// ---------------------------------------------------------------------------
// disconnectSocket — cleanly disconnect (e.g. on logout)
// ---------------------------------------------------------------------------

export function disconnectSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

// ---------------------------------------------------------------------------
// Global event handlers — keep the bell badge, inbox and toasts live app-wide.
// Role-dependent behavior is captured from the auth store when a socket is
// first created (a role change requires a fresh login anyway).
// ---------------------------------------------------------------------------

function attachGlobalHandlers(sock: Socket) {
  const { user } = useAuthStore.getState();
  const isAdmin = user?.role === "ADMIN";

  // --- Incoming notifications (customers) ----------------------------------
  sock.on("notification:new", (data: any) => {
    const notification: AppNotification = {
      id: data.notificationId,
      userId: data.userId || "",
      type: data.type,
      title: data.title,
      message: data.message,
      data: data.data ?? null,
      read: !!data.read,
      createdAt: data.createdAt,
    };
    useNotificationStore.getState().prepend(notification);

    // Toast — silence chat toasts while the user is already in the chat UI
    if (data.type === "CHAT_MESSAGE" && isOnPath("/account/chat")) return;
    const toastStore = useToastStore.getState();
    const link =
      data.type === "ORDER_STATUS" && data.data?.orderNumber
        ? { href: `/account/orders/${data.data.orderNumber}`, label: "View order" }
        : data.type === "CHAT_MESSAGE"
        ? { href: "/account/chat", label: "Open chat" }
        : data.data?.reviewId
        ? { href: "/account/reviews", label: "View reviews" }
        : undefined;
    toastStore.push({ title: data.title, message: data.message, link });
  });

  // --- Order status updates (customer order pages listen themselves) -------
  sock.on("order:status-updated", (data: any) => {
    if (isAdmin) return;
    useToastStore.getState().push({
      title: data.orderNumber
        ? `Order ${data.orderNumber} — ${data.status}`
        : "Order status updated",
      message: `Your order is now ${data.status}.`,
      link: data.orderNumber
        ? { href: `/account/orders/${data.orderNumber}`, label: "View order" }
        : undefined,
    });
  });

  // --- Chat -----------------------------------------------------------------
  sock.on("chat:message-received", (data: any) => {
    if (!isAdmin && !isOnPath("/account/chat")) {
      useToastStore.getState().push({
        title: "New support message",
        message: data.message,
        link: { href: "/account/chat", label: "Open chat" },
      });
    }
  });

  // --- Admin-only events -----------------------------------------------------
  if (isAdmin) {
    sock.on("order:created", (data: any) => {
      if (isOnPath("/admin/orders")) return; // the orders table already handles it
      useToastStore.getState().push({
        title: "New order placed",
        message: `${data.orderNumber} — Rs. ${Number(data.total || 0).toLocaleString()}`,
        link: { href: "/admin/orders", label: "View orders" },
      });
    });

    sock.on("chat:session-opened", (data: any) => {
      useToastStore.getState().push({
        title: "New chat session",
        message: `${data.customerName}: ${data.subject}`,
        link: { href: "/admin/chat", label: "Open chat" },
      });
    });
  }
}

// ---------------------------------------------------------------------------
// Chat room membership helpers (used by the chat UIs)
// ---------------------------------------------------------------------------

export function joinChatRoom(sessionId: string): void {
  const sock = getSocket();
  if (!sock) return;
  sock.emit("chat:join", sessionId);
}

export function leaveChatRoom(sessionId: string): void {
  const sock = getSocket();
  if (!sock) return;
  sock.emit("chat:leave", sessionId);
}

// ---------------------------------------------------------------------------
// Small authenticated fetch helpers shared by the account pages
// ---------------------------------------------------------------------------

export async function authedFetch<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const { accessToken } = useAuthStore.getState();
  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
      useAuthStore.getState().clearAuth();
    }
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return res.json();
}

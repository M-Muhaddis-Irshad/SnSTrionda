"use client";

// =============================================================================
// RealtimeClient — mounted once in the root layout.
//   • Connects/disconnects the singleton socket as auth state changes
//   • Seeds the notification store on connect (badge count + recent items)
//   • Renders the global toast host
// =============================================================================

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useNotificationStore } from "@/stores/notificationStore";
import { getSocket, disconnectSocket, authedFetch } from "@/lib/socket";
import { ensureValidAccessToken } from "@/lib/auth";
import { useToastStore } from "@/stores/toastStore";
import Link from "next/link";

export default function RealtimeClient() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const seededRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let sock: ReturnType<typeof getSocket> = null;
    let seedNotifications: (() => void) | null = null;

    (async () => {
      // Never connect with an expired/stale access token. If the persisted
      // token is about to expire, refresh it (silently) BEFORE connecting —
      // otherwise the server rejects the handshake on a hard page refresh.
      const valid = await ensureValidAccessToken();
      if (cancelled) return;

      const { accessToken: token, user: currentUser } = useAuthStore.getState();
      const uid = currentUser?.id;

      if (!valid || !token || !uid) {
        disconnectSocket();
        useNotificationStore.getState().reset();
        seededRef.current = null;
        return;
      }

      sock = getSocket();
      if (!sock) return;

      seedNotifications = async () => {
        if (seededRef.current === uid) return; // once per login session
        try {
          const res = await authedFetch<{ data: any[]; unreadCount: number }>(
            "/api/notifications?page=1&limit=20"
          );
          useNotificationStore.getState().hydrate(
            res.data.map((n: any) => ({
              id: n.id,
              userId: n.userId,
              type: n.type,
              title: n.title,
              message: n.message,
              data: n.data ?? null,
              read: n.read,
              createdAt: n.createdAt,
            })),
            res.unreadCount || 0
          );
          seededRef.current = uid;
        } catch {
          // Backend unreachable — retry on the next socket event
        }
      };

      if (sock.connected) {
        seedNotifications();
      }
      sock.on("connect", seedNotifications);
    })();

    return () => {
      cancelled = true;
      if (sock && seedNotifications) {
        sock.off("connect", seedNotifications);
      }
    };
  }, [accessToken, user?.id]);

  return <ToastHost />;
}

// ---------------------------------------------------------------------------
// ToastHost — transient toast stack for realtime events
// ---------------------------------------------------------------------------

function ToastHost() {
  const toasts = useToastStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-[min(92vw,420px)] pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto bg-neutral-900/95 border border-neutral-700 text-white rounded-lg shadow-2xl px-4 py-3 animate-[fadeInUp_0.2s_ease-out]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{toast.title}</p>
              {toast.message && (
                <p className="text-xs text-neutral-300 mt-0.5 line-clamp-2">{toast.message}</p>
              )}
              {toast.link && (
                <Link
                  href={toast.link.href}
                  className="inline-block mt-1.5 text-xs font-medium text-amber-300 hover:text-amber-200"
                >
                  {toast.link.label} →
                </Link>
              )}
            </div>
            <button
              onClick={() => useToastStore.getState().dismiss(toast.id)}
              aria-label="Dismiss"
              className="shrink-0 text-neutral-500 hover:text-white transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

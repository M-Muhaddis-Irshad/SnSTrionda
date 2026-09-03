"use client";

// =============================================================================
// NotificationBell — header bell with live unread badge + recent dropdown.
// Only renders for authenticated (non-admin) users.
// =============================================================================

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useNotificationStore } from "@/stores/notificationStore";
import { getSocket, authedFetch } from "@/lib/socket";
import type { AppNotification } from "@/types/realtime";

const TYPE_DOT: Record<string, string> = {
  ORDER_STATUS: "bg-amber-500",
  REVIEW_STATUS: "bg-sky-500",
  CHAT_MESSAGE: "bg-emerald-500",
  ADMIN_UPDATE: "bg-rose-500",
};

export default function NotificationBell() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const notifications = useNotificationStore((s) => s.notifications);
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  const isAdmin = user?.role === "ADMIN";
  const visible = isAuthenticated() && !isAdmin;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  // Keep a socket open so badge updates arrive (handlers live in RealtimeClient)
  useEffect(() => {
    if (!visible) return;
    getSocket();
  }, [visible]);

  if (!visible) return null;

  function handleMarkAllRead() {
    useNotificationStore.getState().markAllRead();
    authedFetch("/api/notifications/read-all", { method: "POST" }).catch(() => {});
  }

  function handleOpenItem(n: AppNotification) {
    setOpen(false);
    useNotificationStore.getState().markOneRead(n.id);
    if (!n.read) {
      authedFetch(`/api/notifications/${n.id}/read`, { method: "PATCH" }).catch(() => {});
    }
    const href =
      n.type === "ORDER_STATUS" && n.data?.orderNumber
        ? `/account/orders/${n.data.orderNumber}`
        : n.type === "CHAT_MESSAGE"
        ? "/account/chat"
        : n.data?.reviewId
        ? "/account/reviews"
        : "/account/notifications";
    router.push(href);
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        className="header-icon-btn relative"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        onClick={() => setOpen((v) => !v)}
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[min(88vw,360px)] bg-white border border-chrome-500 shadow-2xl z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-chrome-500">
            <p className="font-body text-xs font-semibold uppercase tracking-wider text-foreground">
              Notifications
            </p>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="font-body text-xs text-chrome-200 hover:text-foreground transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="font-body text-sm text-muted text-center py-10 px-4">
                No notifications yet.
              </p>
            ) : (
              notifications.slice(0, 8).map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleOpenItem(n)}
                  className="w-full text-left px-4 py-3 border-b border-chrome-500 last:border-b-0 hover:bg-background transition-colors"
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${TYPE_DOT[n.type] || "bg-neutral-400"} ${
                        n.read ? "opacity-25" : ""
                      }`}
                    />
                    <div className="min-w-0">
                      <p className={`font-body text-sm ${n.read ? "text-muted" : "text-foreground font-medium"}`}>
                        {n.title}
                      </p>
                      <p className="font-body text-xs text-muted mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="font-body text-[11px] text-muted mt-1 opacity-70">
                        {new Date(n.createdAt).toLocaleString("en-PK", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-chrome-500">
            <Link
              href="/account/notifications"
              onClick={() => setOpen(false)}
              className="block text-center font-body text-xs font-medium text-chrome-200 hover:text-foreground py-3 transition-colors"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

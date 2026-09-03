"use client";

// =============================================================================
// Notifications — customer inbox (real-time via Socket.IO + REST pagination)
// =============================================================================

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { authedFetch, getSocket } from "@/lib/socket";
import { useNotificationStore } from "@/stores/notificationStore";
import type { AppNotification } from "@/types/realtime";

type Filter = "ALL" | "UNREAD" | "ORDER_STATUS" | "REVIEW_STATUS" | "CHAT_MESSAGE";

const TYPE_LABEL: Record<string, string> = {
  ORDER_STATUS: "Order",
  REVIEW_STATUS: "Review",
  CHAT_MESSAGE: "Chat",
  ADMIN_UPDATE: "Update",
};

const TYPE_DOT: Record<string, string> = {
  ORDER_STATUS: "bg-amber-500",
  REVIEW_STATUS: "bg-sky-500",
  CHAT_MESSAGE: "bg-emerald-500",
  ADMIN_UPDATE: "bg-rose-500",
};

const PAGE_SIZE = 10;

export default function AccountNotificationsPage() {
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const storeItems = useNotificationStore((s) => s.notifications);
  const storeUnread = useNotificationStore((s) => s.unreadCount);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [loading, setLoading] = useState(true);

  const loadPage = useCallback(
    async (pageNum: number, currentFilter: Filter, append: boolean) => {
      setLoading(true);
      try {
        const type =
          currentFilter === "ORDER_STATUS" || currentFilter === "REVIEW_STATUS" || currentFilter === "CHAT_MESSAGE"
            ? currentFilter
            : undefined;
        const unread = currentFilter === "UNREAD" ? true : undefined;
        const query = new URLSearchParams({
          page: String(pageNum),
          limit: String(PAGE_SIZE),
        });
        if (type) query.set("type", type);
        if (unread) query.set("unread", "true");

        const res = await authedFetch<{ data: any[]; unreadCount: number; pagination: { total: number } }>(
          `/api/notifications?${query.toString()}`
        );
        const mapped: AppNotification[] = (res.data || []).map((n) => ({
          id: n.id,
          userId: n.userId,
          type: n.type,
          title: n.title,
          message: n.message,
          data: n.data ?? null,
          read: n.read,
          createdAt: n.createdAt,
        }));

        setItems((prev) => (append ? [...prev, ...mapped] : mapped));
        setTotal(res.pagination?.total || 0);
        setPage(pageNum);

        // Keep the bell store in sync when browsing unfiltered
        if (currentFilter === "ALL" && pageNum === 1) {
          useNotificationStore.getState().hydrate(mapped, res.unreadCount || 0);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadPage(1, filter, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, accessToken]);

  // Live: new notifications append on top of the current filter view
  useEffect(() => {
    const sock = getSocket();
    if (!sock) return;

    const onNew = (data: any) => {
      const fits =
        filter === "ALL" ||
        (filter === "UNREAD" && !data.read) ||
        data.type === filter;
      if (!fits) return;
      const n: AppNotification = {
        id: data.notificationId,
        userId: data.userId || "",
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data ?? null,
        read: !!data.read,
        createdAt: data.createdAt,
      };
      setItems((prev) => [n, ...prev].filter((x, i, arr) => arr.findIndex((y) => y.id === x.id) === i));
      setTotal((t) => t + 1);
    };

    sock.on("notification:new", onNew);
    return () => {
      sock.off("notification:new", onNew);
    };
  }, [filter]);

  // The global store (seeded by RealtimeClient) may hold newer items than the
  // currently loaded page — show store-first, de-duplicated.
  const visible = [
    ...storeItems.filter((n) => !items.some((i) => i.id === n.id)),
    ...items,
  ];


  async function markRead(n: AppNotification) {
    if (n.read) return;
    useNotificationStore.getState().markOneRead(n.id);
    setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    try {
      await authedFetch(`/api/notifications/${n.id}/read`, { method: "PATCH" });
    } catch {
      // ignore
    }
  }

  async function markAllRead() {
    useNotificationStore.getState().markAllRead();
    setItems((prev) => prev.map((x) => ({ ...x, read: true })));
    try {
      await authedFetch("/api/notifications/read-all", { method: "POST" });
    } catch {
      // ignore
    }
  }

  async function remove(n: AppNotification) {
    useNotificationStore.getState().remove(n.id);
    setItems((prev) => prev.filter((x) => x.id !== n.id));
    try {
      await authedFetch(`/api/notifications/${n.id}`, { method: "DELETE" });
    } catch {
      // ignore
    }
  }

  function openItem(n: AppNotification) {
    markRead(n);
    const href =
      n.type === "ORDER_STATUS" && n.data?.orderNumber
        ? `/account/orders/${n.data.orderNumber}`
        : n.type === "CHAT_MESSAGE"
        ? "/account/chat"
        : n.data?.reviewId
        ? "/account/reviews"
        : null;
    if (href) router.push(href);
  }

  const filters: { key: Filter; label: string }[] = [
    { key: "ALL", label: `All (${total})` },
    { key: "UNREAD", label: `Unread (${storeUnread})` },
    { key: "ORDER_STATUS", label: "Orders" },
    { key: "REVIEW_STATUS", label: "Reviews" },
    { key: "CHAT_MESSAGE", label: "Chat" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg text-foreground">Notifications</h2>
        {storeUnread > 0 && (
          <button
            onClick={markAllRead}
            className="font-body text-sm text-chrome-200 hover:text-foreground transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`font-body text-xs px-3 py-1.5 border transition-colors ${
              filter === f.key
                ? "border-chrome-950 bg-chrome-950 text-white"
                : "border-chrome-500 text-muted hover:text-foreground hover:border-chrome-300"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading && items.length === 0 ? (
        <div className="border border-chrome-500 bg-surface p-10 text-center">
          <p className="font-body text-sm text-muted">Loading notifications...</p>
        </div>
      ) : visible.length === 0 ? (
        <div className="border border-chrome-500 bg-surface p-10 text-center">
          <p className="font-body text-sm text-muted mb-4">No notifications match this filter.</p>
          <button
            onClick={() => setFilter("ALL")}
            className="font-body text-sm text-chrome-200 hover:text-foreground transition-colors"
          >
            Show all notifications
          </button>
        </div>
      ) : (
        <div className="border border-chrome-500 bg-surface divide-y divide-chrome-500">
          {visible.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-3 px-4 py-4 transition-colors ${
                n.read ? "opacity-70" : "bg-background/60"
              }`}
            >
              <button onClick={() => openItem(n)} className="flex items-start gap-3 flex-1 min-w-0 text-left group">
                <span className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${TYPE_DOT[n.type] || "bg-neutral-400"} ${n.read ? "opacity-25" : ""}`} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className={`font-body text-sm truncate ${n.read ? "text-muted" : "text-foreground font-medium"}`}>
                      {n.title}
                    </span>
                    <span className="shrink-0 font-body text-[10px] text-muted uppercase tracking-wide">
                      {TYPE_LABEL[n.type] || n.type}
                    </span>
                  </span>
                  <span className="block font-body text-sm text-muted mt-1">{n.message}</span>
                  <span className="block font-body text-[11px] text-muted mt-1.5 opacity-80">
                    {new Date(n.createdAt).toLocaleString("en-PK", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </span>
              </button>
              <div className="flex items-center gap-2 shrink-0">
                {!n.read && (
                  <button
                    onClick={() => markRead(n)}
                    className="font-body text-[11px] text-chrome-200 hover:text-foreground transition-colors"
                    title="Mark as read"
                  >
                    Mark read
                  </button>
                )}
                <button
                  onClick={() => remove(n)}
                  className="font-body text-[11px] text-muted hover:text-red-500 transition-colors"
                  title="Delete notification"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load more */}
      {items.length > 0 && items.length < total && (
        <div className="text-center pt-2">
          <button
            onClick={() => loadPage(page + 1, filter, true)}
            disabled={loading}
            className="font-body text-sm text-chrome-200 hover:text-foreground transition-colors disabled:opacity-40"
          >
            {loading ? "Loading..." : "Load older notifications ↓"}
          </button>
        </div>
      )}
    </div>
  );
}

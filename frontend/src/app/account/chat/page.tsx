"use client";

// =============================================================================
// Support Chat — customer view: list own sessions, open a new one, and chat
// live with the admin team via Socket.IO.
// =============================================================================

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";
import { authedFetch, getSocket } from "@/lib/socket";
import ChatConversation from "@/components/chat/ChatConversation";
import { useChatNotificationSound } from "@/hooks/useChatNotificationSound";
import type { ChatSessionSummary } from "@/types/realtime";

interface OrderPick {
  id: string;
  orderNumber: string;
  status: string;
}

const STATUS_STYLE: Record<string, string> = {
  OPEN: "border-emerald-500 text-emerald-600",
  RESOLVED: "border-sky-400 text-sky-600",
  CLOSED: "border-chrome-500 text-muted",
};

export default function AccountChatPage() {
  const { user, accessToken } = useAuthStore();
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [subject, setSubject] = useState("");
  const [orderId, setOrderId] = useState("");
  const [orders, setOrders] = useState<OrderPick[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const { playChime } = useChatNotificationSound();

  const userId = user?.id || "";
  const userName = user?.name || "You";
  const activeSession = sessions.find((s) => s.id === activeId) || null;

  const refreshSessions = useCallback(async () => {
    try {
      const res = await authedFetch<{ data: ChatSessionSummary[] }>("/api/chat/sessions");
      setSessions(res.data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  // Load sessions; default-select the first open one
  useEffect(() => {
    refreshSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, userId]);

  useEffect(() => {
    if (!activeId && sessions.length > 0) {
      const first = sessions.find((s) => s.status === "OPEN") || sessions[0];
      setActiveId(first.id);
    }
  }, [sessions, activeId]);

  // Refresh the list when a session changes (close / admin assign) or when a
  // new message arrives while this page is open.
  useEffect(() => {
    const sock = getSocket();
    if (!sock) return;

    const onActivity = (data: any) => {
      // Play chime if the message is for a session we're NOT currently viewing
      if (data.chatSessionId && data.chatSessionId !== activeId) {
        playChime();
      }
      refreshSessions();
      if (data.chatSessionId && !activeId) setActiveId(data.chatSessionId);
    };

    sock.on("chat:message-received", onActivity);
    sock.on("chat:session-closed", onActivity);
    return () => {
      sock.off("chat:message-received", onActivity);
      sock.off("chat:session-closed", onActivity);
    };
  }, [activeId, refreshSessions]);

  function openCompose() {
    setComposing(true);
    setSubject("");
    setOrderId("");
    setNotice("");
    // Fetch order history for the order dropdown
    authedFetch<{ data: OrderPick[] }>("/api/orders/mine")
      .then((res) =>
        setOrders((res.data || []).map((o: any) => ({ id: o.id, orderNumber: o.orderNumber, status: o.status })))
      )
      .catch(() => setOrders([]));
  }

  async function submitNewChat() {
    if (!subject.trim() || busy) return;
    setBusy(true);
    setNotice("");
    try {
      await authedFetch("/api/chat/sessions", {
        method: "POST",
        body: JSON.stringify({ subject: subject.trim(), orderId: orderId || undefined }),
      });
      setComposing(false);
      await refreshSessions();
      setActiveId(null); // let the auto-select pick the newest open session
      const updated = await authedFetch<{ data: ChatSessionSummary[] }>("/api/chat/sessions");
      const newest = (updated.data || [])[0];
      if (newest) setActiveId(newest.id);
    } catch (err: any) {
      setNotice(err.message || "Could not open the chat.");
    } finally {
      setBusy(false);
    }
  }

  function formatWhen(dateStr: string) {
    return new Date(dateStr).toLocaleString("en-PK", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg text-foreground">Support Chat</h2>
        <button
          onClick={openCompose}
          className="font-body text-sm font-medium bg-chrome-950 text-white hover:bg-chrome-900 transition-colors px-4 py-2"
        >
          + New Chat
        </button>
      </div>

      {/* Compose panel */}
      {composing && (
        <div className="border border-chrome-500 bg-surface p-5">
          <p className="font-display text-base text-foreground mb-4">Start a new conversation</p>
          <div className="space-y-4">
            <div>
              <label className="block font-body text-xs uppercase tracking-wider text-muted mb-1.5">
                Subject
              </label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Question about my order, sizing help..."
                className="w-full font-body text-sm bg-background border border-chrome-500 px-3 py-2.5 text-foreground placeholder:text-muted focus:outline-none focus:border-chrome-300"
              />
            </div>
            <div>
              <label className="block font-body text-xs uppercase tracking-wider text-muted mb-1.5">
                Related order (optional)
              </label>
              <select
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="w-full font-body text-sm bg-background border border-chrome-500 px-3 py-2.5 text-foreground focus:outline-none focus:border-chrome-300"
              >
                <option value="">No specific order</option>
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.orderNumber} ({o.status})
                  </option>
                ))}
              </select>
            </div>
            {notice && <p className="font-body text-xs text-red-500">{notice}</p>}
            <div className="flex gap-2">
              <button
                onClick={submitNewChat}
                disabled={!subject.trim() || busy}
                className="font-body text-sm font-medium bg-chrome-950 text-white hover:bg-chrome-900 transition-colors px-5 py-2 disabled:opacity-40"
              >
                {busy ? "Opening..." : "Open Chat"}
              </button>
              <button
                onClick={() => setComposing(false)}
                className="font-body text-sm text-muted hover:text-foreground transition-colors px-4 py-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sessions + conversation */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Session list */}
        <div className="lg:w-72 shrink-0 border border-chrome-500 bg-surface max-h-[70vh] overflow-y-auto">
          {loading ? (
            <p className="font-body text-sm text-muted text-center py-10">Loading chats...</p>
          ) : sessions.length === 0 ? (
            <div className="p-6 text-center">
              <p className="font-body text-sm text-muted mb-3">
                No conversations yet. Need help with an order or product?
              </p>
              <button
                onClick={openCompose}
                className="font-body text-sm font-medium text-chrome-200 hover:text-foreground transition-colors"
              >
                Start a chat →
              </button>
            </div>
          ) : (
            sessions.map((s) => {
              const isActive = s.id === activeId;
              const lastMsg = s.messages?.[0];
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveId(s.id)}
                  className={`w-full text-left px-4 py-3.5 border-b border-chrome-500 last:border-b-0 transition-colors ${
                    isActive ? "bg-chrome-950" : "hover:bg-background"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={`font-body text-sm font-medium truncate ${
                        isActive ? "text-white" : "text-foreground"
                      }`}
                    >
                      {s.subject}
                    </p>
                    <span
                      className={`shrink-0 font-body text-[10px] uppercase tracking-wide px-1.5 py-0.5 border ${
                        isActive ? "border-white/30 text-white/80" : STATUS_STYLE[s.status] || STATUS_STYLE.CLOSED
                      }`}
                    >
                      {s.status === "OPEN" ? "Open" : s.status === "RESOLVED" ? "Resolved" : "Closed"}
                    </span>
                  </div>
                  <p
                    className={`font-body text-xs mt-1 truncate ${
                      isActive ? "text-white/70" : "text-muted"
                    }`}
                  >
                    {lastMsg
                      ? lastMsg.message
                      : s.order
                      ? `Regarding ${s.order.orderNumber}`
                      : "No messages yet"}
                  </p>
                  <p
                    className={`font-body text-[10px] mt-1 ${
                      isActive ? "text-white/50" : "text-muted/70"
                    }`}
                  >
                    {s.updatedAt ? formatWhen(s.updatedAt) : formatWhen(s.createdAt)}
                  </p>
                </button>
              );
            })
          )}
        </div>

        {/* Conversation */}
        <ChatConversation
          session={activeSession}
          currentUserId={userId}
          currentName={userName}
          onSessionChanged={refreshSessions}
          dark={false}
        />
      </div>

      <p className="font-body text-xs text-muted">
        Tip: your replies arrive in real time. You can also email us any time at{" "}
        <Link href="mailto:support@trionda.com" className="text-chrome-200 hover:text-foreground">
          support@trionda.com
        </Link>
        .
      </p>
    </div>
  );
}

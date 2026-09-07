"use client";

// =============================================================================
// ChatConversation — shared live conversation panel (customer + admin).
// Joins the chat:<sessionId> socket room, streams chat:message-received,
// sends messages, marks incoming as read, and can close/resolve the session.
// =============================================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { getSocket, authedFetch, joinChatRoom, leaveChatRoom } from "@/lib/socket";
import type { ChatMessage, ChatSessionSummary } from "@/types/realtime";

interface ChatConversationProps {
  session: ChatSessionSummary | null;
  currentUserId: string;
  currentName: string;
  isAdmin?: boolean;
  onSessionChanged?: () => void; // refresh session lists after close/assign
  dark?: boolean;
}

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Open",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

export default function ChatConversation({
  session,
  currentUserId,
  currentName,
  isAdmin = false,
  onSessionChanged,
  dark = false,
}: ChatConversationProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(session?.status || "CLOSED");
  const scrollRef = useRef<HTMLDivElement>(null);

  const sessionId = session?.id || null;

  // Styles per theme
  const theme = {
    panel: dark
      ? "bg-gray-900 border-gray-800"
      : "bg-surface border-chrome-500",
    header: dark ? "border-gray-800" : "border-chrome-500",
    // Sent bubble: light theme uses a light bubble with DARK text (chrome-200 is
    // light gray; foreground is near-white, which made text invisible before).
    mine: dark ? "bg-gray-700 text-white" : "bg-chrome-200 text-background",
    theirs: dark ? "bg-gray-800 text-gray-200 border border-gray-700" : "bg-background text-foreground border border-chrome-500",
    meta: dark ? "text-gray-500" : "text-muted",
    input: dark
      ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500"
      : "bg-background border-chrome-500 text-foreground placeholder:text-muted",
    button: dark
      ? "bg-white text-black hover:bg-gray-200 disabled:opacity-40"
      : "bg-chrome-950 text-white hover:bg-chrome-900 disabled:opacity-40",
    chip: dark ? "bg-gray-800 text-gray-300" : "bg-background border border-chrome-500 text-muted",
    empty: dark ? "text-gray-500" : "text-muted",
  };

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    });
  }, []);

  // Load conversation + join the socket room when the session changes
  useEffect(() => {
    setMessages([]);
    setStatus(session?.status || "CLOSED");

    if (!sessionId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    authedFetch<{ data: ChatSessionSummary }>(`/api/chat/sessions/${sessionId}`)
      .then((res) => {
        if (cancelled) return;
        setMessages(res.data.messages || []);
        setStatus(res.data.status || "OPEN");
        // Mark whatever arrived as read on open
        authedFetch(`/api/chat/sessions/${sessionId}/read`, { method: "PATCH" }).catch(() => {});
        joinChatRoom(sessionId);
        scrollToBottom();
      })
      .catch(() => {
        if (!cancelled) setMessages([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      leaveChatRoom(sessionId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Live incoming messages for this session
  useEffect(() => {
    const sock = getSocket();
    if (!sock || !sessionId) return;

    const onMessage = (data: any) => {
      if (data.chatSessionId !== sessionId) return;
      const msg: ChatMessage = {
        id: data.messageId,
        chatSessionId: data.chatSessionId,
        senderId: data.senderId,
        message: data.message,
        read: false,
        createdAt: data.createdAt,
      };
      // The sender ALSO receives the socket echo of their own message (they are
      // in the room), and handleSend() already appended the POST response —
      // dedupe by id so nothing renders twice.
      setMessages((prev) =>
        prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
      );
      // Auto-mark incoming messages as read when the panel is open
      if (data.senderId !== currentUserId) {
        authedFetch(`/api/chat/sessions/${sessionId}/read`, { method: "PATCH" }).catch(() => {});
      }
      scrollToBottom();
    };

    const onClosed = (data: any) => {
      if (data.chatSessionId !== sessionId) return;
      setStatus(data.status || "CLOSED");
      onSessionChanged?.();
    };

    sock.on("chat:message-received", onMessage);
    sock.on("chat:session-closed", onClosed);
    return () => {
      sock.off("chat:message-received", onMessage);
      sock.off("chat:session-closed", onClosed);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, currentUserId]);

  async function handleSend() {
    const text = input.trim();
    if (!text || !sessionId || sending) return;

    setSending(true);
    try {
      const res = await authedFetch<{ data: ChatMessage }>(`/api/chat/sessions/${sessionId}/messages`, {
        method: "POST",
        body: JSON.stringify({ message: text }),
      });
      // The socket echo of this message arrives a moment later too — add the
      // POST response now, and the socket handler's dedupe keeps it single.
      setMessages((prev) =>
        prev.some((m) => m.id === res.data.id) ? prev : [...prev, res.data]
      );
      setInput("");
      scrollToBottom();
      onSessionChanged?.(); // admin assignment may have changed
    } catch {
      // Keep the typed text so the user can retry
    } finally {
      setSending(false);
    }
  }

  async function handleClose(resolve: boolean) {
    if (!sessionId) return;
    try {
      await authedFetch(`/api/chat/sessions/${sessionId}/close`, {
        method: "PATCH",
        body: JSON.stringify({ resolve }),
      });
      setStatus(resolve ? "RESOLVED" : "CLOSED");
      onSessionChanged?.();
    } catch {
      // ignore
    }
  }

  function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleString("en-PK", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (!session) {
    return (
      <div className={`flex-1 flex items-center justify-center border ${theme.panel} ${theme.empty}`}>
        <p className="font-body text-sm">
          {isAdmin ? "Select a chat session to start replying" : "No chat selected"}
        </p>
      </div>
    );
  }

  return (
    <div className={`flex-1 flex flex-col border ${theme.panel}`}>
      {/* Conversation header */}
      <div className={`px-5 py-4 border-b ${theme.header} flex items-center justify-between gap-3`}>
        <div className="min-w-0">
          <p className={`font-display text-sm font-semibold truncate ${dark ? "text-white" : "text-foreground"}`}>
            {session.subject}
          </p>
          <p className={`font-body text-xs mt-0.5 truncate ${theme.meta}`}>
            {isAdmin
              ? `${session.customer?.name || session.customer?.email || "Customer"}${
                  session.order ? ` · Order ${session.order.orderNumber}` : ""
                }`
              : session.admin
              ? `Assigned to ${session.admin.name || "Support team"}`
              : "Waiting for a support agent"}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`font-body text-[11px] px-2 py-1 rounded-full ${theme.chip}`}>
            {STATUS_LABEL[status] || status}
          </span>
          {status === "OPEN" && (
            <>
              <button
                onClick={() => handleClose(true)}
                className={`font-body text-xs px-2.5 py-1.5 rounded transition-colors ${theme.chip} hover:opacity-80`}
                title="Mark as resolved"
              >
                Resolve
              </button>
              <button
                onClick={() => handleClose(false)}
                className={`font-body text-xs px-2.5 py-1.5 rounded transition-colors ${theme.chip} hover:opacity-80`}
                title="Close session"
              >
                Close
              </button>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 min-h-[280px] max-h-[55vh]">
        {loading ? (
          <p className={`font-body text-xs text-center pt-10 ${theme.meta}`}>Loading conversation...</p>
        ) : messages.length === 0 ? (
          <p className={`font-body text-xs text-center pt-10 ${theme.meta}`}>
            No messages yet — say hello!
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === currentUserId;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[78%] px-4 py-2.5 rounded-lg ${mine ? theme.mine : theme.theirs}`}>
                  <p className={`font-body text-xs mb-0.5 ${mine ? "opacity-70" : theme.meta}`}>
                    {mine ? "You" : m.sender?.name || currentName}
                  </p>
                  <p className="font-body text-sm whitespace-pre-wrap break-words">{m.message}</p>
                  <p className={`font-body text-[10px] mt-1 ${mine ? "opacity-60" : theme.meta}`}>
                    {formatTime(m.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      {status === "OPEN" ? (
        <div className={`px-4 py-3 border-t ${theme.header} flex items-end gap-2`}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            rows={1}
            placeholder="Type a message... (Enter to send)"
            className={`flex-1 resize-none font-body text-sm px-3 py-2.5 rounded border focus:outline-none focus:border-chrome-400 ${theme.input}`}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className={`shrink-0 font-body text-sm font-medium px-5 py-2.5 rounded transition-colors ${theme.button}`}
          >
            {sending ? "..." : "Send"}
          </button>
        </div>
      ) : (
        <div className={`px-4 py-3 border-t ${theme.header}`}>
          <p className={`font-body text-xs ${theme.meta}`}>
            This session is {STATUS_LABEL[status] || status.toLowerCase()}.
            {!isAdmin && " Open a new chat if you need more help."}
          </p>
        </div>
      )}
    </div>
  );
}

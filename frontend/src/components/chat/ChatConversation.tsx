"use client";

// =============================================================================
// ChatConversation — shared live conversation panel (customer + admin).
// Joins the chat:<sessionId> socket room, streams chat:message-received,
// sends messages, marks incoming as read, and can close/resolve the session.
// Supports: image attachments, emoji picker, image rendering in bubbles.
// =============================================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { getSocket, authedFetch, joinChatRoom, leaveChatRoom } from "@/lib/socket";
import type { ChatMessage, ChatSessionSummary } from "@/types/realtime";

interface ChatConversationProps {
  session: ChatSessionSummary | null;
  currentUserId: string;
  currentName: string;
  isAdmin?: boolean;
  onSessionChanged?: () => void;
  dark?: boolean;
}

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Open",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

const EMOJI_CATEGORIES = [
  { label: "Smileys", emojis: ["😊", "😂", "🥰", "😍", "🤩", "😎", "🤔", "😅", "🙏", "👍", "👋", "❤️", "🔥", "✨", "💯", "🎉", "😍", "😘", "🥳", "😇"] },
  { label: "Objects", emojis: ["📦", "🎁", "🛍️", "💳", "🏷️", "✅", "❌", "⏳", "🚚", "📞", "✉️", "📸", "🏷️", "💰", "🪡", "🧵", "👔", "👗", "🧣", "👟"] },
];

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [previewImage, setPreviewImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [imageLightbox, setImageLightbox] = useState<string | null>(null);

  const sessionId = session?.id || null;

  const theme = {
    panel: dark
      ? "bg-gray-900 border-gray-800"
      : "bg-surface border-chrome-500",
    header: dark ? "border-gray-800" : "border-chrome-500",
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
    emojiPanel: dark ? "bg-gray-800 border-gray-700" : "bg-background border border-chrome-500 shadow-lg",
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
    if (!sessionId) { setLoading(false); return; }

    let cancelled = false;
    setLoading(true);

    authedFetch<{ data: ChatSessionSummary }>(`/api/chat/sessions/${sessionId}`)
      .then((res) => {
        if (cancelled) return;
        setMessages(res.data.messages || []);
        setStatus(res.data.status || "OPEN");
        authedFetch(`/api/chat/sessions/${sessionId}/read`, { method: "PATCH" }).catch(() => {});
        joinChatRoom(sessionId);
        scrollToBottom();
      })
      .catch(() => { if (!cancelled) setMessages([]); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; leaveChatRoom(sessionId); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Live incoming messages
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
        imageUrl: data.imageUrl,
        read: false,
        createdAt: data.createdAt,
      };
      setMessages((prev) => prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]);
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

  // Handle file selection
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be under 5MB.");
      return;
    }
    setPreviewImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setShowEmoji(false);
  }

  function removePreview() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewImage(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // Insert emoji at cursor position
  function insertEmoji(emoji: string) {
    const ta = textareaRef.current;
    if (ta) {
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newValue = input.slice(0, start) + emoji + input.slice(end);
      setInput(newValue);
      setTimeout(() => {
        ta.selectionStart = ta.selectionEnd = start + emoji.length;
        ta.focus();
      }, 0);
    } else {
      setInput((prev) => prev + emoji);
    }
  }

  // Send message (text + optional image)
  async function handleSend() {
    const text = input.trim();
    if ((!text && !previewImage) || !sessionId || sending) return;

    setSending(true);
    try {
      let res;
      if (previewImage) {
        // Multipart upload with image
        const formData = new FormData();
        if (text) formData.append("message", text);
        formData.append("image", previewImage);

        const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/chat/sessions/${sessionId}/messages`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });
        if (!response.ok) throw new Error("Failed to send");
        res = await response.json();
      } else {
        res = await authedFetch<{ data: ChatMessage }>(`/api/chat/sessions/${sessionId}/messages`, {
          method: "POST",
          body: JSON.stringify({ message: text }),
        });
      }

      const msgData = res.data;
      setMessages((prev) => prev.some((m) => m.id === msgData.id) ? prev : [...prev, msgData]);
      setInput("");
      removePreview();
      scrollToBottom();
      onSessionChanged?.();
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
    } catch { /* ignore */ }
  }

  function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleString("en-PK", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
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
      {/* Header */}
      <div className={`px-5 py-4 border-b ${theme.header} flex items-center justify-between gap-3`}>
        <div className="min-w-0">
          <p className={`font-display text-sm font-semibold truncate ${dark ? "text-white" : "text-foreground"}`}>
            {session.subject}
          </p>
          <p className={`font-body text-xs mt-0.5 truncate ${theme.meta}`}>
            {isAdmin
              ? `${session.customer?.name || session.customer?.email || "Customer"}${session.order ? ` · Order ${session.order.orderNumber}` : ""}`
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
              <button onClick={() => handleClose(true)} className={`font-body text-xs px-2.5 py-1.5 rounded transition-colors ${theme.chip} hover:opacity-80`} title="Mark as resolved">Resolve</button>
              <button onClick={() => handleClose(false)} className={`font-body text-xs px-2.5 py-1.5 rounded transition-colors ${theme.chip} hover:opacity-80`} title="Close session">Close</button>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 min-h-[280px] max-h-[55vh]">
        {loading ? (
          <p className={`font-body text-xs text-center pt-10 ${theme.meta}`}>Loading conversation...</p>
        ) : messages.length === 0 ? (
          <p className={`font-body text-xs text-center pt-10 ${theme.meta}`}>No messages yet — say hello!</p>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === currentUserId;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[78%] px-4 py-2.5 rounded-lg ${mine ? theme.mine : theme.theirs}`}>
                  <p className={`font-body text-xs mb-0.5 ${mine ? "opacity-70" : theme.meta}`}>
                    {mine ? "You" : m.sender?.name || currentName}
                  </p>
                  {/* Image attachment */}
                  {(m as any).imageUrl && (
                    <div className="mb-2">
                      <img
                        src={(m as any).imageUrl}
                        alt="Attached image"
                        className="max-w-full max-h-48 rounded cursor-pointer object-cover border border-chrome-300"
                        onClick={() => setImageLightbox((m as any).imageUrl)}
                      />
                    </div>
                  )}
                  {m.message && (
                    <p className="font-body text-sm whitespace-pre-wrap break-words">{m.message}</p>
                  )}
                  <p className={`font-body text-[10px] mt-1 ${mine ? "opacity-60" : theme.meta}`}>
                    {formatTime(m.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Image lightbox */}
      {imageLightbox && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4" onClick={() => setImageLightbox(null)}>
          <img src={imageLightbox} alt="Full size" className="max-w-full max-h-full rounded shadow-2xl object-contain" />
          <button className="absolute top-4 right-4 text-white text-2xl font-bold hover:text-gray-300" onClick={() => setImageLightbox(null)}>✕</button>
        </div>
      )}

      {/* Emoji picker */}
      {showEmoji && (
        <div className={`mx-4 mb-2 p-3 rounded-lg border max-h-48 overflow-y-auto ${theme.emojiPanel}`}>
          {EMOJI_CATEGORIES.map((cat) => (
            <div key={cat.label} className="mb-2">
              <p className={`font-body text-[10px] mb-1 ${theme.meta}`}>{cat.label}</p>
              <div className="flex flex-wrap gap-1">
                {cat.emojis.map((emoji) => (
                  <button key={emoji} onClick={() => insertEmoji(emoji)} className="text-lg hover:scale-125 transition-transform p-0.5">{emoji}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image preview */}
      {previewUrl && (
        <div className="mx-4 mb-2 relative inline-block w-fit">
          <img src={previewUrl} alt="Preview" className="h-20 rounded border border-chrome-400 object-cover" />
          <button onClick={removePreview} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold hover:bg-red-600">✕</button>
        </div>
      )}

      {/* Input */}
      {status === "OPEN" ? (
        <div className={`px-4 py-3 border-t ${theme.header} flex items-end gap-2`}>
          {/* Image picker */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`shrink-0 p-2.5 rounded transition-colors ${theme.chip} hover:opacity-80`}
            title="Attach image"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />

          {/* Emoji picker toggle */}
          <button
            onClick={() => { setShowEmoji(!showEmoji); }}
            className={`shrink-0 p-2.5 rounded transition-colors ${showEmoji ? (dark ? "bg-gray-700" : "bg-chrome-300") : theme.chip} hover:opacity-80`}
            title="Emoji"
          >
            <span className="text-lg">😊</span>
          </button>

          <textarea
            ref={textareaRef}
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
            disabled={(!input.trim() && !previewImage) || sending}
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

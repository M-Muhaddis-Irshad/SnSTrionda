'use client';

// =============================================================================
// Admin Chat — live support console. Sessions stream in via Socket.IO
// (chat:session-opened, chat:customer-message) and replies are delivered in
// real time to the customer.
// =============================================================================

import { useCallback, useEffect, useState } from 'react';
import { MessageSquare, Search } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { authedFetch, getSocket } from '@/lib/socket';
import ChatConversation from '@/components/chat/ChatConversation';
import type { ChatSessionSummary } from '@/types/realtime';

type Tab = 'OPEN' | 'RESOLVED' | 'CLOSED' | 'ALL';

const TAB_STYLE: Record<Tab, string> = {
  OPEN: 'border-emerald-500/50 text-emerald-400',
  RESOLVED: 'border-sky-500/50 text-sky-400',
  CLOSED: 'border-gray-700 text-gray-400',
  ALL: 'border-white/40 text-white',
};

function formatWhen(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-PK', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminChatPage() {
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('OPEN');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [unreadIds, setUnreadIds] = useState<Set<string>>(new Set());

  const activeSession = sessions.find((s) => s.id === activeId) || null;

  const refresh = useCallback(async () => {
    try {
      const res = await authedFetch<{ data: ChatSessionSummary[] }>(
        `/api/chat/sessions/active?status=${tab}`
      );
      setSessions(res.data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    setLoading(true);
    setActiveId(null);
    refresh();
  }, [refresh, tab]);

  // Real-time: new sessions and customer messages appear without a refresh
  useEffect(() => {
    const sock = getSocket();
    if (!sock) return;

    const onNewSession = () => {
      refresh();
      if (tab === 'OPEN') {
        // nothing to mark — list refresh shows it
      }
    };

    const onCustomerMessage = (data: any) => {
      // If the conversation is open, the conversation panel auto-reads.
      // Otherwise mark the session as having an unread message for a badge.
      if (data.chatSessionId && data.chatSessionId !== activeId) {
        setUnreadIds((prev) => new Set(prev).add(data.chatSessionId));
      }
      refresh();
    };

    const onClosed = () => refresh();

    sock.on('chat:session-opened', onNewSession);
    sock.on('chat:customer-message', onCustomerMessage);
    sock.on('chat:session-closed', onClosed);
    return () => {
      sock.off('chat:session-opened', onNewSession);
      sock.off('chat:customer-message', onCustomerMessage);
      sock.off('chat:session-closed', onClosed);
    };
  }, [refresh, activeId, tab]);

  function selectSession(id: string) {
    setActiveId(id);
    setUnreadIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  const filtered = search.trim()
    ? sessions.filter((s) => {
        const hay = [
          s.subject,
          s.customer?.name || '',
          s.customer?.email || '',
          s.order?.orderNumber || '',
        ]
          .join(' ')
          .toLowerCase();
        return hay.includes(search.trim().toLowerCase());
      })
    : sessions;

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-140px)] min-h-[520px]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-white text-xl font-semibold">Live Chat</h2>
          <p className="text-gray-500 text-sm mt-1">
            {sessions.length} session{sessions.length === 1 ? '' : 's'} · {sessions.filter((s) => s.status === 'OPEN').length} open
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1.5">
          {(['OPEN', 'RESOLVED', 'CLOSED', 'ALL'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`text-xs px-3 py-1.5 rounded border transition-colors ${
                tab === t ? TAB_STYLE[t] : 'border-gray-800 text-gray-500 hover:text-gray-300'
              }`}
            >
              {t.charAt(0) + t.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
        {/* Session list */}
        <div className="lg:w-80 shrink-0 bg-gray-900 border border-gray-800 rounded-lg flex flex-col min-h-0">
          <div className="p-3 border-b border-gray-800">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search sessions..."
                className="w-full bg-gray-800 border border-gray-700 text-white text-sm pl-9 pr-3 py-2 rounded focus:outline-none focus:border-gray-500 placeholder-gray-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            {loading ? (
              <p className="text-gray-500 text-sm text-center py-12">Loading sessions...</p>
            ) : filtered.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-12">
                {tab === 'OPEN' ? 'No open chat sessions. New customer chats will appear here in real time.' : 'No sessions in this view.'}
              </p>
            ) : (
              filtered.map((s) => {
                const isActive = s.id === activeId;
                const hasUnread = unreadIds.has(s.id);
                const lastMsg = s.messages?.[0];
                return (
                  <button
                    key={s.id}
                    onClick={() => selectSession(s.id)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-800 last:border-b-0 transition-colors ${
                      isActive ? 'bg-gray-700/60' : 'hover:bg-gray-800/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-medium truncate ${isActive ? 'text-white' : 'text-gray-200'}`}>
                        {s.customer?.name || s.customer?.email || 'Customer'}
                        {hasUnread && <span className="ml-2 inline-block w-2 h-2 rounded-full bg-emerald-400 align-middle" />}
                      </p>
                      <span className="shrink-0 text-[10px] text-gray-500">{formatWhen(s.updatedAt || s.createdAt)}</span>
                    </div>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{s.subject}</p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {lastMsg ? lastMsg.message : s.order ? `Order ${s.order.orderNumber}` : 'No messages yet'}
                      {s.order?.orderNumber && !lastMsg && ` · ${s.order.orderNumber}`}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Conversation */}
        <ChatConversation
          session={activeSession}
          currentUserId={user?.id || ''}
          currentName={user?.name || 'Admin'}
          isAdmin
          onSessionChanged={refresh}
          dark
        />
      </div>

      {sessions.length === 0 && !loading && tab === 'OPEN' && (
        <div className="flex items-center gap-3 text-gray-500 text-sm bg-gray-900 border border-gray-800 rounded-lg px-4 py-3">
          <MessageSquare size={16} />
          Waiting for customers to start a chat — you'll be notified here instantly.
        </div>
      )}
    </div>
  );
}

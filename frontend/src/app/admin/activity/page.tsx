'use client';

// =============================================================================
// Admin Activity Log — audit feed of admin actions, live via Socket.IO.
// =============================================================================

import { useCallback, useEffect, useState } from 'react';
import { Activity as ActivityIcon, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { getSocket } from '@/lib/socket';
import { adminFetch } from '@/lib/admin-api';
import type { AdminActivityEntry } from '@/types/realtime';
import { ACTIVITY_ACTION_LABELS } from '@/types/realtime';

const PAGE_SIZE = 20;

const ENTITY_TYPES = ['Product', 'Variant', 'Order', 'Review', 'DeliveryZone', 'Chat', 'User', 'Category'];
const ACTIONS = Object.keys(ACTIVITY_ACTION_LABELS);

function formatWhen(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function actionLabel(action: string): string {
  return ACTIVITY_ACTION_LABELS[action] || action.replace(/_/g, ' ').toLowerCase();
}

export default function AdminActivityPage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [entries, setEntries] = useState<AdminActivityEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(
    async (pageNum: number, append: boolean, filters: { action: string; entity: string; from: string; to: string }) => {
      setLoading(true);
      try {
        const q = new URLSearchParams({ page: String(pageNum), limit: String(PAGE_SIZE) });
        if (filters.action) q.set('action', filters.action);
        if (filters.entity) q.set('entityType', filters.entity);
        if (filters.from) q.set('from', filters.from);
        if (filters.to) q.set('to', filters.to);

        const res = await adminFetch<{ data: any[]; pagination: { total: number } }>(`/activity?${q.toString()}`);
        const mapped: AdminActivityEntry[] = (res.data || []).map((a: any) => ({
          activityId: a.id,
          adminId: a.adminId,
          adminName: a.admin?.name || a.admin?.email || 'Admin',
          action: a.action,
          entityType: a.entityType,
          entityId: a.entityId,
          details: a.details ?? null,
          timestamp: a.createdAt,
        }));
        setEntries((prev) => (append ? [...prev, ...mapped] : mapped));
        setTotal(res.pagination?.total || 0);
        setPage(pageNum);
        setError('');
      } catch (err: any) {
        setError(err.message || 'Failed to load activity.');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    load(1, false, { action: actionFilter, entity: entityFilter, from: fromDate, to: toDate });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionFilter, entityFilter, fromDate, toDate, accessToken]);

  // Live updates
  useEffect(() => {
    const sock = getSocket();
    if (!sock) return;

    const onActivity = (entry: AdminActivityEntry) => {
      // Apply current filters locally
      if (actionFilter && entry.action !== actionFilter) return;
      if (entityFilter && entry.entityType !== entityFilter) return;
      setEntries((prev) => [entry, ...prev].filter((e, i, arr) => arr.findIndex((x) => x.activityId === e.activityId) === i));
      setTotal((t) => t + 1);
    };

    sock.on('admin:activity-logged', onActivity);
    return () => {
      sock.off('admin:activity-logged', onActivity);
    };
  }, [actionFilter, entityFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white text-xl font-semibold">Activity Log</h2>
          <p className="text-gray-500 text-sm mt-1">
            {total} action{total === 1 ? '' : 's'} — updates arrive in real time
          </p>
        </div>
        <button
          onClick={() => load(1, false, { action: actionFilter, entity: entityFilter, from: fromDate, to: toDate })}
          className="flex items-center gap-2 text-gray-400 hover:text-white text-sm border border-gray-800 px-3 py-2 rounded transition-colors"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-white text-sm px-3 py-2 rounded focus:outline-none focus:border-gray-500"
        >
          <option value="">All actions</option>
          {ACTIONS.map((a) => (
            <option key={a} value={a}>
              {actionLabel(a)}
            </option>
          ))}
        </select>
        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-white text-sm px-3 py-2 rounded focus:outline-none focus:border-gray-500"
        >
          <option value="">All entity types</option>
          {ENTITY_TYPES.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-white text-sm px-3 py-2 rounded focus:outline-none focus:border-gray-500"
          title="From date"
        />
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-white text-sm px-3 py-2 rounded focus:outline-none focus:border-gray-500"
          title="To date"
        />
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/40 text-red-400 text-sm rounded-lg p-4">{error}</div>
      )}

      {/* Feed */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg divide-y divide-gray-800">
        {loading && entries.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-16">Loading activity...</p>
        ) : entries.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-16">
            No activity recorded{actionFilter || entityFilter ? ' for these filters' : ' yet'}.
          </p>
        ) : (
          entries.map((entry) => (
            <div key={entry.activityId} className="flex items-start gap-4 px-5 py-4">
              <div className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center shrink-0">
                <ActivityIcon size={16} className="text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <p className="text-white text-sm">
                    <span className="font-semibold">{entry.adminName}</span>{' '}
                    <span className="text-gray-400">{actionLabel(entry.action)}</span>{' '}
                    <span className="text-gray-500">{entry.entityType}</span>{' '}
                    <span className="text-gray-400 font-mono text-xs">{entry.entityId}</span>
                  </p>
                  <p className="text-gray-500 text-xs">{formatWhen(entry.timestamp)}</p>
                </div>
                {entry.details && (
                  <pre className="mt-2 text-gray-500 text-xs bg-gray-950 border border-gray-800 rounded p-2 overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(entry.details, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load more */}
      {entries.length > 0 && entries.length < total && (
        <div className="text-center">
          <button
            onClick={() => load(page + 1, true, { action: actionFilter, entity: entityFilter, from: fromDate, to: toDate })}
            disabled={loading}
            className="text-gray-400 hover:text-white text-sm underline disabled:opacity-40"
          >
            {loading ? 'Loading...' : `Load older activity (${total - entries.length} remaining)`}
          </button>
        </div>
      )}
    </div>
  );
}

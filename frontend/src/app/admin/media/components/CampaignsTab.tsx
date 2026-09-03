"use client";

import { useCallback, useEffect, useState } from "react";
import Modal, { btnDangerCls, btnSecondaryCls } from "./Modal";
import CampaignModal from "./CampaignModal";
import {
  fetchAdminCampaigns,
  deleteAdminCampaign,
  bulkUpdateCampaigns,
} from "@/lib/admin-api";
import {
  campaignStatus,
  type CampaignStatus,
  type CampaignType,
  type Paginated,
} from "@/types/admin.types";

const statusColors: Record<CampaignStatus, string> = {
  Active: "bg-green-500/20 text-green-300",
  Scheduled: "bg-blue-500/20 text-blue-300",
  Expired: "bg-gray-700 text-gray-300",
  Inactive: "bg-gray-700 text-gray-400",
};

export default function CampaignsTab() {
  const [campaigns, setCampaigns] = useState<CampaignType[]>([]);
  const [pagination, setPagination] = useState<Paginated<CampaignType>["pagination"] | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [addOpen, setAddOpen] = useState(false);
  const [editCampaign, setEditCampaign] = useState<CampaignType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CampaignType | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = (await fetchAdminCampaigns({
        page,
        limit: 10,
        search: query || undefined,
      })) as Paginated<CampaignType>;
      setCampaigns(res.data);
      setPagination(res.pagination);
    } catch (err: any) {
      setError(err?.message || "Failed to load campaigns.");
    } finally {
      setLoading(false);
    }
  }, [page, query]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setQuery(search.trim());
      setSelected(new Set());
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelected((prev) => {
      if (prev.size === campaigns.length) return new Set();
      return new Set(campaigns.map((c) => c.id));
    });
  }

  async function runBulk(active: boolean) {
    if (selected.size === 0) return;
    setBusy(true);
    setActionError("");
    try {
      await bulkUpdateCampaigns(Array.from(selected), active);
      setSelected(new Set());
      load();
    } catch (err: any) {
      setActionError(err?.message || "Bulk update failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteAdminCampaign(deleteTarget.id);
      setCampaigns((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: any) {
      setActionError(err?.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  const allSelected = campaigns.length > 0 && selected.size === campaigns.length;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search campaigns…"
          className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-500"
        />
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <>
              <span className="text-xs text-gray-400">{selected.size} selected</span>
              <button
                disabled={busy}
                onClick={() => runBulk(true)}
                className="px-3 py-2 bg-green-600 text-white text-xs font-semibold rounded hover:bg-green-500 disabled:opacity-50 transition"
              >
                Activate
              </button>
              <button
                disabled={busy}
                onClick={() => runBulk(false)}
                className="px-3 py-2 border border-gray-600 text-gray-200 text-xs font-semibold rounded hover:bg-gray-800 disabled:opacity-50 transition"
              >
                Deactivate
              </button>
            </>
          )}
          <button
            onClick={() => setAddOpen(true)}
            className="px-4 py-2 bg-white text-black text-sm font-semibold rounded hover:bg-gray-200 transition"
          >
            + Add campaign
          </button>
        </div>
      </div>

      {actionError && (
        <div className="bg-red-500/10 border border-red-500/40 rounded px-4 py-2 text-xs text-red-300">
          {actionError}
        </div>
      )}

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-gray-500 border-b border-gray-800">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    aria-label="Select all campaigns"
                    className="w-4 h-4 accent-white"
                  />
                </th>
                <th className="px-4 py-3 font-medium">Campaign</th>
                <th className="px-4 py-3 font-medium">Discount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Dates</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                    Loading campaigns…
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-red-400">
                    {error}
                  </td>
                </tr>
              ) : campaigns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                    No campaigns found. Click “+ Add campaign” to create one.
                  </td>
                </tr>
              ) : (
                campaigns.map((c) => {
                  const status = campaignStatus(c);
                  return (
                    <tr
                      key={c.id}
                      className={`border-b border-gray-800/60 last:border-0 hover:bg-gray-800/30 ${
                        selected.has(c.id) ? "bg-gray-800/40" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(c.id)}
                          onChange={() => toggleSelect(c.id)}
                          aria-label={`Select ${c.title}`}
                          className="w-4 h-4 accent-white"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {c.image?.url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={c.image.url}
                              alt={c.image.alt || c.title}
                              className="h-12 w-12 object-cover rounded border border-gray-700"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded border border-dashed border-gray-600 flex items-center justify-center text-gray-500 text-[10px]">
                              No image
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-white font-medium truncate">{c.title}</p>
                            {c.description && (
                              <p className="text-xs text-gray-500 truncate max-w-[240px]">
                                {c.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-xs bg-white text-black font-semibold">
                          {c.discount}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs ${statusColors[status]}`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {new Date(c.startDate).toLocaleDateString()} →{" "}
                        {new Date(c.endDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditCampaign(c)}
                            className="text-xs text-gray-300 hover:text-white transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteTarget(c)}
                            className="text-xs text-red-400 hover:text-red-300 transition"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800 text-xs text-gray-400">
            <span>
              Page {pagination.page} of {pagination.totalPages} · {pagination.total} total
            </span>
            <div className="flex gap-2">
              <button
                disabled={!pagination.hasPrev}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 rounded border border-gray-700 hover:border-gray-500 disabled:opacity-40"
              >
                ← Prev
              </button>
              <button
                disabled={!pagination.hasNext}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 rounded border border-gray-700 hover:border-gray-500 disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / edit */}
      {addOpen && (
        <CampaignModal
          mode="add"
          onClose={() => setAddOpen(false)}
          onSaved={() => {
            setPage(1);
            load();
          }}
        />
      )}
      {editCampaign && (
        <CampaignModal
          mode="edit"
          campaign={editCampaign}
          onClose={() => setEditCampaign(null)}
          onSaved={() => load()}
        />
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <Modal title="Delete campaign?" onClose={() => setDeleteTarget(null)}>
          <div className="space-y-4">
            <p className="text-sm text-gray-300">
              Delete{" "}
              <span className="text-white font-medium">{deleteTarget.title}</span>? This
              cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button className={btnSecondaryCls} onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button className={btnDangerCls} disabled={deleting} onClick={handleDelete}>
                {deleting ? "Deleting…" : "Delete campaign"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

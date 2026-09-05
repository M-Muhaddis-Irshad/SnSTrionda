"use client";

// =============================================================================
// Admin Campaigns — standalone page (was a stub). Promotes the real logic that
// lives in admin/media's CampaignsTab + CampaignModal into its own page, wired
// to the real endpoints:
//   GET    /api/admin/campaigns?page&limit&search   (paginated)
//   POST   /api/admin/campaigns
//   PATCH  /api/admin/campaigns/:id
//   PATCH  /api/admin/campaigns/bulk-status
//   DELETE /api/admin/campaigns/:id
//   GET/POST /api/admin/images                      (picker + upload)
// The status pill (Active/Scheduled/Expired/Inactive) is date-derived, so a
// status filter can't be server-side: the full set is loaded across server
// pages (Products-page pattern) and filtered/paginated client-side.
// =============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Pencil, Trash2, Search, Loader2, Megaphone, Upload } from "lucide-react";
import Modal, {
  inputCls,
  btnPrimaryCls,
  btnSecondaryCls,
  btnDangerCls,
  fieldErrorCls,
} from "@/app/admin/media/components/Modal";
import {
  fetchAdminCampaigns,
  createAdminCampaign,
  updateAdminCampaign,
  deleteAdminCampaign,
  bulkUpdateCampaigns,
  fetchAdminImages,
  createAdminImage,
} from "@/lib/admin-api";
import {
  campaignStatus,
  type CampaignStatus,
  type CampaignType,
  type ImageAsset,
} from "@/types/admin.types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 10;
const FETCH_LIMIT = 50;
const MAX_PAGES = 20; // safety cap (~1000 campaigns)

const STATUS_OPTIONS: { id: "" | CampaignStatus; label: string }[] = [
  { id: "", label: "All statuses" },
  { id: "Active", label: "Active" },
  { id: "Scheduled", label: "Scheduled" },
  { id: "Expired", label: "Expired" },
  { id: "Inactive", label: "Inactive" },
];

const STATUS_COLORS: Record<CampaignStatus, string> = {
  Active: "bg-green-500/20 text-green-300",
  Scheduled: "bg-blue-500/20 text-blue-300",
  Expired: "bg-gray-700 text-gray-300",
  Inactive: "bg-gray-800 text-gray-400",
};

const PAGE_ROW_CLS = "p-2 rounded border transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | CampaignStatus>("");
  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CampaignType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CampaignType | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Full-set load (server pages of 50) so status/search filters + counts are
  // correct across the whole catalog.
  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const all: CampaignType[] = [];
      let pageNum = 1;
      let total = Infinity;
      while (all.length < total && pageNum <= MAX_PAGES) {
        const res = await fetchAdminCampaigns({ page: pageNum, limit: FETCH_LIMIT });
        all.push(...(res.data || []));
        total = res.pagination?.total ?? all.length;
        pageNum += 1;
      }
      setCampaigns(all);
    } catch (err: any) {
      setError(err.message || "Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // -------------------------------------------------------------------------
  // Client filters + pagination
  // -------------------------------------------------------------------------

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return campaigns.filter((c) => {
      if (statusFilter && campaignStatus(c) !== statusFilter) return false;
      if (!q) return true;
      return (
        c.title.toLowerCase().includes(q) ||
        (c.description || "").toLowerCase().includes(q)
      );
    });
  }, [campaigns, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
    setSelected(new Set());
  }, [search, statusFilter]);

  const allSelected = filtered.length > 0 && selected.size === filtered.length;

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelected((prev) => (prev.size === filtered.length ? new Set() : new Set(filtered.map((c) => c.id))));
  }

  async function runBulk(active: boolean) {
    if (selected.size === 0) return;
    setBusy(true);
    setActionError("");
    try {
      await bulkUpdateCampaigns(Array.from(selected), active);
      setSelected(new Set());
      await loadAll();
    } catch (err: any) {
      setActionError(err.message || "Bulk update failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await deleteAdminCampaign(deleteTarget.id);
      setDeleteTarget(null);
      await loadAll();
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete campaign");
    } finally {
      setDeleting(false);
    }
  }

  function openEdit(c: CampaignType) {
    setEditTarget(c);
    setActionError("");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-white">Email Campaigns</h1>
          <p className="text-sm text-gray-500 mt-1">
            Promotions with their own artwork, date window and discount.
          </p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className={btnPrimaryCls + " flex items-center gap-2"}
        >
          <Plus size={16} />
          Add Campaign
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or description…"
            className={inputCls + " pl-9"}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "" | CampaignStatus)}
          className={inputCls + " sm:w-48"}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.id || "all"} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
        {selected.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 whitespace-nowrap">
              {selected.size} selected
            </span>
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
          </div>
        )}
      </div>

      {(error || actionError) && (
        <div className="bg-red-500/10 border border-red-500/40 text-red-300 text-sm px-4 py-3 rounded-lg">
          {actionError || error}
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 text-xs uppercase border-b border-gray-800">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    aria-label="Select all campaigns"
                    className="w-4 h-4 accent-white"
                  />
                </th>
                <th className="px-4 py-3 font-semibold">Campaign</th>
                <th className="px-4 py-3 font-semibold">Discount</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Dates</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                    <Loader2 size={20} className="mx-auto mb-2 animate-spin text-gray-600" />
                    Loading campaigns…
                  </td>
                </tr>
              ) : pageItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    <Megaphone size={28} className="mx-auto mb-2 text-gray-600" />
                    {campaigns.length === 0
                      ? "No campaigns yet. Click “Add Campaign” to create your first one."
                      : "No campaigns match the current filters."}
                  </td>
                </tr>
              ) : (
                pageItems.map((c) => {
                  const status = campaignStatus(c);
                  return (
                    <tr
                      key={c.id}
                      className={`border-b border-gray-800/60 hover:bg-gray-800/30 transition ${
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
                              className="h-12 w-12 object-cover rounded border border-gray-700 shrink-0"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded border border-dashed border-gray-600 flex items-center justify-center text-gray-500 text-[10px] shrink-0">
                              No image
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-white font-medium truncate">{c.title}</p>
                            {c.description && (
                              <p className="text-xs text-gray-500 truncate max-w-[220px]">
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
                        <span className={`px-2 py-0.5 rounded text-xs ${STATUS_COLORS[status]}`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                        {new Date(c.startDate).toLocaleDateString("en-PK")} →{" "}
                        {new Date(c.endDate).toLocaleDateString("en-PK")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => openEdit(c)}
                            aria-label={`Edit campaign ${c.title}`}
                            title="Edit"
                            className={`${PAGE_ROW_CLS} border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white`}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => {
                              setDeleteTarget(c);
                              setDeleteError("");
                            }}
                            aria-label={`Delete campaign ${c.title}`}
                            title="Delete"
                            className={`${PAGE_ROW_CLS} border-red-500/30 text-red-400 hover:bg-red-500/10`}
                          >
                            <Trash2 size={14} />
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
      </div>

      {/* Pagination (client-side over the filtered set) */}
      {!loading && filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>
            Page {safePage} of {totalPages} · {filtered.length} campaigns
          </span>
          <div className="flex gap-2">
            <button
              disabled={safePage <= 1}
              onClick={() => setPage(safePage - 1)}
              className="px-3 py-1.5 bg-gray-800 rounded disabled:opacity-40 hover:bg-gray-700 transition"
            >
              ← Prev
            </button>
            <button
              disabled={safePage >= totalPages}
              onClick={() => setPage(safePage + 1)}
              className="px-3 py-1.5 bg-gray-800 rounded disabled:opacity-40 hover:bg-gray-700 transition"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* ── Add / Edit modal ── */}
      {addOpen && (
        <CampaignFormModal
          mode="add"
          onClose={() => setAddOpen(false)}
          onSaved={() => {
            setAddOpen(false);
            loadAll();
          }}
        />
      )}
      {editTarget && (
        <CampaignFormModal
          mode="edit"
          campaign={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => {
            setEditTarget(null);
            loadAll();
          }}
        />
      )}

      {/* ── Delete confirm ── */}
      {deleteTarget && (
        <Modal
          title={`Delete ${deleteTarget.title}`}
          onClose={() => {
            if (!deleting) setDeleteTarget(null);
          }}
        >
          <p className="text-sm text-gray-300 mb-4">
            Delete campaign{" "}
            <span className="text-white font-semibold">{deleteTarget.title}</span>? This
            cannot be undone.
          </p>
          {deleteError && (
            <div className="bg-red-500/10 border border-red-500/40 text-red-300 text-sm px-4 py-3 rounded-lg mb-4">
              {deleteError}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button className={btnSecondaryCls} onClick={() => setDeleteTarget(null)}>
              Cancel
            </button>
            <button className={btnDangerCls} onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete Campaign"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Add / Edit form modal (lifted from admin/media CampaignModal + image upload)
// ---------------------------------------------------------------------------

interface CampaignFormModalProps {
  mode: "add" | "edit";
  campaign?: CampaignType | null;
  onClose: () => void;
  onSaved: () => void;
}

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultWindow(): { start: string; end: string } {
  const start = new Date();
  const end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  return { start: toLocalInput(start.toISOString()), end: toLocalInput(end.toISOString()) };
}

function CampaignFormModal({ mode, campaign, onClose, onSaved }: CampaignFormModalProps) {
  const initial = defaultWindow();
  const [title, setTitle] = useState(campaign?.title || "");
  const [description, setDescription] = useState(campaign?.description || "");
  const [imageId, setImageId] = useState(campaign?.imageId || "");
  const [startDate, setStartDate] = useState(campaign ? toLocalInput(campaign.startDate) : initial.start);
  const [endDate, setEndDate] = useState(campaign ? toLocalInput(campaign.endDate) : initial.end);
  const [discount, setDiscount] = useState(campaign?.discount ?? 0);
  const [active, setActive] = useState(campaign?.active ?? true);

  const [images, setImages] = useState<ImageAsset[]>([]);
  const [imagesLoading, setImagesLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const loadImages = useCallback(async () => {
    try {
      const res: any = await fetchAdminImages({ limit: 100 });
      const list = (res?.data || []) as ImageAsset[];
      setImages(list);
      setImageId((prev) => {
        if (prev && list.some((i) => i.id === prev)) return prev;
        const first = list.find((i) => i.active) || list[0];
        return first ? first.id : "";
      });
      setError("");
    } catch {
      setError("Could not load images for the picker.");
    } finally {
      setImagesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  // Upload a new artwork straight to /api/admin/images (category CAMPAIGN) and
  // auto-select it in the picker.
  async function handleUpload(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("name", file.name.replace(/\.[^.]+$/, "") || "Campaign image");
      formData.append("category", "CAMPAIGN");
      const res: any = await createAdminImage(formData);
      const created = res?.data as ImageAsset | undefined;
      setImages((prev) => (created ? [...prev, created] : prev));
      if (created) setImageId(created.id);
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function validate(): Record<string, string> {
    const errors: Record<string, string> = {};
    if (!title.trim()) errors.title = "Title is required.";
    if (!imageId) errors.imageId = "Choose a campaign image (or upload one).";
    if (!startDate) errors.startDate = "Start date is required.";
    if (!endDate) errors.endDate = "End date is required.";
    if (startDate && endDate) {
      const s = new Date(startDate).getTime();
      const e = new Date(endDate).getTime();
      if (isNaN(s) || isNaN(e)) {
        errors.endDate = "Invalid dates.";
      } else if (e <= s) {
        errors.endDate = "End date must be after start date.";
      }
    }
    const disc = Number(discount);
    if (isNaN(disc) || disc < 0 || disc > 100) {
      errors.discount = "Discount must be between 0 and 100%.";
    }
    return errors;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setError("");
    setLoading(true);
    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      imageId,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      discount: Number(discount),
      active,
    };

    try {
      if (mode === "add") {
        await createAdminCampaign(payload);
      } else if (campaign) {
        await updateAdminCampaign(campaign.id, payload);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      title={mode === "add" ? "Create Campaign" : `Edit ${campaign?.title || "Campaign"}`}
      onClose={() => {
        if (!loading && !uploading) onClose();
      }}
      wide
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase text-gray-500 font-bold mb-1.5">
              Title *
            </label>
            <input
              className={inputCls}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Eid Sale 2026"
            />
            {fieldErrors.title && <p className={fieldErrorCls}>{fieldErrors.title}</p>}
          </div>
          <div>
            <label className="block text-xs uppercase text-gray-500 font-bold mb-1.5">
              Discount % *
            </label>
            <input
              className={inputCls}
              type="number"
              min={0}
              max={100}
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
            />
            {fieldErrors.discount && <p className={fieldErrorCls}>{fieldErrors.discount}</p>}
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase text-gray-500 font-bold mb-1.5">
            Image *
          </label>
          {imagesLoading ? (
            <p className="text-xs text-gray-500 py-1">Loading images…</p>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <select
                className={inputCls + " sm:flex-1"}
                value={imageId}
                onChange={(e) => setImageId(e.target.value)}
              >
                {images.length === 0 && <option value="">No images yet — upload one</option>}
                {images.map((img) => (
                  <option key={img.id} value={img.id}>
                    {img.name}
                    {!img.active ? " (inactive)" : ""}
                  </option>
                ))}
              </select>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => handleUpload(e.target.files?.[0] || null)}
              />
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
                className={btnSecondaryCls + " flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"}
              >
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                {uploading ? "Uploading…" : "Upload New"}
              </button>
            </div>
          )}
          {fieldErrors.imageId && <p className={fieldErrorCls}>{fieldErrors.imageId}</p>}
        </div>

        <div>
          <label className="block text-xs uppercase text-gray-500 font-bold mb-1.5">
            Description
          </label>
          <textarea
            className={`${inputCls} resize-none`}
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this campaign about?"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase text-gray-500 font-bold mb-1.5">
              Start date *
            </label>
            <input
              className={inputCls}
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            {fieldErrors.startDate && <p className={fieldErrorCls}>{fieldErrors.startDate}</p>}
          </div>
          <div>
            <label className="block text-xs uppercase text-gray-500 font-bold mb-1.5">
              End date *
            </label>
            <input
              className={inputCls}
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            {fieldErrors.endDate && <p className={fieldErrorCls}>{fieldErrors.endDate}</p>}
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="w-4 h-4 accent-white"
          />
          <span className="text-sm text-gray-200">Active campaign</span>
        </label>

        {error && <p className={fieldErrorCls}>{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            className={btnSecondaryCls}
            onClick={onClose}
            disabled={loading || uploading}
          >
            Cancel
          </button>
          <button type="submit" className={btnPrimaryCls} disabled={loading || uploading || imagesLoading}>
            {loading ? "Saving…" : mode === "add" ? "Create Campaign" : "Save Changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

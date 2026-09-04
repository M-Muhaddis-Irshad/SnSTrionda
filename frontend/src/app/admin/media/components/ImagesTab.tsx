"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Pencil, Trash2, Eye } from "lucide-react";
import Modal, { btnPrimaryCls, btnSecondaryCls, btnDangerCls } from "./Modal";
import ImageModal from "./ImageModal";
import {
  fetchAdminImages,
  fetchAdminImageUsage,
  updateAdminImage,
  deleteAdminImage,
} from "@/lib/admin-api";
import {
  IMAGE_CATEGORIES,
  type ImageAsset,
  type ImageCategory,
  type Paginated,
  type ImageUsage,
} from "@/types/admin.types";

const categoryColors: Record<ImageCategory, string> = {
  HERO: "bg-purple-500/20 text-purple-300",
  BANNER: "bg-blue-500/20 text-blue-300",
  COLLECTION: "bg-green-500/20 text-green-300",
  CAROUSEL: "bg-yellow-500/20 text-yellow-300",
  CAMPAIGN: "bg-pink-500/20 text-pink-300",
};

export default function ImagesTab() {
  const [images, setImages] = useState<ImageAsset[]>([]);
  const [pagination, setPagination] = useState<Paginated<ImageAsset>["pagination"] | null>(null);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const [addOpen, setAddOpen] = useState(false);
  const [editImage, setEditImage] = useState<ImageAsset | null>(null);

  // Delete confirmation with usage lookup
  const [deleteTarget, setDeleteTarget] = useState<ImageAsset | null>(null);
  const [deleteUsage, setDeleteUsage] = useState<ImageUsage | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = (await fetchAdminImages({
        page,
        limit: 10,
        category: category || undefined,
        search: query || undefined,
      })) as Paginated<ImageAsset>;
      setImages(res.data);
      setPagination(res.pagination);
    } catch (err: any) {
      setError(err?.message || "Failed to load images.");
    } finally {
      setLoading(false);
    }
  }, [page, category, query]);

  useEffect(() => {
    load();
  }, [load]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setQuery(search.trim());
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  // Prefetch usage when delete confirmation opens
  useEffect(() => {
    if (!deleteTarget) return;
    setDeleteUsage(null);
    setDeleteError("");
    setDeleteLoading(true);
    fetchAdminImageUsage(deleteTarget.id)
      .then((res: any) => {
        setDeleteUsage(res?.data || null);
      })
      .catch((err: any) => setDeleteError(err?.message || "Could not check usage."))
      .finally(() => setDeleteLoading(false));
  }, [deleteTarget]);

  async function toggleActive(image: ImageAsset) {
    setBusyId(image.id);
    try {
      await updateAdminImage(image.id, { active: !image.active });
      setImages((prev) =>
        prev.map((i) => (i.id === image.id ? { ...i, active: !i.active } : i))
      );
    } catch (err: any) {
      alert(err?.message || "Update failed");
    } finally {
      setBusyId("");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await deleteAdminImage(deleteTarget.id);
      setImages((prev) => prev.filter((i) => i.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: any) {
      setDeleteError(err?.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or alt…"
            className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-500"
          />
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500"
          >
            <option value="">All categories</option>
            {IMAGE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.charAt(0) + c.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="px-4 py-2 bg-white text-black text-sm font-semibold rounded hover:bg-gray-200 transition"
        >
          + Add image
        </button>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-gray-500 border-b border-gray-800">
                <th className="px-4 py-3 font-medium">Image</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Active</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                    Loading images…
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-red-400">
                    {error}
                  </td>
                </tr>
              ) : images.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                    No images found. Click “+ Add image” to upload one.
                  </td>
                </tr>
              ) : (
                images.map((img) => (
                  <tr key={img.id} className="border-b border-gray-800/60 last:border-0 hover:bg-gray-800/30">
                    <td className="px-4 py-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt={img.alt || img.name}
                        className="h-12 w-12 object-cover rounded border border-gray-700"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white font-medium">{img.name}</p>
                      <p className="text-xs text-gray-500">
                        {img._count?.campaigns
                          ? `Used in ${img._count.campaigns} campaign${img._count.campaigns === 1 ? "" : "s"}`
                          : "Not used by campaigns"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${categoryColors[img.category] || "bg-gray-700 text-gray-300"}`}>
                        {img.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={img.active}
                        disabled={busyId === img.id}
                        onClick={() => toggleActive(img)}
                        className={`relative h-5 w-10 rounded-full transition-colors disabled:opacity-50 ${
                          img.active ? "bg-green-500" : "bg-gray-700"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
                            img.active ? "left-5" : "left-0.5"
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {new Date(img.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={img.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="View image in a new tab"
                          title="View"
                          className="p-2 rounded border border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white transition inline-flex"
                        >
                          <Eye size={14} />
                        </a>
                        <button
                          onClick={() => setEditImage(img)}
                          aria-label={`Edit image ${img.name || ""}`}
                          title="Edit"
                          className="p-2 rounded border border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white transition"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(img)}
                          aria-label={`Delete image ${img.name || ""}`}
                          title="Delete"
                          className="p-2 rounded border border-red-500/30 text-red-400 hover:bg-red-500/10 transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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

      {/* Add / edit modal */}
      {addOpen && (
        <ImageModal
          mode="add"
          onClose={() => setAddOpen(false)}
          onSaved={() => {
            setPage(1);
            load();
          }}
        />
      )}
      {editImage && (
        <ImageModal
          mode="edit"
          image={editImage}
          onClose={() => setEditImage(null)}
          onSaved={() => load()}
        />
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <Modal title="Delete image?" onClose={() => setDeleteTarget(null)}>
          <div className="space-y-4">
            <p className="text-sm text-gray-300">
              You are about to delete{" "}
              <span className="text-white font-medium">{deleteTarget.name}</span>.
            </p>

            {deleteLoading ? (
              <p className="text-xs text-gray-500">Checking where this image is used…</p>
            ) : deleteError ? (
              <p className="text-xs text-red-400">{deleteError}</p>
            ) : deleteUsage && deleteUsage.usage.usedByCampaigns > 0 ? (
              <div className="bg-red-500/10 border border-red-500/40 rounded p-3 text-xs text-red-300 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <AlertTriangle size={14} strokeWidth={2} className="shrink-0" />
                  Cannot delete — this image is used by{" "}
                  {deleteUsage.usage.usedByCampaigns} campaign
                  {deleteUsage.usage.usedByCampaigns === 1 ? "" : "s"}:
                </p>
                <ul className="list-disc pl-4">
                  {deleteUsage.usage.campaigns.map((c) => (
                    <li key={c.id}>{c.title}</li>
                  ))}
                </ul>
                <p>Remove the campaign link first, then delete this image.</p>
              </div>
            ) : (
              <p className="text-xs text-gray-400">
                This image is not used by any campaign and can be safely deleted.
              </p>
            )}

            {deleteError && (
              <p className="text-xs text-red-400">{deleteError}</p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button className={btnSecondaryCls} onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button
                className={btnDangerCls}
                disabled={
                  deleting ||
                  deleteLoading ||
                  !!deleteUsage?.usage.usedByCampaigns
                }
                onClick={handleDelete}
              >
                {deleting ? "Deleting…" : "Delete image"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

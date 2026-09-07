"use client";

// =============================================================================
// Admin Collections — full management wired to the real backend endpoints:
//   GET    /api/admin/collections
//   POST   /api/admin/collections
//   PUT    /api/admin/collections/:collectionId
//   DELETE /api/admin/collections/:collectionId
// A collection = name/slug/description + banner image + an ordered set of
// products. Active collections render on the storefront /shop/collections page.
// =============================================================================

import { useCallback, useEffect, useState } from "react";
import { Layers, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import Modal, {
  inputCls,
  btnPrimaryCls,
  btnSecondaryCls,
  btnDangerCls,
  fieldErrorCls,
} from "@/app/admin/media/components/Modal";
import {
  fetchAdminCollections,
  createAdminCollection,
  updateAdminCollection,
  deleteAdminCollection,
  fetchAdminProducts,
} from "@/lib/admin-api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AdminCollection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  bannerUrl: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { products: number };
  /** Assigned product ids (from the admin list endpoint) — for the edit form. */
  productIds?: string[];
}

interface PickableProduct {
  id: string;
  name: string;
  slug: string;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CollectionsPage() {
  const [collections, setCollections] = useState<AdminCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modal, setModal] = useState<{ mode: "create" } | { mode: "edit"; collection: AdminCollection } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminCollection | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetchAdminCollections();
      setCollections(res.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load collections");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await deleteAdminCollection(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete collection");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-white">Collections</h1>
          <p className="text-sm text-gray-500 mt-1">
            Curated product groupings with a banner — shown on the storefront
            collections page.
          </p>
        </div>
        <button
          onClick={() => setModal({ mode: "create" })}
          className={btnPrimaryCls + " flex items-center gap-2"}
        >
          <Plus size={16} />
          Add Collection
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        {loading ? (
          <div className="text-gray-400 text-center py-16">
            <Loader2 size={24} className="mx-auto mb-3 animate-spin text-gray-600" />
            Loading collections…
          </div>
        ) : collections.length === 0 ? (
          <div className="text-gray-400 text-center py-16">
            <Layers size={32} className="mx-auto mb-3 text-gray-600" />
            <p>No collections yet. Click “Add Collection” to create your first one.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 text-xs uppercase border-b border-gray-800">
                  <th className="px-4 py-3 font-semibold">Collection</th>
                  <th className="px-4 py-3 font-semibold">Products</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {collections.map((c) => (
                  <tr
                    key={c.id}
                    className={`border-b border-gray-800/60 hover:bg-gray-800/40 transition ${
                      c.active ? "" : "opacity-50"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {c.bannerUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={c.bannerUrl}
                            alt=""
                            className="h-10 w-16 object-cover rounded border border-gray-700 shrink-0"
                          />
                        ) : (
                          <div className="h-10 w-16 rounded border border-dashed border-gray-600 flex items-center justify-center text-gray-500 shrink-0">
                            <Layers size={14} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-white font-medium truncate">{c.name}</p>
                          <p className="text-xs text-gray-500 truncate">/{c.slug}</p>
                          {c.description && (
                            <p className="text-xs text-gray-500 truncate max-w-[220px]">
                              {c.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded border border-gray-700 text-gray-300">
                        {c.productIds?.length ?? c._count?.products ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-1 rounded border ${
                          c.active
                            ? "bg-green-500/10 text-green-400 border-green-500/30"
                            : "bg-gray-800 text-gray-500 border-gray-700"
                        }`}
                      >
                        {c.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => setModal({ mode: "edit", collection: c })}
                          aria-label={`Edit collection ${c.name}`}
                          title="Edit"
                          className="p-2 rounded border border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white transition"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => {
                            setDeleteTarget(c);
                            setDeleteError("");
                          }}
                          aria-label={`Delete collection ${c.name}`}
                          title="Delete"
                          className="p-2 rounded border border-red-500/30 text-red-400 hover:bg-red-500/10 transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <CollectionFormModal
          mode={modal.mode}
          editing={modal.mode === "edit" ? modal.collection : null}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}

      {deleteTarget && (
        <Modal
          title={`Delete ${deleteTarget.name}`}
          onClose={() => {
            if (!deleting) setDeleteTarget(null);
          }}
        >
          <p className="text-sm text-gray-300 mb-1">
            Delete collection{" "}
            <span className="text-white font-semibold">{deleteTarget.name}</span>?
          </p>
          <p className="text-xs text-gray-500 mb-4">
            Products are NOT deleted — they are only removed from this grouping.
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
              {deleting ? "Deleting…" : "Delete Collection"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Create / Edit form modal
// ---------------------------------------------------------------------------

function CollectionFormModal({
  mode,
  editing,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  editing: AdminCollection | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(editing?.name || "");
  const [slug, setSlug] = useState(editing?.slug || "");
  const [description, setDescription] = useState(editing?.description || "");
  const [bannerUrl, setBannerUrl] = useState(editing?.bannerUrl || "");
  const [active, setActive] = useState(editing ? editing.active : true);
  const [productIds, setProductIds] = useState<string[]>(editing?.productIds || []);
  const [products, setProducts] = useState<PickableProduct[]>([]);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [query, setQuery] = useState("");

  // Load pickable products + (for edit) the current assigned set via the admin
  // product endpoint (the assignment ids live in the join table server-side,
  // so we preload the first page and let admins search by typing).
  useEffect(() => {
    let cancelled = false;
    fetchAdminProducts({ limit: 100, includeInactive: false })
      .then((res) => {
        if (cancelled) return;
        setProducts(
          (res.data || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
          }))
        );
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  function toggleProduct(id: string) {
    setProductIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  const filtered = products.filter((p) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q);
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        slug: slug.trim() || undefined,
        description: description.trim() || undefined,
        bannerUrl: bannerUrl.trim() || undefined,
        productIds,
        active,
      };
      if (mode === "create") {
        await createAdminCollection(payload);
      } else if (editing) {
        await updateAdminCollection(editing.id, payload);
      }
      onClose();
      onSaved();
    } catch (err: any) {
      setFormError(err.message || "Failed to save collection");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={mode === "create" ? "Add Collection" : `Edit ${editing?.name || "Collection"}`}
      onClose={() => {
        if (!saving) onClose();
      }}
      wide
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase text-gray-500 font-bold mb-1.5">
              Name *
            </label>
            <input
              type="text"
              className={inputCls}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Festive Formals"
              required
            />
          </div>
          <div>
            <label className="block text-xs uppercase text-gray-500 font-bold mb-1.5">
              Slug
            </label>
            <input
              type="text"
              className={inputCls}
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder={mode === "create" ? "auto-generated from name" : editing?.slug}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase text-gray-500 font-bold mb-1.5">
            Description
          </label>
          <textarea
            className={inputCls + " min-h-[60px] resize-y"}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description shown on the collections page"
          />
        </div>

        <div>
          <label className="block text-xs uppercase text-gray-500 font-bold mb-1.5">
            Banner Image URL
          </label>
          <div className="flex gap-3">
            <input
              type="url"
              className={inputCls}
              value={bannerUrl}
              onChange={(e) => setBannerUrl(e.target.value)}
              placeholder="https://res.cloudinary.com/... (paste from the Media library)"
            />
            {bannerUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={bannerUrl}
                alt="Banner preview"
                className="h-10 w-16 object-cover rounded border border-gray-700 shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.opacity = "0.3";
                }}
              />
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Upload a banner in{" "}
            <span className="text-gray-300">Media → Site Media</span>, then paste
            its URL here (copy the image address).
          </p>
        </div>

        {/* Product assignment */}
        <div>
          <label className="block text-xs uppercase text-gray-500 font-bold mb-1.5">
            Products ({productIds.length} selected)
          </label>
          <input
            type="text"
            className={inputCls + " mb-2"}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products to add…"
          />
          <div className="max-h-56 overflow-y-auto border border-gray-800 rounded">
            {filtered.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-6">
                No products match. Create products first in the Products page.
              </p>
            ) : (
              filtered.map((p) => {
                const checked = productIds.includes(p.id);
                return (
                  <label
                    key={p.id}
                    className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer border-b border-gray-800/60 last:border-0 ${
                      checked ? "bg-white/5" : "hover:bg-gray-800/40"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleProduct(p.id)}
                      className="accent-white"
                    />
                    <span className={checked ? "text-white" : "text-gray-300"}>
                      {p.name}
                    </span>
                  </label>
                );
              })
            )}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="accent-white"
          />
          Active (shown on storefront)
        </label>

        {formError && <p className={fieldErrorCls}>{formError}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            className={btnSecondaryCls}
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button type="submit" disabled={saving} className={btnPrimaryCls}>
            {saving ? "Saving…" : mode === "create" ? "Create Collection" : "Save Changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

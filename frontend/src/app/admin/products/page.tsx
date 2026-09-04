"use client";

// =============================================================================
// Admin Products — full product management (list, create, edit, soft-delete,
// images, variants), wired to the real backend endpoints:
//   GET    /api/admin/products?page&limit&search&includeInactive
//   GET    /api/admin/products/:id
//   POST   /api/admin/products
//   PUT    /api/admin/products/:id
//   DELETE /api/admin/products/:id            (soft delete → isActive=false)
//   POST   /api/products/:id/images           (multipart)
//   DELETE /api/products/:id/images/:imageId
//   POST   /api/admin/products/:id/variants
//   PUT    /api/admin/variants/:variantId
//   DELETE /api/admin/variants/:variantId
// =============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  Search,
  Upload,
  Loader2,
  Boxes,
} from "lucide-react";
import Modal, {
  inputCls,
  btnPrimaryCls,
  btnSecondaryCls,
  btnDangerCls,
  fieldErrorCls,
} from "@/app/admin/media/components/Modal";
import {
  fetchAdminProducts,
  fetchAdminProduct,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  fetchCategories,
  uploadProductImage,
  deleteProductImage,
  createAdminVariant,
  updateAdminVariant,
  deleteAdminVariant,
} from "@/lib/admin-api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AdminCategory {
  id: string;
  name: string;
  slug: string;
}

interface AdminProductImage {
  id: string;
  url: string;
  altText: string | null;
  displayOrder: number;
}

interface AdminVariant {
  id: string;
  size: string | null;
  color: string | null;
  fabricType: string | null;
  sku: string;
  price: number | string | null;
  stockQuantity: number;
}

interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  basePrice: number | string;
  isCustomizable: boolean;
  isActive: boolean;
  createdAt: string;
  category: AdminCategory | null;
  images: AdminProductImage[];
  variants: AdminVariant[];
}

const PAGE_SIZE = 15;
const FETCH_LIMIT = 50;
const MAX_PAGES = 20; // safety cap (~1000 products)

function formatRs(value: number | string | null | undefined): string {
  const n = Number(value);
  if (isNaN(n)) return "—";
  return `Rs. ${n.toLocaleString("en-PK")}`;
}

function variantDraftKey(v: { id?: string }, index: number): string {
  return v.id || `new-${index}`;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [page, setPage] = useState(1);

  const [modal, setModal] = useState<{ mode: "create" } | { mode: "edit"; productId: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminProduct | null>(null);
  const [deleting, setDeleting] = useState(false);

  // -------------------------------------------------------------------------
  // Load — pull every page (server-paginated at 50) so category filtering and
  // counts stay correct client-side (the API has no category filter param).
  // -------------------------------------------------------------------------

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const all: AdminProduct[] = [];
      let pageNum = 1;
      let total = Infinity;
      while (all.length < total && pageNum <= MAX_PAGES) {
        const res = await fetchAdminProducts({
          page: pageNum,
          limit: FETCH_LIMIT,
          includeInactive: true,
        });
        all.push(...(res.data || []));
        total = res.pagination?.total ?? all.length;
        pageNum += 1;
      }
      setProducts(all);
    } catch (err: any) {
      setError(err.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const res = await fetchCategories();
      setCategories(res.data || []);
    } catch {
      // categories are only used for the filter/form — non-fatal
    }
  }, []);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [loadProducts, loadCategories]);

  // -------------------------------------------------------------------------
  // Local filters + pagination
  // -------------------------------------------------------------------------

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (!showInactive && !p.isActive) return false;
      if (categoryId && p.category?.id !== categoryId) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        (p.category?.name || "").toLowerCase().includes(q)
      );
    });
  }, [products, query, categoryId, showInactive]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [query, categoryId, showInactive]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteAdminProduct(deleteTarget.id); // soft delete on the backend
      setDeleteTarget(null);
      await loadProducts();
    } catch (err: any) {
      alert(err.message || "Failed to delete product");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-white">Products</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage the catalog — details, pricing, images and variants.
          </p>
        </div>
        <button
          onClick={() => setModal({ mode: "create" })}
          className={btnPrimaryCls + " flex items-center gap-2"}
        >
          <Plus size={16} />
          Add Product
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, slug or category…"
            className={inputCls + " pl-9"}
          />
        </div>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className={inputCls + " sm:w-56"}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-400 whitespace-nowrap">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="accent-white"
          />
          Show inactive
        </label>
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
            Loading products…
          </div>
        ) : pageItems.length === 0 ? (
          <div className="text-gray-400 text-center py-16">
            <Package size={32} className="mx-auto mb-3 text-gray-600" />
            <p>
              {products.length === 0
                ? "No products yet. Click “Add Product” to create your first one."
                : "No products match the current filters."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 text-xs uppercase border-b border-gray-800">
                  <th className="px-4 py-3 font-semibold">Product</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Price</th>
                  <th className="px-4 py-3 font-semibold">Variants</th>
                  <th className="px-4 py-3 font-semibold">Stock</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((product) => {
                  const stock = product.variants.reduce(
                    (sum, v) => sum + Number(v.stockQuantity || 0),
                    0
                  );
                  return (
                    <tr
                      key={product.id}
                      className={`border-b border-gray-800/60 hover:bg-gray-800/40 transition ${
                        product.isActive ? "" : "opacity-50"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {product.images?.[0]?.url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={product.images[0].url}
                              alt={product.images[0].altText || product.name}
                              className="h-12 w-12 object-cover rounded border border-gray-700 shrink-0"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded border border-dashed border-gray-600 flex items-center justify-center text-gray-500 shrink-0">
                              <Package size={16} />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-white font-medium truncate">
                              {product.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              /{product.slug}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {product.category ? (
                          <span className="text-xs px-2 py-0.5 rounded border border-gray-700 text-gray-300">
                            {product.category.name}
                          </span>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-white font-medium whitespace-nowrap">
                        {formatRs(product.basePrice)}
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        {product.variants.length}
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        {stock.toLocaleString("en-PK")}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-1 rounded border ${
                            product.isActive
                              ? "bg-green-500/10 text-green-400 border-green-500/30"
                              : "bg-gray-800 text-gray-500 border-gray-700"
                          }`}
                        >
                          {product.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() =>
                              setModal({ mode: "edit", productId: product.id })
                            }
                            aria-label={`Edit ${product.name}`}
                            title="Edit"
                            className="p-2 rounded border border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white transition"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(product)}
                            aria-label={`Delete ${product.name}`}
                            title="Delete"
                            className="p-2 rounded border border-red-500/30 text-red-400 hover:bg-red-500/10 transition"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination (client-side over the full filtered set) */}
      {!loading && filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>
            Page {safePage} of {totalPages} · {filtered.length} products
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

      {/* Create / Edit modal */}
      {modal && (
        <ProductFormModal
          mode={modal.mode}
          productId={modal.mode === "edit" ? modal.productId : undefined}
          categories={categories}
          onClose={() => setModal(null)}
          onChanged={loadProducts}
        />
      )}

      {/* Delete confirm — backend soft-deletes (isActive=false) */}
      {deleteTarget && (
        <Modal
          title="Delete Product"
          onClose={() => {
            if (!deleting) setDeleteTarget(null);
          }}
        >
          <p className="text-sm text-gray-300 mb-1">
            Delete{" "}
            <span className="text-white font-semibold">{deleteTarget.name}</span>?
          </p>
          <p className="text-xs text-gray-500 mb-6">
            The product is deactivated and hidden from the storefront (soft
            delete). You can restore it later by editing it and marking it
            Active again.
          </p>
          <div className="flex justify-end gap-2">
            <button className={btnSecondaryCls} onClick={() => setDeleteTarget(null)}>
              Cancel
            </button>
            <button className={btnDangerCls} onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete Product"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Create / Edit form modal (details + images + variants)
// ---------------------------------------------------------------------------

interface ProductFormModalProps {
  mode: "create" | "edit";
  productId?: string;
  categories: AdminCategory[];
  onClose: () => void;
  onChanged: () => void;
}

function ProductFormModal({
  mode: initialMode,
  productId,
  categories,
  onClose,
  onChanged,
}: ProductFormModalProps) {
  // After a successful create the modal flips to "edit" of the new product so
  // images & variants (which need a real product id) can be added right away.
  const [mode, setMode] = useState<"create" | "edit">(initialMode);
  const [currentId, setCurrentId] = useState<string | null>(productId || null);
  const [detail, setDetail] = useState<AdminProduct | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(mode === "edit");

  // Basic fields (strings so inputs stay controlled)
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isCustomizable, setIsCustomizable] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [successNote, setSuccessNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load full detail on edit
  useEffect(() => {
    if (mode !== "edit" || !currentId) return;
    let cancelled = false;
    setLoadingDetail(true);
    fetchAdminProduct(currentId)
      .then((res) => {
        if (cancelled) return;
        const p = res.data as AdminProduct;
        setDetail(p);
        setName(p.name);
        setDescription(p.description || "");
        setBasePrice(String(Number(p.basePrice)));
        setCategoryId(p.category?.id || "");
        setIsCustomizable(p.isCustomizable);
        setIsActive(p.isActive);
      })
      .catch((err: any) => {
        if (!cancelled) setFormError(err.message || "Failed to load product");
      })
      .finally(() => {
        if (!cancelled) setLoadingDetail(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mode, currentId]);

  function resetDetailState() {
    setDetail(null);
    setName("");
    setDescription("");
    setBasePrice("");
    setCategoryId("");
    setIsCustomizable(false);
    setIsActive(true);
  }

  async function handleSaveDetails(e: React.FormEvent) {
    e.preventDefault();
    const price = Number(basePrice);
    if (!name.trim()) {
      setFormError("Product name is required.");
      return;
    }
    if (basePrice === "" || isNaN(price) || price < 0) {
      setFormError("A valid base price (≥ 0) is required.");
      return;
    }
    if (!categoryId) {
      setFormError("Please choose a category.");
      return;
    }
    setFormError("");
    setSaving(true);
    try {
      if (mode === "create") {
        const res = await createAdminProduct({
          name: name.trim(),
          description: description.trim() || undefined,
          basePrice: price,
          isCustomizable,
          categoryId,
        });
        const createdId = (res.data as AdminProduct).id;
        setMode("edit");
        setCurrentId(createdId);
        resetDetailState();
        setSuccessNote(
          "Product created. You can now add images and variants below."
        );
        onChanged();
      } else if (currentId) {
        await updateAdminProduct(currentId, {
          name: name.trim(),
          description: description.trim() || undefined,
          basePrice: price,
          isCustomizable,
          isActive,
          categoryId,
        });
        setSuccessNote("Product details saved.");
        onChanged();
      }
    } catch (err: any) {
      setFormError(err.message || "Failed to save product");
    } finally {
      setSaving(false);
    }
  }

  async function handleImageUpload(file: File | null) {
    if (!file || !currentId) return;
    setUploading(true);
    setFormError("");
    try {
      await uploadProductImage(currentId, file);
      const res = await fetchAdminProduct(currentId);
      setDetail(res.data as AdminProduct);
      onChanged();
    } catch (err: any) {
      setFormError(err.message || "Image upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleImageDelete(image: AdminProductImage) {
    if (!currentId) return;
    if (!window.confirm("Remove this image from the product?")) return;
    setFormError("");
    try {
      await deleteProductImage(currentId, image.id);
      const res = await fetchAdminProduct(currentId);
      setDetail(res.data as AdminProduct);
      onChanged();
    } catch (err: any) {
      setFormError(err.message || "Failed to delete image");
    }
  }

  return (
    <Modal
      title={
        mode === "create"
          ? "Add Product"
          : `Edit ${detail ? "— " + detail.name : "Product"}`
      }
      onClose={() => {
        if (!saving && !uploading) onClose();
      }}
      wide
    >
      {loadingDetail ? (
        <div className="text-gray-400 text-center py-12 flex flex-col items-center gap-2">
          <Loader2 size={20} className="animate-spin text-gray-600" />
          Loading product…
        </div>
      ) : (
        <div className="space-y-6">
          {successNote && (
            <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm px-4 py-2.5 rounded">
              {successNote}
            </div>
          )}
          {formError && <p className={fieldErrorCls}>{formError}</p>}

          {/* ── Details ── */}
          <form onSubmit={handleSaveDetails} className="space-y-4">
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
                  placeholder="e.g. Oxford Slim-Fit Shirt"
                />
              </div>
              <div>
                <label className="block text-xs uppercase text-gray-500 font-bold mb-1.5">
                  Category *
                </label>
                <select
                  className={inputCls}
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  <option value="">Select category…</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase text-gray-500 font-bold mb-1.5">
                Description
              </label>
              <textarea
                className={inputCls + " min-h-[80px] resize-y"}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Fabric, fit, care instructions…"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-xs uppercase text-gray-500 font-bold mb-1.5">
                  Base Price (Rs) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  className={inputCls}
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  placeholder="4999"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-300 pb-2">
                <input
                  type="checkbox"
                  checked={isCustomizable}
                  onChange={(e) => setIsCustomizable(e.target.checked)}
                  className="accent-white"
                />
                Made-to-order (custom measurements)
              </label>
              {mode === "edit" && (
                <label className="flex items-center gap-2 text-sm text-gray-300 pb-2">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="accent-white"
                  />
                  Active (visible on storefront)
                </label>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                className={btnSecondaryCls}
                onClick={() => {
                  if (!saving && !uploading) onClose();
                }}
              >
                {mode === "create" ? "Cancel" : "Close"}
              </button>
              <button type="submit" disabled={saving} className={btnPrimaryCls}>
                {saving
                  ? "Saving…"
                  : mode === "create"
                    ? "Create Product"
                    : "Save Details"}
              </button>
            </div>
          </form>

          {/* ── Images (edit only) ── */}
          {mode === "edit" && currentId && (
            <section className="pt-5 border-t border-gray-800">
              <h3 className="text-sm font-semibold text-white mb-3">
                Images
              </h3>
              {detail && detail.images.length > 0 ? (
                <div className="flex flex-wrap gap-3 mb-3">
                  {detail.images.map((img) => (
                    <div
                      key={img.id}
                      className="relative group border border-gray-700 rounded overflow-hidden"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt={img.altText || productId}
                        className="h-20 w-20 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleImageDelete(img)}
                        aria-label="Remove image"
                        title="Remove image"
                        className="absolute top-1 right-1 p-1 rounded bg-black/70 text-red-400 opacity-0 group-hover:opacity-100 hover:bg-black/90 transition"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 mb-3">
                  No images yet — the storefront falls back to a placeholder
                  until you upload one.
                </p>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => handleImageUpload(e.target.files?.[0] || null)}
              />
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className={btnSecondaryCls + " flex items-center gap-2 disabled:opacity-50"}
              >
                {uploading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Upload size={14} />
                )}
                {uploading ? "Uploading…" : "Upload Image"}
              </button>
            </section>
          )}

          {/* ── Variants (edit only) ── */}
          {mode === "edit" && currentId && (
            <section className="pt-5 border-t border-gray-800">
              <h3 className="text-sm font-semibold text-white mb-1">
                Variants
              </h3>
              <p className="text-xs text-gray-500 mb-3">
                Size / colour / fabric options with their own SKU, price and
                stock. Price is optional — falls back to the base price.
              </p>
              {detail && (
                <VariantEditor
                  productId={currentId}
                  variants={detail.variants}
                  onVariantsChanged={async () => {
                    const res = await fetchAdminProduct(currentId);
                    setDetail(res.data as AdminProduct);
                    onChanged();
                  }}
                  onError={(msg) => setFormError(msg)}
                />
              )}
            </section>
          )}
        </div>
      )}
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Variant editor — inline rows with per-row save/delete (real API calls)
// ---------------------------------------------------------------------------

interface VariantDraft {
  key: string;
  id?: string;
  size: string;
  color: string;
  fabricType: string;
  sku: string;
  price: string;
  stockQuantity: string;
}

function VariantEditor({
  productId,
  variants,
  onVariantsChanged,
  onError,
}: {
  productId: string;
  variants: AdminVariant[];
  onVariantsChanged: () => Promise<void>;
  onError: (msg: string) => void;
}) {
  const [rows, setRows] = useState<VariantDraft[]>([]);
  const [busyKey, setBusyKey] = useState("");

  useEffect(() => {
    setRows(
      variants.map((v, i) => ({
        key: variantDraftKey(v, i),
        id: v.id,
        size: v.size || "",
        color: v.color || "",
        fabricType: v.fabricType || "",
        sku: v.sku || "",
        price: v.price !== null && v.price !== undefined ? String(Number(v.price)) : "",
        stockQuantity: String(v.stockQuantity ?? 0),
      }))
    );
  }, [variants]);

  const snapshots = useMemo(() => {
    const map = new Map<string, AdminVariant>();
    variants.forEach((v) => map.set(v.id, v));
    return map;
  }, [variants]);

  function isDirty(row: VariantDraft): boolean {
    if (!row.id) return true; // unsaved new row
    const orig = snapshots.get(row.id);
    if (!orig) return true;
    return (
      (row.size || null) !== orig.size ||
      (row.color || null) !== orig.color ||
      (row.fabricType || null) !== orig.fabricType ||
      row.sku.trim() !== orig.sku ||
      (row.price === "" ? null : Number(row.price)) !==
        (orig.price === null || orig.price === undefined
          ? null
          : Number(orig.price)) ||
      Number(row.stockQuantity || 0) !== orig.stockQuantity
    );
  }

  function patchRow(key: string, patch: Partial<VariantDraft>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => [
      ...prev,
      {
        key: `new-${Date.now()}`,
        size: "",
        color: "",
        fabricType: "",
        sku: "",
        price: "",
        stockQuantity: "0",
      },
    ]);
  }

  function toPayload(row: VariantDraft) {
    return {
      sku: row.sku.trim(),
      size: row.size.trim() || undefined,
      color: row.color.trim() || undefined,
      fabricType: row.fabricType.trim() || undefined,
      price:
        row.price === "" || row.price === null
          ? undefined
          : Number(row.price),
      stockQuantity:
        row.stockQuantity === "" ? undefined : Number(row.stockQuantity),
    };
  }

  async function saveRow(row: VariantDraft) {
    const payload = toPayload(row);
    if (!payload.sku) {
      onError("SKU is required for every variant.");
      return;
    }
    setBusyKey(row.key);
    onError("");
    try {
      if (row.id) {
        await updateAdminVariant(row.id, payload);
      } else {
        await createAdminVariant(productId, payload);
      }
      await onVariantsChanged();
    } catch (err: any) {
      onError(err.message || "Failed to save variant");
    } finally {
      setBusyKey("");
    }
  }

  async function removeRow(row: VariantDraft) {
    if (!row.id) {
      setRows((prev) => prev.filter((r) => r.key !== row.key));
      return;
    }
    if (!window.confirm(`Delete variant ${row.sku || row.id}?`)) return;
    setBusyKey(row.key);
    onError("");
    try {
      await deleteAdminVariant(row.id);
      await onVariantsChanged();
    } catch (err: any) {
      onError(err.message || "Failed to delete variant");
    } finally {
      setBusyKey("");
    }
  }

  const inputCell =
    "w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gray-500 transition";

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto border border-gray-800 rounded">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 text-xs uppercase border-b border-gray-800">
              <th className="px-3 py-2 font-semibold">Size</th>
              <th className="px-3 py-2 font-semibold">Color</th>
              <th className="px-3 py-2 font-semibold">Fabric</th>
              <th className="px-3 py-2 font-semibold">SKU *</th>
              <th className="px-3 py-2 font-semibold">Price (Rs)</th>
              <th className="px-3 py-2 font-semibold">Stock</th>
              <th className="px-3 py-2 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const dirty = isDirty(row);
              return (
                <tr
                  key={row.key}
                  className={`border-b border-gray-800/60 last:border-0 ${
                    row.id ? "" : "bg-gray-800/30"
                  }`}
                >
                  <td className="px-2 py-2">
                    <input
                      className={inputCell}
                      value={row.size}
                      onChange={(e) => patchRow(row.key, { size: e.target.value })}
                      placeholder="M"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      className={inputCell}
                      value={row.color}
                      onChange={(e) => patchRow(row.key, { color: e.target.value })}
                      placeholder="Black"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      className={inputCell}
                      value={row.fabricType}
                      onChange={(e) =>
                        patchRow(row.key, { fabricType: e.target.value })
                      }
                      placeholder="Cotton"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      className={inputCell}
                      value={row.sku}
                      onChange={(e) => patchRow(row.key, { sku: e.target.value })}
                      placeholder="TRD-M-BLK"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      className={inputCell}
                      value={row.price}
                      onChange={(e) => patchRow(row.key, { price: e.target.value })}
                      placeholder="auto"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      className={inputCell + " w-20"}
                      value={row.stockQuantity}
                      onChange={(e) =>
                        patchRow(row.key, { stockQuantity: e.target.value })
                      }
                    />
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => saveRow(row)}
                        disabled={busyKey !== "" || (!row.id && !dirty)}
                        aria-label={
                          row.id ? `Save variant ${row.sku || ""}` : "Add variant"
                        }
                        title={row.id ? "Save variant" : "Add variant"}
                        className="p-1.5 rounded border border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {busyKey === row.key ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : row.id ? (
                          <Pencil size={13} />
                        ) : (
                          <Plus size={13} />
                        )}
                      </button>
                      <button
                        onClick={() => removeRow(row)}
                        disabled={busyKey !== ""}
                        aria-label={
                          row.id ? `Delete variant ${row.sku || ""}` : "Discard row"
                        }
                        title={row.id ? "Delete variant" : "Discard"}
                        className="p-1.5 rounded border border-red-500/30 text-red-400 hover:bg-red-500/10 transition disabled:opacity-40"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-6 text-center text-gray-500 text-xs"
                >
                  <Boxes size={20} className="mx-auto mb-2 text-gray-600" />
                  No variants yet — add size/colour options below.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        onClick={addRow}
        className="text-xs text-gray-300 border border-gray-700 rounded px-3 py-1.5 hover:bg-gray-800 transition inline-flex items-center gap-1.5"
      >
        <Plus size={13} />
        Add Variant
      </button>
    </div>
  );
}

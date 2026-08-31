"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
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
  deleteAdminVariant,
} from "@/lib/admin-api";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  basePrice: number;
  isCustomizable: boolean;
  isActive: boolean;
  categoryId: string;
  category?: { id: string; name: string; slug: string };
  images: { id: string; url: string; altText?: string | null; displayOrder: number }[];
  variants: {
    id: string;
    size?: string | null;
    color?: string | null;
    fabricType?: string | null;
    sku: string;
    price?: number | null;
    stockQuantity: number;
  }[];
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(price: number): string {
  return `Rs. ${price.toLocaleString()}`;
}

function generateSKU(name: string, size?: string, color?: string): string {
  const prefix = name
    .substring(0, 3)
    .toUpperCase()
    .replace(/[^A-Z]/g, "X");
  const parts = [prefix];
  if (size) parts.push(size.replace(/\s+/g, ""));
  if (color) parts.push(color.substring(0, 3).toUpperCase());
  parts.push(Date.now().toString(36).toUpperCase());
  return parts.join("-");
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function AdminProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isAdmin } = useAuthStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [error, setError] = useState("");

  // Check if we should open edit form from URL params
  const editId = searchParams.get("edit");

  useEffect(() => {
    if (!isAuthenticated() || !isAdmin()) {
      router.replace("/admin/login");
      return;
    }
    loadProducts();
    loadCategories();
  }, []);

  useEffect(() => {
    if (editId && categories.length > 0) {
      openEditForm(editId);
    }
  }, [editId, categories]);

  async function loadProducts(page = 1, searchQuery?: string) {
    try {
      setLoading(true);
      const res = await fetchAdminProducts({
        page,
        limit: 20,
        search: searchQuery || undefined,
        includeInactive: true,
      });
      setProducts(res.data);
      setPagination(res.pagination);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadCategories() {
    try {
      const res = await fetchCategories();
      setCategories(res.data);
    } catch {
      // Non-critical — form just won't have category options
    }
  }

  async function openEditForm(productId: string) {
    try {
      const res = await fetchAdminProduct(productId);
      setEditingProduct(res.data);
      setShowForm(true);
    } catch (err: any) {
      setError(err.message);
    }
  }

  function openCreateForm() {
    setEditingProduct(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingProduct(null);
    router.replace("/admin/products");
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    loadProducts(1, search);
  }

  if (showForm) {
    return (
      <ProductForm
        product={editingProduct}
        categories={categories}
        onClose={closeForm}
        onSaved={() => {
          closeForm();
          loadProducts(pagination.page, search);
        }}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl text-foreground tracking-wide">
            Products
          </h1>
          <p className="font-body text-sm text-muted mt-1">
            {pagination.total} product{pagination.total !== 1 ? "s" : ""} total
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={openCreateForm}>
          + New Product
        </Button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
        <Input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button type="submit" variant="filled" size="sm">
          Search
        </Button>
        {search && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              loadProducts(1);
            }}
            className="font-body text-sm text-muted hover:text-foreground transition-colors px-3"
          >
            Clear
          </button>
        )}
      </form>

      {error && (
        <div className="mb-4 px-4 py-3 border border-red-500/50 bg-red-500/10 text-red-400 text-sm font-body">
          {error}
          <button
            onClick={() => { setError(""); loadProducts(); }}
            className="ml-3 underline hover:text-red-300"
          >
            Retry
          </button>
        </div>
      )}

      {/* Products Table */}
      {loading ? (
        <div className="py-12 text-center text-muted font-body text-sm tracking-wider uppercase">
          Loading products...
        </div>
      ) : products.length === 0 ? (
        <div className="py-12 text-center text-muted font-body text-sm border border-chrome-500 bg-surface">
          No products found.
        </div>
      ) : (
        <div className="border border-chrome-500 bg-surface overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-chrome-500">
                  <th className="px-6 py-3 text-left font-body text-xs text-muted tracking-wider uppercase">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left font-body text-xs text-muted tracking-wider uppercase">
                    Category
                  </th>
                  <th className="px-6 py-3 text-right font-body text-xs text-muted tracking-wider uppercase">
                    Price
                  </th>
                  <th className="px-6 py-3 text-right font-body text-xs text-muted tracking-wider uppercase">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-center font-body text-xs text-muted tracking-wider uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right font-body text-xs text-muted tracking-wider uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-chrome-500">
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-chrome-500/10 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-chrome-500 flex-shrink-0 overflow-hidden">
                          {product.images[0] ? (
                            <img
                              src={product.images[0].url}
                              alt={product.images[0].altText || product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted text-xs">
                              No img
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-body text-sm text-foreground truncate">
                            {product.name}
                          </p>
                          <p className="font-body text-xs text-muted truncate">
                            {product.variants.length} variant{product.variants.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-body text-sm text-muted">
                        {product.category?.name || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-body text-sm text-foreground">
                        {formatPrice(Number(product.basePrice))}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span
                        className={`font-body text-sm ${
                          product.variants.reduce((sum, v) => sum + v.stockQuantity, 0) === 0
                            ? "text-red-400"
                            : product.variants.reduce((sum, v) => sum + v.stockQuantity, 0) < 5
                            ? "text-amber-400"
                            : "text-foreground"
                        }`}
                      >
                        {product.variants.reduce((sum, v) => sum + v.stockQuantity, 0)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`font-body text-xs px-2 py-1 border ${
                          product.isActive
                            ? "text-emerald-400 border-emerald-400/30"
                            : "text-red-400 border-red-400/30"
                        }`}
                      >
                        {product.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditForm(product.id)}
                          className="font-body text-xs text-muted hover:text-foreground transition-colors px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chrome-300"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          className="font-body text-xs text-red-400 hover:text-red-300 transition-colors px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-chrome-500">
            {products.map((product) => (
              <div key={product.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-chrome-500 flex-shrink-0 overflow-hidden">
                    {product.images[0] ? (
                      <img
                        src={product.images[0].url}
                        alt={product.images[0].altText || product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted text-xs">
                        No img
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm text-foreground">{product.name}</p>
                    <p className="font-body text-xs text-muted mt-0.5">
                      {product.category?.name || "—"} · {formatPrice(Number(product.basePrice))}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`font-body text-xs px-2 py-0.5 border ${
                          product.isActive
                            ? "text-emerald-400 border-emerald-400/30"
                            : "text-red-400 border-red-400/30"
                        }`}
                      >
                        {product.isActive ? "Active" : "Inactive"}
                      </span>
                      <span className="font-body text-xs text-muted">
                        Stock: {product.variants.reduce((s, v) => s + v.stockQuantity, 0)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => openEditForm(product.id)}
                      className="font-body text-xs text-muted hover:text-foreground transition-colors px-2 py-1"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product)}
                      className="font-body text-xs text-red-400 hover:text-red-300 transition-colors px-2 py-1"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
            (page) => (
              <button
                key={page}
                onClick={() => loadProducts(page, search)}
                className={`px-3 py-1 font-body text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chrome-300 ${
                  page === pagination.page
                    ? "bg-chrome-500 text-foreground"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {page}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );

  // ---------------------------------------------------------------------------
  // Delete handler (inline to access state)
  // ---------------------------------------------------------------------------

  async function handleDelete(product: Product) {
    if (!confirm(`Deactivate "${product.name}"? It will be hidden from the shop but not permanently deleted.`)) {
      return;
    }
    try {
      await deleteAdminProduct(product.id);
      loadProducts(pagination.page, search);
    } catch (err: any) {
      setError(err.message);
    }
  }
}

// ===========================================================================
// PRODUCT FORM (Create / Edit)
// ===========================================================================

function ProductForm({
  product,
  categories,
  onClose,
  onSaved,
}: {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEditing = !!product;

  // Form state
  const [name, setName] = useState(product?.name || "");
  const [description, setDescription] = useState(product?.description || "");
  const [basePrice, setBasePrice] = useState(product?.basePrice?.toString() || "");
  const [categoryId, setCategoryId] = useState(product?.categoryId || (categories[0]?.id || ""));
  const [isCustomizable, setIsCustomizable] = useState(product?.isCustomizable || false);
  const [isActive, setIsActive] = useState(product?.isActive ?? true);

  // Variants state
  const [variants, setVariants] = useState<
    { id?: string; size: string; color: string; sku: string; price: string; stockQuantity: string; isNew?: boolean }[]
  >(
    product?.variants.map((v) => ({
      id: v.id,
      size: v.size || "",
      color: v.color || "",
      sku: v.sku,
      price: v.price?.toString() || "",
      stockQuantity: v.stockQuantity.toString(),
    })) || []
  );

  // Images state
  const [images, setImages] = useState(product?.images || []);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const data = {
        name,
        description: description || undefined,
        basePrice: Number(basePrice),
        categoryId,
        isCustomizable,
        isActive,
        variants: variants.map((v) => ({
          size: v.size || undefined,
          color: v.color || undefined,
          sku: v.sku,
          price: v.price ? Number(v.price) : undefined,
          stockQuantity: v.stockQuantity ? Number(v.stockQuantity) : 0,
        })),
      };

      if (isEditing) {
        // Update product info (without variants — those are managed separately)
        await updateAdminProduct(product.id, {
          name,
          description: description || undefined,
          basePrice: Number(basePrice),
          categoryId,
          isCustomizable,
          isActive,
        });

        // Create new variants
        for (const v of variants) {
          if (v.isNew) {
            await createAdminVariant(product.id, {
              size: v.size || undefined,
              color: v.color || undefined,
              sku: v.sku,
              price: v.price ? Number(v.price) : undefined,
              stockQuantity: v.stockQuantity ? Number(v.stockQuantity) : 0,
            });
          }
        }
      } else {
        await createAdminProduct(data);
      }

      onSaved();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function addVariant() {
    setVariants([
      ...variants,
      { size: "", color: "", sku: generateSKU(name), price: basePrice, stockQuantity: "0", isNew: true },
    ]);
  }

  function removeVariant(index: number) {
    setVariants(variants.filter((_, i) => i !== index));
  }

  function updateVariant(index: number, field: string, value: string) {
    setVariants(
      variants.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    );
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !product) return;

    setUploadingImage(true);
    try {
      const res = await uploadProductImage(product.id, file, name);
      setImages([...images, res.data]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleDeleteImage(imageId: string) {
    if (!product) return;
    try {
      await deleteProductImage(product.id, imageId);
      setImages(images.filter((img) => img.id !== imageId));
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-foreground tracking-wide">
          {isEditing ? "Edit Product" : "New Product"}
        </h1>
        <button
          onClick={onClose}
          className="font-body text-sm text-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chrome-300 px-3 py-1"
        >
          ← Back to Products
        </button>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 border border-red-500/50 bg-red-500/10 text-red-400 text-sm font-body">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="border border-chrome-500 bg-surface p-6 space-y-4">
          <h2 className="font-display text-lg text-foreground mb-4">Basic Info</h2>

          <div>
            <label className="block font-body text-xs text-muted mb-2 tracking-wider uppercase">
              Name *
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Classic Oxford Shirt"
              required
            />
          </div>

          <div>
            <label className="block font-body text-xs text-muted mb-2 tracking-wider uppercase">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-surface border border-chrome-500 px-4 py-2 text-sm text-foreground placeholder-muted focus:outline-none focus:border-chrome-300 focus-visible:ring-2 focus-visible:ring-chrome-300 focus-visible:ring-offset-2 focus-visible:ring-offset-surface transition-colors resize-none font-body"
              placeholder="Premium cotton oxford shirt..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-body text-xs text-muted mb-2 tracking-wider uppercase">
                Base Price (Rs.) *
              </label>
              <Input
                type="number"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                placeholder="4500"
                min="0"
                step="1"
                required
              />
            </div>

            <div>
              <label className="block font-body text-xs text-muted mb-2 tracking-wider uppercase">
                Category *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="w-full bg-surface border border-chrome-500 px-4 py-2 text-sm text-foreground focus:outline-none focus:border-chrome-300 focus-visible:ring-2 focus-visible:ring-chrome-300 focus-visible:ring-offset-2 focus-visible:ring-offset-surface transition-colors font-body"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isEditing && (
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 accent-chrome-300"
                />
                <span className="font-body text-sm text-foreground">Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isCustomizable}
                  onChange={(e) => setIsCustomizable(e.target.checked)}
                  className="w-4 h-4 accent-chrome-300"
                />
                <span className="font-body text-sm text-foreground">Customizable</span>
              </label>
            </div>
          )}
        </div>

        {/* Variants */}
        <div className="border border-chrome-500 bg-surface p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg text-foreground">Variants</h2>
            <button
              type="button"
              onClick={addVariant}
              className="font-body text-xs text-muted hover:text-foreground transition-colors tracking-wider uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chrome-300 px-2 py-1"
            >
              + Add Variant
            </button>
          </div>

          {variants.length === 0 ? (
            <p className="font-body text-sm text-muted py-4">
              No variants yet. Click &quot;Add Variant&quot; to create size/color options.
            </p>
          ) : (
            <div className="space-y-3">
              {variants.map((variant, index) => (
                <div
                  key={index}
                  className="grid grid-cols-2 sm:grid-cols-5 gap-3 items-end p-3 border border-chrome-500/50"
                >
                  <div>
                    <label className="block font-body text-xs text-muted mb-1">Size</label>
                    <Input
                      type="text"
                      value={variant.size}
                      onChange={(e) => updateVariant(index, "size", e.target.value)}
                      placeholder="e.g. M"
                    />
                  </div>
                  <div>
                    <label className="block font-body text-xs text-muted mb-1">Color</label>
                    <Input
                      type="text"
                      value={variant.color}
                      onChange={(e) => updateVariant(index, "color", e.target.value)}
                      placeholder="e.g. Navy"
                    />
                  </div>
                  <div>
                    <label className="block font-body text-xs text-muted mb-1">SKU *</label>
                    <Input
                      type="text"
                      value={variant.sku}
                      onChange={(e) => updateVariant(index, "sku", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-body text-xs text-muted mb-1">Stock</label>
                    <Input
                      type="number"
                      value={variant.stockQuantity}
                      onChange={(e) => updateVariant(index, "stockQuantity", e.target.value)}
                      min="0"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="font-body text-xs text-red-400 hover:text-red-300 transition-colors px-2 py-2"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Images (edit mode only) */}
        {isEditing && (
          <div className="border border-chrome-500 bg-surface p-6">
            <h2 className="font-display text-lg text-foreground mb-4">Images</h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {images.map((img) => (
                <div key={img.id} className="relative group">
                  <img
                    src={img.url}
                    alt={img.altText || name}
                    className="w-full aspect-square object-cover border border-chrome-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteImage(img.id)}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500/80 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <label className="inline-block">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploadingImage}
              />
              <span className="font-body text-xs text-muted hover:text-foreground transition-colors border border-chrome-500 px-4 py-2 cursor-pointer inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chrome-300">
                {uploadingImage ? "Uploading..." : "+ Upload Image"}
              </span>
            </label>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? "Saving..." : isEditing ? "Save Changes" : "Create Product"}
          </Button>
          <button
            type="button"
            onClick={onClose}
            className="font-body text-sm text-muted hover:text-foreground transition-colors px-4 py-2"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

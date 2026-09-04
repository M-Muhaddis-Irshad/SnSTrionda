"use client";

// =============================================================================
// Admin Categories — full management wired to the real backend endpoints:
//   GET    /api/admin/categories   (flat w/ parentId + product/child counts)
//   POST   /api/admin/categories
//   PUT    /api/admin/categories/:categoryId
//   DELETE /api/admin/categories/:categoryId
// The API returns a flat list with parentId, so nesting is resolved
// client-side and rendered as an indented tree.
// =============================================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import { FolderTree, Plus, Pencil, Trash2, Search, Loader2, ChevronRight } from "lucide-react";
import Modal, {
  inputCls,
  btnPrimaryCls,
  btnSecondaryCls,
  btnDangerCls,
  fieldErrorCls,
} from "@/app/admin/media/components/Modal";
import {
  fetchCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
} from "@/lib/admin-api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  active: boolean;
  parentId: string | null;
  createdAt: string;
  _count?: { products: number; children: number };
}

interface TreeNode {
  cat: AdminCategory;
  depth: number;
}

interface TreeBranch {
  node: TreeNode;
  kids: TreeBranch[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildTree(list: AdminCategory[]): TreeBranch[] {
  const childrenOf = new Map<string | null, AdminCategory[]>();
  list.forEach((c) => {
    const key = c.parentId && list.some((x) => x.id === c.parentId) ? c.parentId : null;
    if (!childrenOf.has(key)) childrenOf.set(key, []);
    childrenOf.get(key)!.push(c);
  });
  const byName = (a: AdminCategory, b: AdminCategory) => a.name.localeCompare(b.name);
  childrenOf.forEach((arr) => arr.sort(byName));

  function walk(parentId: string | null, depth: number): TreeBranch[] {
    return (childrenOf.get(parentId) || []).map((cat) => ({
      node: { cat, depth },
      kids: walk(cat.id, depth + 1),
    }));
  }
  return walk(null, 0);
}

function collectDescendants(list: AdminCategory[], rootId: string): Set<string> {
  const out = new Set<string>();
  const pending = [rootId];
  while (pending.length) {
    const id = pending.pop()!;
    list
      .filter((c) => c.parentId === id)
      .forEach((c) => {
        out.add(c.id);
        pending.push(c.id);
      });
  }
  return out;
}

// Flatten a tree (optional search keeps matching nodes + their ancestors)
function flatten(branches: TreeBranch[], query: string): TreeNode[] {
  const q = query.trim().toLowerCase();
  const out: TreeNode[] = [];
  const pushBranch = (branch: TreeBranch, inheritedMatch: boolean): boolean => {
    const selfMatch =
      !q ||
      branch.node.cat.name.toLowerCase().includes(q) ||
      branch.node.cat.slug.toLowerCase().includes(q);
    const childMatch = branch.kids.some((k) => pushBranch(k, selfMatch));
    if (selfMatch || childMatch || inheritedMatch) out.push(branch.node);
    return selfMatch || childMatch;
  };
  branches.forEach((b) => pushBranch(b, false));
  return out;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CategoriesPage() {
  const [cats, setCats] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const [modal, setModal] = useState<{ mode: "create" } | { mode: "edit"; cat: AdminCategory } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminCategory | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetchCategories();
      setCats(res.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(() => flatten(buildTree(cats), query), [cats, query]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await deleteAdminCategory(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (err: any) {
      // Surface the 400 "has N products/children" message inline, don't
      // close the confirm silently.
      setDeleteError(err.message || "Failed to delete category");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-white">Categories</h1>
          <p className="text-sm text-gray-500 mt-1">
            Organise the catalog as a nested tree. Categories with products or
            sub-categories can&apos;t be deleted.
          </p>
        </div>
        <button
          onClick={() => setModal({ mode: "create" })}
          className={btnPrimaryCls + " flex items-center gap-2"}
        >
          <Plus size={16} />
          Add Category
        </button>
      </div>

      {/* Search */}
      <div className="relative sm:max-w-md">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search categories…"
          className={inputCls + " pl-9"}
        />
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
            Loading categories…
          </div>
        ) : rows.length === 0 ? (
          <div className="text-gray-400 text-center py-16">
            <FolderTree size={32} className="mx-auto mb-3 text-gray-600" />
            <p>
              {cats.length === 0
                ? "No categories yet. Click “Add Category” to create your first one."
                : "No categories match the current search."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 text-xs uppercase border-b border-gray-800">
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Products</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ cat, depth }) => {
                  const hasKids = cat._count && cat._count.children > 0;
                  return (
                    <tr
                      key={cat.id}
                      className="border-b border-gray-800/60 hover:bg-gray-800/40 transition"
                    >
                      <td className="px-4 py-3">
                        <div
                          className="flex items-center gap-2 min-w-0"
                          style={{ paddingLeft: depth * 24 }}
                        >
                          {hasKids ? (
                            <ChevronRight size={13} className="text-gray-600 shrink-0" />
                          ) : (
                            <span className="w-[13px] shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="text-white font-medium truncate">{cat.name}</p>
                            <p className="text-xs text-gray-500 truncate">/{cat.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded border ${
                            cat._count && cat._count.products > 0
                              ? "bg-white/10 text-white border-white/20"
                              : "text-gray-500 border-gray-700"
                          }`}
                        >
                          {cat._count?.products ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-1 rounded border ${
                            cat.active
                              ? "bg-green-500/10 text-green-400 border-green-500/30"
                              : "bg-gray-800 text-gray-500 border-gray-700"
                          }`}
                        >
                          {cat.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => setModal({ mode: "edit", cat })}
                            aria-label={`Edit category ${cat.name}`}
                            title="Edit"
                            className="p-2 rounded border border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white transition"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => {
                              setDeleteTarget(cat);
                              setDeleteError("");
                            }}
                            aria-label={`Delete category ${cat.name}`}
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

      {/* ── Create / Edit modal ── */}
      {modal && (
        <CategoryFormModal
          mode={modal.mode}
          editing={modal.mode === "edit" ? modal.cat : null}
          all={cats}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}

      {/* ── Delete confirm — keeps 400 errors visible inline ── */}
      {deleteTarget && (
        <Modal
          title={`Delete ${deleteTarget.name}`}
          onClose={() => {
            if (!deleting) setDeleteTarget(null);
          }}
        >
          <p className="text-sm text-gray-300 mb-1">
            Delete category{" "}
            <span className="text-white font-semibold">{deleteTarget.name}</span>?
          </p>
          <p className="text-xs text-gray-500 mb-4">
            Categories that still have products or sub-categories cannot be
            deleted.
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
              {deleting ? "Deleting…" : "Delete Category"}
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

interface CategoryFormModalProps {
  mode: "create" | "edit";
  editing: AdminCategory | null;
  all: AdminCategory[];
  onClose: () => void;
  onSaved: () => void;
}

function CategoryFormModal({ mode, editing, all, onClose, onSaved }: CategoryFormModalProps) {
  const [name, setName] = useState(editing?.name || "");
  const [slug, setSlug] = useState(editing?.slug || "");
  const [description, setDescription] = useState(editing?.description || "");
  const [parentId, setParentId] = useState(editing?.parentId || "");
  const [active, setActive] = useState(editing ? editing.active : true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Parent options: all categories except self + descendants (prevents cycles).
  const blocked = useMemo(() => {
    if (!editing) return new Set<string>();
    return collectDescendants(all, editing.id);
  }, [all, editing]);

  const treeOptions = useMemo(() => {
    const out: TreeNode[] = [];
    const walk = (branches: TreeBranch[]) => {
      branches.forEach((b) => {
        out.push(b.node);
        walk(b.kids);
      });
    };
    walk(buildTree(all));
    return out;
  }, [all]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        slug: slug.trim() || undefined,
        description: description.trim() || undefined,
        parentId: parentId || undefined,
        active,
      };
      if (mode === "create") {
        await createAdminCategory(payload);
      } else if (editing) {
        await updateAdminCategory(editing.id, payload);
      }
      onClose();
      onSaved();
    } catch (err: any) {
      setFormError(err.message || "Failed to save category");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={mode === "create" ? "Add Category" : `Edit ${editing?.name || "Category"}`}
      onClose={() => {
        if (!saving) onClose();
      }}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs uppercase text-gray-500 font-bold mb-1.5">
            Name *
          </label>
          <input
            type="text"
            className={inputCls}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Luxury Formals"
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
            placeholder={mode === "create" ? "auto-generated from name (leave blank)" : editing?.slug}
          />
          {mode === "create" && !slug.trim() && (
            <p className="text-xs text-gray-500 mt-1">
              Leave blank to auto-generate from the name.
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs uppercase text-gray-500 font-bold mb-1.5">
            Description
          </label>
          <textarea
            className={inputCls + " min-h-[70px] resize-y"}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description shown with the category"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase text-gray-500 font-bold mb-1.5">
              Parent Category
            </label>
            <select
              className={inputCls}
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
            >
              <option value="">— Top level —</option>
              {treeOptions
                .filter((o) => !blocked.has(o.cat.id))
                .map((o) => (
                  <option key={o.cat.id} value={o.cat.id}>
                    {"\u00A0".repeat(o.depth * 2)}
                    {o.depth > 0 ? "↳ " : ""}
                    {o.cat.name}
                  </option>
                ))}
            </select>
            {mode === "edit" && (
              <p className="text-xs text-gray-500 mt-1">
                Sub-categories can&apos;t be reparented under their own children.
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs uppercase text-gray-500 font-bold mb-1.5">
              Status
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-300 pt-1">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="accent-white"
              />
              Active (shown on storefront)
            </label>
          </div>
        </div>

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
            {saving ? "Saving…" : mode === "create" ? "Create Category" : "Save Changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

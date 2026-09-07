"use client";

// =============================================================================
// Admin Discounts — full management wired to the real backend endpoints:
//   GET    /api/admin/discounts
//   POST   /api/admin/discounts
//   PUT    /api/admin/discounts/:discountId
//   DELETE /api/admin/discounts/:discountId
// A discount attaches to ONE product and is shown on the storefront as a sale
// badge + discounted price while it is active and within its date window.
// =============================================================================

import { useCallback, useEffect, useState } from "react";
import { Percent, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import Modal, {
  inputCls,
  btnPrimaryCls,
  btnSecondaryCls,
  btnDangerCls,
  fieldErrorCls,
} from "@/app/admin/media/components/Modal";
import {
  fetchAdminDiscounts,
  createAdminDiscount,
  updateAdminDiscount,
  deleteAdminDiscount,
  fetchAdminProducts,
} from "@/lib/admin-api";
import { toDateTimeLocal, fromDateTimeLocal, formatDate, isPast } from "@/lib/dateInput";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AdminDiscountProduct {
  id: string;
  name: string;
  slug: string;
  basePrice: number | string;
}

interface AdminDiscount {
  id: string;
  name: string;
  type: "PERCENT" | "FLAT";
  value: number | string;
  productId: string;
  product: AdminDiscountProduct | null;
  startsAt: string | null;
  expiresAt: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PickableProduct {
  id: string;
  name: string;
  basePrice: number | string;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<AdminDiscount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modal, setModal] = useState<{ mode: "create" } | { mode: "edit"; discount: AdminDiscount } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminDiscount | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetchAdminDiscounts();
      setDiscounts(res.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load discounts");
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
      await deleteAdminDiscount(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete discount");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-white">Discounts</h1>
          <p className="text-sm text-gray-500 mt-1">
            Put individual products on sale — shown as a discounted price with a
            sale badge on the storefront.
          </p>
        </div>
        <button
          onClick={() => setModal({ mode: "create" })}
          className={btnPrimaryCls + " flex items-center gap-2"}
        >
          <Plus size={16} />
          Add Discount
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
            Loading discounts…
          </div>
        ) : discounts.length === 0 ? (
          <div className="text-gray-400 text-center py-16">
            <Percent size={32} className="mx-auto mb-3 text-gray-600" />
            <p>No discounts yet. Click “Add Discount” to put a product on sale.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 text-xs uppercase border-b border-gray-800">
                  <th className="px-4 py-3 font-semibold">Product</th>
                  <th className="px-4 py-3 font-semibold">Discount</th>
                  <th className="px-4 py-3 font-semibold">Window</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {discounts.map((d) => {
                  const disabled = !d.active || isPast(d.expiresAt);
                  const isLive =
                    d.active &&
                    !isPast(d.expiresAt) &&
                    !(d.startsAt && new Date(d.startsAt).getTime() > Date.now());
                  return (
                    <tr
                      key={d.id}
                      className={`border-b border-gray-800/60 hover:bg-gray-800/40 transition ${
                        disabled ? "opacity-50" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="min-w-0">
                          <p className="text-white font-medium truncate max-w-[260px]">
                            {d.product?.name || "—"}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {d.product ? `/${d.product.slug}` : "Product removed"}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-white font-medium">
                            {d.type === "PERCENT"
                              ? `${Number(d.value)}% off`
                              : `Rs. ${Number(d.value).toLocaleString("en-PK")} off`}
                          </p>
                          {d.product && (
                            <p className="text-xs text-gray-500">
                              {d.name}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                        {d.startsAt || d.expiresAt ? (
                          <>
                            {d.startsAt ? formatDate(d.startsAt) : "anytime"}
                            {" → "}
                            {d.expiresAt ? formatDate(d.expiresAt) : "never"}
                          </>
                        ) : (
                          "No expiry"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-1 rounded border ${
                            isLive
                              ? "bg-green-500/10 text-green-400 border-green-500/30"
                              : "bg-gray-800 text-gray-500 border-gray-700"
                          }`}
                        >
                          {!d.active
                            ? "Inactive"
                            : isPast(d.expiresAt)
                              ? "Expired"
                              : "Live"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => setModal({ mode: "edit", discount: d })}
                            aria-label={`Edit discount on ${d.product?.name || d.name}`}
                            title="Edit"
                            className="p-2 rounded border border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white transition"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => {
                              setDeleteTarget(d);
                              setDeleteError("");
                            }}
                            aria-label={`Delete discount ${d.name}`}
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

      {modal && (
        <DiscountFormModal
          mode={modal.mode}
          editing={modal.mode === "edit" ? modal.discount : null}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}

      {deleteTarget && (
        <Modal
          title="Delete Discount"
          onClose={() => {
            if (!deleting) setDeleteTarget(null);
          }}
        >
          <p className="text-sm text-gray-300 mb-1">
            Delete the discount on{" "}
            <span className="text-white font-semibold">
              {deleteTarget.product?.name || deleteTarget.name}
            </span>
            ?
          </p>
          <p className="text-xs text-gray-500 mb-4">
            The product returns to its regular price on the storefront.
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
              {deleting ? "Deleting…" : "Delete Discount"}
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

function DiscountFormModal({
  mode,
  editing,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  editing: AdminDiscount | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [products, setProducts] = useState<PickableProduct[]>([]);
  const [productId, setProductId] = useState(editing?.productId || "");
  const [name, setName] = useState(editing?.name || "");
  const [type, setType] = useState<"PERCENT" | "FLAT">(editing?.type || "PERCENT");
  const [value, setValue] = useState(editing ? String(Number(editing.value)) : "");
  const [startsAt, setStartsAt] = useState(toDateTimeLocal(editing?.startsAt || null));
  const [expiresAt, setExpiresAt] = useState(toDateTimeLocal(editing?.expiresAt || null));
  const [active, setActive] = useState(editing ? editing.active : true);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchAdminProducts({ limit: 100 })
      .then((res) => {
        if (cancelled) return;
        setProducts((res.data || []).map((p: any) => ({ id: p.id, name: p.name, basePrice: p.basePrice })));
        if (!cancelled && !productId && res.data?.length === 1) {
          setProductId(res.data[0].id);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        type,
        value: Number(value),
        productId,
        startsAt: fromDateTimeLocal(startsAt) || undefined,
        expiresAt: fromDateTimeLocal(expiresAt) || undefined,
        active,
      };
      if (mode === "create") {
        await createAdminDiscount(payload);
      } else if (editing) {
        await updateAdminDiscount(editing.id, payload);
      }
      onClose();
      onSaved();
    } catch (err: any) {
      setFormError(err.message || "Failed to save discount");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={mode === "create" ? "Add Discount" : "Edit Discount"}
      onClose={() => {
        if (!saving) onClose();
      }}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs uppercase text-gray-500 font-bold mb-1.5">
            Product *
          </label>
          <select
            className={inputCls}
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            required
          >
            <option value="">Select product…</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — Rs. {Number(p.basePrice).toLocaleString("en-PK")}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Shows the first 100 active products. Only one discount is applied per
            product at a time.
          </p>
        </div>

        <div>
          <label className="block text-xs uppercase text-gray-500 font-bold mb-1.5">
            Label
          </label>
          <input
            type="text"
            className={inputCls}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Festive Sale"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase text-gray-500 font-bold mb-1.5">
              Discount Type
            </label>
            <select
              className={inputCls}
              value={type}
              onChange={(e) => setType(e.target.value as "PERCENT" | "FLAT")}
            >
              <option value="PERCENT">Percentage (%)</option>
              <option value="FLAT">Fixed amount (Rs)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs uppercase text-gray-500 font-bold mb-1.5">
              {type === "PERCENT" ? "Percent Off *" : "Amount Off (Rs) *"}
            </label>
            <input
              type="number"
              min="0"
              max={type === "PERCENT" ? 100 : undefined}
              step="any"
              className={inputCls}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={type === "PERCENT" ? "15" : "1000"}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase text-gray-500 font-bold mb-1.5">
              Starts
            </label>
            <input
              type="datetime-local"
              className={inputCls}
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs uppercase text-gray-500 font-bold mb-1.5">
              Expires
            </label>
            <input
              type="datetime-local"
              className={inputCls}
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
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
            {saving ? "Saving…" : mode === "create" ? "Create Discount" : "Save Changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

"use client";

// =============================================================================
// Admin Coupons — full management wired to the real backend endpoints:
//   GET    /api/admin/coupons
//   POST   /api/admin/coupons
//   PUT    /api/admin/coupons/:couponId
//   DELETE /api/admin/coupons/:couponId
// Coupons are validated live at checkout (percent or flat, with a date window,
// minimum order, usage limit and per-user limit).
// =============================================================================

import { useCallback, useEffect, useState } from "react";
import { Ticket, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import Modal, {
  inputCls,
  btnPrimaryCls,
  btnSecondaryCls,
  btnDangerCls,
  fieldErrorCls,
} from "@/app/admin/media/components/Modal";
import {
  fetchAdminCoupons,
  createAdminCoupon,
  updateAdminCoupon,
  deleteAdminCoupon,
} from "@/lib/admin-api";
import {
  toDateTimeLocal,
  fromDateTimeLocal,
  formatDate,
  isPast,
} from "@/lib/dateInput";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AdminCoupon {
  id: string;
  code: string;
  description: string | null;
  type: "PERCENT" | "FLAT";
  value: number | string;
  minOrder: number | string | null;
  maxDiscount: number | string | null;
  usageLimit: number | null;
  perUserLimit: number | null;
  usedCount: number;
  startsAt: string | null;
  expiresAt: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modal, setModal] = useState<{ mode: "create" } | { mode: "edit"; coupon: AdminCoupon } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminCoupon | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetchAdminCoupons();
      setCoupons(res.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load coupons");
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
      await deleteAdminCoupon(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete coupon");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-white">Coupons</h1>
          <p className="text-sm text-gray-500 mt-1">
            Promo codes customers can apply at checkout — percent or flat,
            with date windows and usage limits.
          </p>
        </div>
        <button
          onClick={() => setModal({ mode: "create" })}
          className={btnPrimaryCls + " flex items-center gap-2"}
        >
          <Plus size={16} />
          Add Coupon
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
            Loading coupons…
          </div>
        ) : coupons.length === 0 ? (
          <div className="text-gray-400 text-center py-16">
            <Ticket size={32} className="mx-auto mb-3 text-gray-600" />
            <p>No coupons yet. Click “Add Coupon” to create your first one.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 text-xs uppercase border-b border-gray-800">
                  <th className="px-4 py-3 font-semibold">Code</th>
                  <th className="px-4 py-3 font-semibold">Discount</th>
                  <th className="px-4 py-3 font-semibold">Min Order</th>
                  <th className="px-4 py-3 font-semibold">Valid</th>
                  <th className="px-4 py-3 font-semibold">Used</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => {
                  const expired = isPast(c.expiresAt);
                  const disabled = !c.active || expired;
                  return (
                    <tr
                      key={c.id}
                      className={`border-b border-gray-800/60 hover:bg-gray-800/40 transition ${
                        disabled ? "opacity-50" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="min-w-0">
                          <p className="text-white font-medium">{c.code}</p>
                          {c.description && (
                            <p className="text-xs text-gray-500 truncate max-w-[220px]">
                              {c.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                        {c.type === "PERCENT"
                          ? `${Number(c.value)}% off`
                          : `Rs. ${Number(c.value).toLocaleString("en-PK")} off`}
                        {c.type === "PERCENT" && c.maxDiscount !== null && (
                          <span className="text-xs text-gray-500 block">
                            cap Rs. {Number(c.maxDiscount).toLocaleString("en-PK")}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                        {c.minOrder !== null
                          ? `Rs. ${Number(c.minOrder).toLocaleString("en-PK")}`
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                        {c.startsAt || c.expiresAt ? (
                          <>
                            {c.startsAt ? formatDate(c.startsAt) : "anytime"}
                            {" → "}
                            {c.expiresAt ? formatDate(c.expiresAt) : "never"}
                          </>
                        ) : (
                          "No expiry"
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                        {c.usedCount.toLocaleString("en-PK")}
                        {c.usageLimit !== null && c.usageLimit !== undefined
                          ? ` / ${c.usageLimit.toLocaleString("en-PK")}`
                          : ""}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-1 rounded border ${
                            !disabled
                              ? "bg-green-500/10 text-green-400 border-green-500/30"
                              : "bg-gray-800 text-gray-500 border-gray-700"
                          }`}
                        >
                          {expired
                            ? "Expired"
                            : c.active
                              ? "Active"
                              : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => setModal({ mode: "edit", coupon: c })}
                            aria-label={`Edit coupon ${c.code}`}
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
                            aria-label={`Delete coupon ${c.code}`}
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
        <CouponFormModal
          mode={modal.mode}
          editing={modal.mode === "edit" ? modal.coupon : null}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}

      {deleteTarget && (
        <Modal
          title={`Delete ${deleteTarget.code}`}
          onClose={() => {
            if (!deleting) setDeleteTarget(null);
          }}
        >
          <p className="text-sm text-gray-300 mb-1">
            Delete coupon{" "}
            <span className="text-white font-semibold">{deleteTarget.code}</span>?
          </p>
          <p className="text-xs text-gray-500 mb-4">
            Customers will no longer be able to apply this code at checkout.
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
              {deleting ? "Deleting…" : "Delete Coupon"}
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

function CouponFormModal({
  mode,
  editing,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  editing: AdminCoupon | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [code, setCode] = useState(editing?.code || "");
  const [description, setDescription] = useState(editing?.description || "");
  const [type, setType] = useState<"PERCENT" | "FLAT">(editing?.type || "PERCENT");
  const [value, setValue] = useState(editing ? String(Number(editing.value)) : "");
  const [minOrder, setMinOrder] = useState(
    editing?.minOrder !== null && editing?.minOrder !== undefined ? String(Number(editing.minOrder)) : ""
  );
  const [maxDiscount, setMaxDiscount] = useState(
    editing?.maxDiscount !== null && editing?.maxDiscount !== undefined ? String(Number(editing.maxDiscount)) : ""
  );
  const [usageLimit, setUsageLimit] = useState(
    editing?.usageLimit !== null && editing?.usageLimit !== undefined ? String(editing.usageLimit) : ""
  );
  const [perUserLimit, setPerUserLimit] = useState(
    editing?.perUserLimit !== null && editing?.perUserLimit !== undefined ? String(editing.perUserLimit) : ""
  );
  const [startsAt, setStartsAt] = useState(toDateTimeLocal(editing?.startsAt || null));
  const [expiresAt, setExpiresAt] = useState(toDateTimeLocal(editing?.expiresAt || null));
  const [active, setActive] = useState(editing ? editing.active : true);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      const payload = {
        code: code.trim(),
        description: description.trim() || undefined,
        type,
        value: Number(value),
        minOrder: minOrder === "" ? undefined : Number(minOrder),
        maxDiscount: maxDiscount === "" ? undefined : Number(maxDiscount),
        usageLimit: usageLimit === "" ? undefined : Number(usageLimit),
        perUserLimit: perUserLimit === "" ? undefined : Number(perUserLimit),
        startsAt: fromDateTimeLocal(startsAt) || undefined,
        expiresAt: fromDateTimeLocal(expiresAt) || undefined,
        active,
      };
      if (mode === "create") {
        await createAdminCoupon(payload);
      } else if (editing) {
        await updateAdminCoupon(editing.id, payload);
      }
      onClose();
      onSaved();
    } catch (err: any) {
      setFormError(err.message || "Failed to save coupon");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={mode === "create" ? "Add Coupon" : `Edit ${editing?.code || "Coupon"}`}
      onClose={() => {
        if (!saving) onClose();
      }}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase text-gray-500 font-bold mb-1.5">
              Code *
            </label>
            <input
              type="text"
              className={inputCls}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. TRIONDA10"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Letters &amp; numbers — applied case-insensitively.
            </p>
          </div>
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
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              placeholder={type === "PERCENT" ? "10" : "500"}
              required
            />
          </div>
          <div>
            <label className="block text-xs uppercase text-gray-500 font-bold mb-1.5">
              Minimum Order (Rs)
            </label>
            <input
              type="number"
              min="0"
              step="any"
              className={inputCls}
              value={minOrder}
              onChange={(e) => setMinOrder(e.target.value)}
              placeholder="Optional — e.g. 3000"
            />
          </div>
          {type === "PERCENT" && (
            <div>
              <label className="block text-xs uppercase text-gray-500 font-bold mb-1.5">
                Max Discount Cap (Rs)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                className={inputCls}
                value={maxDiscount}
                onChange={(e) => setMaxDiscount(e.target.value)}
                placeholder="Optional — cap the rupee amount"
              />
            </div>
          )}
          <div>
            <label className="block text-xs uppercase text-gray-500 font-bold mb-1.5">
              Description
            </label>
            <input
              type="text"
              className={inputCls}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Internal note (shown to admins)"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase text-gray-500 font-bold mb-1.5">
              Total Usage Limit
            </label>
            <input
              type="number"
              min="1"
              className={inputCls}
              value={usageLimit}
              onChange={(e) => setUsageLimit(e.target.value)}
              placeholder="Unlimited"
            />
          </div>
          <div>
            <label className="block text-xs uppercase text-gray-500 font-bold mb-1.5">
              Per-User Limit
            </label>
            <input
              type="number"
              min="1"
              className={inputCls}
              value={perUserLimit}
              onChange={(e) => setPerUserLimit(e.target.value)}
              placeholder="Default: 1 per customer"
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
          Active (redeemable at checkout)
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
            {saving ? "Saving…" : mode === "create" ? "Create Coupon" : "Save Changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

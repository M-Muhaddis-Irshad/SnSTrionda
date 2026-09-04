"use client";

import { useCallback, useEffect, useState } from "react";
import { Star, Check, X, RotateCcw, Trash2, Eye } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import Modal, {
  btnPrimaryCls,
  btnSecondaryCls,
  btnDangerCls,
} from "@/app/admin/media/components/Modal";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Tab = "PENDING" | "APPROVED" | "REJECTED";

interface AdminReview {
  id: string;
  rating: number;
  title: string | null;
  comment: string;
  status: string;
  approvedAt: string | null;
  createdAt: string;
  user: { id: string; name: string | null; email: string };
  product: {
    id: string;
    name: string;
    slug: string;
    images: { url: string }[];
  };
  order: { orderNumber: string; status: string };
}

const TABS: { id: Tab; label: string }[] = [
  { id: "PENDING", label: "Pending" },
  { id: "APPROVED", label: "Approved" },
  { id: "REJECTED", label: "Rejected" },
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  APPROVED: "bg-green-500/10 text-green-400 border-green-500/30",
  REJECTED: "bg-red-500/10 text-red-400 border-red-500/30",
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={13}
          strokeWidth={1.5}
          className={
            rating >= star ? "fill-yellow-400 text-yellow-400" : "text-gray-600"
          }
        />
      ))}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AdminReviewsPage() {
  const [tab, setTab] = useState<Tab>("PENDING");
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [counts, setCounts] = useState<Record<Tab, number>>({
    PENDING: 0,
    APPROVED: 0,
    REJECTED: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewing, setViewing] = useState<AdminReview | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminReview | null>(null);

  const loadReviews = useCallback(async (status: Tab) => {
    try {
      setLoading(true);
      setError("");
      const result = await adminFetch<{ data: AdminReview[] }>(
        `/reviews?status=${status}`
      );
      setReviews(result.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load counts for all tabs + current tab
  const loadAll = useCallback(async () => {
    try {
      const [pending, approved, rejected] = await Promise.all([
        adminFetch<{ data: AdminReview[] }>("/reviews?status=PENDING"),
        adminFetch<{ data: AdminReview[] }>("/reviews?status=APPROVED"),
        adminFetch<{ data: AdminReview[] }>("/reviews?status=REJECTED"),
      ]);
      setCounts({
        PENDING: (pending.data || []).length,
        APPROVED: (approved.data || []).length,
        REJECTED: (rejected.data || []).length,
      });
    } catch {
      // counts are cosmetic
    }
  }, []);

  useEffect(() => {
    loadReviews(tab);
    loadAll();
  }, [tab, loadReviews, loadAll]);

  async function act(path: string, refresh = true) {
    setBusy(true);
    try {
      await adminFetch(path, { method: "PATCH" });
      setViewing(null);
      setDeleteTarget(null);
      if (refresh) {
        await loadReviews(tab);
        await loadAll();
      }
    } catch (err: any) {
      alert(err.message || "Action failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await adminFetch(`/reviews/${deleteTarget.id}`, { method: "DELETE" });
      setDeleteTarget(null);
      setViewing(null);
      await loadReviews(tab);
      await loadAll();
    } catch (err: any) {
      alert(err.message || "Failed to delete review");
    } finally {
      setBusy(false);
    }
  }

  const rowActionBtn =
    "inline-flex items-center justify-center p-2 rounded border transition disabled:opacity-50";

  const actions = (review: AdminReview) => {
    const approve = (
      <button
        key="approve"
        onClick={() => act(`/reviews/${review.id}/approve`)}
        disabled={busy}
        aria-label={`Approve review by ${review.user.name || review.user.email}`}
        title="Approve"
        className={`${rowActionBtn} bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20`}
      >
        <Check size={14} />
      </button>
    );
    const reject = (
      <button
        key="reject"
        onClick={() => act(`/reviews/${review.id}/reject`)}
        disabled={busy}
        aria-label={`Reject review by ${review.user.name || review.user.email}`}
        title="Reject"
        className={`${rowActionBtn} bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20`}
      >
        <X size={14} />
      </button>
    );
    const unapprove = (
      <button
        key="unapprove"
        onClick={() => act(`/reviews/${review.id}/unapprove`)}
        disabled={busy}
        aria-label={`Unapprove review by ${review.user.name || review.user.email}`}
        title="Unapprove"
        className={`${rowActionBtn} text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/10`}
      >
        <RotateCcw size={14} />
      </button>
    );
    const del = (
      <button
        key="delete"
        onClick={() => setDeleteTarget(review)}
        disabled={busy}
        aria-label={`Delete review by ${review.user.name || review.user.email}`}
        title="Delete"
        className={`${rowActionBtn} text-red-400 border-red-500/30 hover:bg-red-500/10`}
      >
        <Trash2 size={14} />
      </button>
    );
    switch (review.status) {
      case "PENDING":
        return [approve, reject, del];
      case "APPROVED":
        return [unapprove, del];
      default:
        return [approve, reject, del];
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-white">Reviews &amp; Testimonials</h1>
        <p className="text-sm text-gray-500 mt-1">
          Approve, reject or manage customer reviews before they appear on the storefront.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-800">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-semibold transition border-b-2 -mb-px flex items-center gap-2 ${
              tab === t.id
                ? "text-white border-white"
                : "text-gray-500 border-transparent hover:text-gray-300"
            }`}
          >
            {t.label}
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                counts[t.id] > 0
                  ? "bg-white text-black"
                  : "bg-gray-800 text-gray-500"
              }`}
            >
              {counts[t.id]}
            </span>
          </button>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        {loading ? (
          <div className="text-gray-400 text-center py-16">Loading reviews…</div>
        ) : reviews.length === 0 ? (
          <div className="text-gray-400 text-center py-16">
            <Star size={32} className="mx-auto mb-3 text-gray-600" />
            <p>No {tab.toLowerCase()} reviews.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 text-xs uppercase border-b border-gray-800">
                  <th className="px-4 py-3 font-semibold">User</th>
                  <th className="px-4 py-3 font-semibold">Product</th>
                  <th className="px-4 py-3 font-semibold">Rating</th>
                  <th className="px-4 py-3 font-semibold">Title</th>
                  <th className="px-4 py-3 font-semibold">Comment</th>
                  <th className="px-4 py-3 font-semibold">
                    {tab === "APPROVED" ? "Approved On" : tab === "REJECTED" ? "Rejected On" : "Submitted"}
                  </th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((review) => (
                  <tr
                    key={review.id}
                    className="border-b border-gray-800/60 hover:bg-gray-800/40 transition"
                  >
                    <td className="px-4 py-3">
                      <p className="text-white">{review.user.name || "—"}</p>
                      <p className="text-xs text-gray-500">{review.user.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-300 max-w-[180px] truncate">
                      {review.product.name}
                    </td>
                    <td className="px-4 py-3">
                      <Stars rating={review.rating} />
                    </td>
                    <td className="px-4 py-3 text-gray-300 max-w-[140px] truncate">
                      {review.title || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-400 max-w-[220px] truncate">
                      {review.comment}
                    </td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                      {formatDate(
                        tab === "APPROVED" ? review.approvedAt : review.createdAt
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end items-center gap-1.5">
                        <button
                          onClick={() => setViewing(review)}
                          aria-label={`View full review by ${review.user.name || review.user.email}`}
                          title="View full review"
                          className="p-2 rounded border border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white transition"
                        >
                          <Eye size={14} />
                        </button>
                        {actions(review)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Review details modal ── */}
      {viewing && (
        <Modal title="Review Details" onClose={() => setViewing(null)} wide>
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-3">
                  <Stars rating={viewing.rating} />
                  <span
                    className={`text-xs px-2 py-0.5 rounded border ${
                      STATUS_COLORS[viewing.status] || "text-gray-400 border-gray-700"
                    }`}
                  >
                    {viewing.status}
                  </span>
                </div>
                <p className="text-white font-semibold mt-2">
                  {viewing.title || "Untitled"}
                </p>
              </div>
              <div className="text-right text-xs text-gray-500">
                <p>Submitted {formatDate(viewing.createdAt)}</p>
                {viewing.approvedAt && (
                  <p className="mt-1">Approved {formatDate(viewing.approvedAt)}</p>
                )}
              </div>
            </div>

            <div className="bg-gray-800 rounded p-4">
              <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap">
                {viewing.comment}
              </p>
            </div>

            {/* User */}
            <div>
              <p className="text-xs uppercase text-gray-500 font-bold mb-2">Customer</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center text-white text-sm">
                  {(viewing.user.name || "U").charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-white text-sm">{viewing.user.name || "—"}</p>
                  <p className="text-xs text-gray-500">{viewing.user.email}</p>
                </div>
              </div>
            </div>

            {/* Product */}
            <div>
              <p className="text-xs uppercase text-gray-500 font-bold mb-2">Product</p>
              <div className="flex items-center gap-3">
                {viewing.product.images?.[0]?.url ? (
                  <img
                    src={viewing.product.images[0].url}
                    alt={viewing.product.name}
                    className="w-12 h-14 object-cover rounded border border-gray-700"
                  />
                ) : (
                  <div className="w-12 h-14 bg-gray-800 rounded border border-gray-700" />
                )}
                <div>
                  <p className="text-white text-sm">{viewing.product.name}</p>
                  <p className="text-xs text-gray-500">/{viewing.product.slug}</p>
                </div>
              </div>
            </div>

            {/* Order */}
            <div>
              <p className="text-xs uppercase text-gray-500 font-bold mb-2">Order</p>
              <p className="text-white text-sm">{viewing.order.orderNumber}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Status: {viewing.order.status}
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
              {viewing.status !== "APPROVED" && (
                <button
                  className={btnPrimaryCls + " flex items-center gap-1.5"}
                  onClick={() => act(`/reviews/${viewing.id}/approve`)}
                  disabled={busy}
                >
                  <Check size={14} />
                  {viewing.status === "REJECTED" ? "Re-approve" : "Approve"}
                </button>
              )}
              {viewing.status === "APPROVED" && (
                <button
                  className={btnSecondaryCls + " flex items-center gap-1.5"}
                  onClick={() => act(`/reviews/${viewing.id}/unapprove`)}
                  disabled={busy}
                >
                  <RotateCcw size={14} />
                  Unapprove
                </button>
              )}
              {viewing.status === "PENDING" && (
                <button
                  className={btnSecondaryCls + " flex items-center gap-1.5"}
                  onClick={() => act(`/reviews/${viewing.id}/reject`)}
                  disabled={busy}
                >
                  <X size={14} />
                  Reject
                </button>
              )}
              <button
                className={btnDangerCls + " flex items-center gap-1.5"}
                onClick={() => {
                  setDeleteTarget(viewing);
                  setViewing(null);
                }}
                disabled={busy}
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Delete confirm modal ── */}
      {deleteTarget && (
        <Modal
          title="Delete Review"
          onClose={() => {
            if (!busy) setDeleteTarget(null);
          }}
        >
          <p className="text-sm text-gray-300 mb-6">
            This review will be permanently deleted. Continue?
          </p>
          <div className="flex justify-end gap-2">
            <button className={btnSecondaryCls} onClick={() => setDeleteTarget(null)}>
              Cancel
            </button>
            <button className={btnDangerCls} onClick={handleDelete} disabled={busy}>
              {busy ? "Deleting…" : "Delete Review"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
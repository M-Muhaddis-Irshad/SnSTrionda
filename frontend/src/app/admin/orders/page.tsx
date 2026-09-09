"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Package, RefreshCw, Bell, Eye, X } from "lucide-react";
import { fetchAdminOrders, fetchAdminOrder, updateAdminOrderStatus } from "@/lib/admin-api";
import { getSocket } from "@/lib/socket";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AdminOrder {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  paymentSlipUrl: string | null;
  paymentRejectionReason: string | null;
  total: number;
  createdAt: string;
  user: { id: string; email: string; name: string | null };
  items: { quantity: number; priceAtPurchase: number }[];
  shippingAddress: { city: string; province: string; country: string };
}

interface AdminOrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  paymentSlipUrl: string | null;
  paymentRejectionReason: string | null;
  subtotal: number;
  shippingCost: number;
  discount: number;
  promoCode: string | null;
  total: number;
  createdAt: string;
  user: { id: string; email: string; name: string | null };
  items: {
    id: string;
    quantity: number;
    priceAtPurchase: number;
    productVariant: {
      size: string | null;
      color: string | null;
      sku: string;
      product: { id: string; name: string; slug: string };
    };
    customMeasurement?: { label: string } | null;
  }[];
  shippingAddress: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    province: string;
    postalCode?: string | null;
    country: string;
  };
  statusHistory?: {
    id: string;
    status: string;
    statusChangedAt: string;
    notes?: string | null;
  }[];
}

interface LiveOrderEvent {
  orderId: string;
  orderNumber: string;
  total: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  user: { id: string; email: string; name: string | null };
  items: { productName: string; quantity: number; price: number }[];
}

const STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
const PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED", "REFUNDED"];

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  CONFIRMED: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  PROCESSING: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  SHIPPED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  DELIVERED: "bg-green-500/10 text-green-400 border-green-500/30",
  CANCELLED: "bg-red-500/10 text-red-400 border-red-500/30",
};

function formatPrice(price: number): string {
  return `Rs. ${price.toLocaleString("en-PK")}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function OrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<{
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  }>({ total: 0, totalPages: 1, hasNext: false, hasPrev: false });
  const [liveToast, setLiveToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [detailOrder, setDetailOrder] = useState<AdminOrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const loadOrders = useCallback(async (targetPage = page, status = statusFilter) => {
    try {
      setLoading(true);
      setError("");
      const result = await fetchAdminOrders({
        page: targetPage,
        limit: 20,
        status: status || undefined,
      });
      setOrders(result.data || []);
      setPagination(
        result.pagination || {
          total: 0,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        }
      );
      setPage(targetPage);
    } catch (err: any) {
      setError(err.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    loadOrders(1, statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  // -------------------------------------------------------------------------
  // Live updates — Socket.IO 'order:created' → refetch so the new order shows
  // instantly (and persists via the API on reload).
  // -------------------------------------------------------------------------

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    function showToast(orderNumber: string) {
      setLiveToast(`New order ${orderNumber} received!`);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setLiveToast(""), 4000);
    }

    function onOrderCreated(order: LiveOrderEvent) {
      console.log("order:created received:", order.orderNumber);
      showToast(order.orderNumber);
      // Refetch current page — simplest and always consistent
      loadOrders(page, statusFilter);
    }

    socket.on("order:created", onOrderCreated);
    return () => {
      socket.off("order:created", onOrderCreated);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  // -------------------------------------------------------------------------
  // Status updates
  // -------------------------------------------------------------------------

  async function handleStatusChange(orderId: string, status: string) {
    try {
      await updateAdminOrderStatus(orderId, { status });
      loadOrders(page, statusFilter);
    } catch (err: any) {
      alert(err.message || "Failed to update order status");
    }
  }

  async function openDetail(orderId: string) {
    setDetailLoading(true);
    setDetailError("");
    try {
      const result = await fetchAdminOrder(orderId);
      setDetailOrder(result.data || null);
    } catch (err: any) {
      setDetailError(err.message || "Failed to load order details");
    } finally {
      setDetailLoading(false);
    }
  }

  function closeDetail() {
    setDetailOrder(null);
    setDetailError("");
  }

  async function handleJazzCashAction(orderId: string, action: "approve" | "reject") {
    if (action === "reject") {
      const reason = prompt("Rejection reason (optional):") || undefined;
      // reason === null means user cancelled
      if (reason === null) return;
      try {
        const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const res = await fetch(`${API}/api/payments/jazzcash/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, action: "reject", reason }),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Reject failed");
        loadOrders(page, statusFilter);
        // Refresh the modal if it's showing this order
        if (detailOrder && detailOrder.id === orderId) openDetail(orderId);
      } catch (err: any) {
        alert(err.message || "Failed to reject payment");
      }
    } else {
      try {
        const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const res = await fetch(`${API}/api/payments/jazzcash/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, action: "approve" }),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Approve failed");
        loadOrders(page, statusFilter);
        // Refresh the modal if it's showing this order
        if (detailOrder && detailOrder.id === orderId) openDetail(orderId);
      } catch (err: any) {
        alert(err.message || "Failed to approve payment");
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-3xl font-semibold text-white">Orders</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-900 text-white text-sm px-3 py-2 rounded border border-gray-800 focus:outline-none focus:border-gray-600"
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            onClick={() => loadOrders(page, statusFilter)}
            className="px-3 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 transition flex items-center gap-2"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>

      {liveToast && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
          <Bell size={14} />
          {liveToast}
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        {loading ? (
          <div className="text-gray-400 text-center py-16">Loading orders…</div>
        ) : orders.length === 0 ? (
          <div className="text-gray-400 text-center py-16">
            <Package size={32} className="mx-auto mb-3 text-gray-600" />
            <p>No orders found{statusFilter ? ` with status ${statusFilter}` : ""}.</p>
            <p className="text-xs mt-2 text-gray-600">
              New orders appear here in real time.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 text-xs uppercase border-b border-gray-800">
                  <th className="px-4 py-3 font-semibold">Order</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Items</th>
                  <th className="px-4 py-3 font-semibold">Total</th>
                  <th className="px-4 py-3 font-semibold">Payment</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-gray-800/60 hover:bg-gray-800/40 transition"
                  >
                    <td className="px-4 py-3 text-white font-semibold">
                      {order.orderNumber}
                      <span className="block text-xs text-gray-500 font-normal">
                        {order.shippingAddress?.city || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white">{order.user?.name || "Guest"}</p>
                      <p className="text-xs text-gray-500">{order.user?.email || ""}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {order.items.reduce((sum, i) => sum + i.quantity, 0)}
                    </td>
                    <td className="px-4 py-3 text-white font-medium whitespace-nowrap">
                      {formatPrice(Number(order.total))}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-400">{order.paymentMethod}</span>
                      <span
                        className={`block text-xs mt-1 px-2 py-0.5 rounded border w-fit ${
                          order.paymentStatus === "PAID"
                            ? "bg-green-500/10 text-green-400 border-green-500/30"
                            : order.paymentStatus === "FAILED"
                            ? "bg-red-500/10 text-red-400 border-red-500/30"
                            : "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                        }`}
                      >
                        {order.paymentStatus}
                      </span>
                      {/* JazzCash: view slip + approve/reject */}
                      {order.paymentMethod === "JAZZCASH" && order.paymentSlipUrl && order.paymentStatus === "PENDING" && (
                        <div className="mt-2 flex gap-1 flex-wrap">
                          <a href={order.paymentSlipUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] px-2 py-0.5 rounded bg-gray-800 text-gray-300 hover:bg-gray-700">View Slip</a>
                          <button onClick={() => handleJazzCashAction(order.id, "approve")} className="text-[10px] px-2 py-0.5 rounded bg-green-600/20 text-green-400 hover:bg-green-600/30">Approve</button>
                          <button onClick={() => handleJazzCashAction(order.id, "reject")} className="text-[10px] px-2 py-0.5 rounded bg-red-600/20 text-red-400 hover:bg-red-600/30">Reject</button>
                        </div>
                      )}
                      {order.paymentMethod === "JAZZCASH" && !order.paymentSlipUrl && order.paymentStatus === "PENDING" && (
                        <p className="text-[10px] text-gray-500 mt-1">No slip uploaded yet</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className={`text-xs px-2 py-1.5 rounded border bg-gray-900 focus:outline-none ${
                          STATUS_STYLES[order.status] || "text-gray-400 border-gray-700"
                        }`}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openDetail(order.id)}
                        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition"
                      >
                        <Eye size={13} />
                        Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>
            Page {page} of {pagination.totalPages} · {pagination.total} orders
          </span>
          <div className="flex gap-2">
            <button
              disabled={!pagination.hasPrev}
              onClick={() => loadOrders(page - 1, statusFilter)}
              className="px-3 py-1.5 bg-gray-800 rounded disabled:opacity-40 hover:bg-gray-700 transition"
            >
              ← Prev
            </button>
            <button
              disabled={!pagination.hasNext}
              onClick={() => loadOrders(page + 1, statusFilter)}
              className="px-3 py-1.5 bg-gray-800 rounded disabled:opacity-40 hover:bg-gray-700 transition"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {detailOrder && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 sm:p-8">
          <div className="relative w-full max-w-3xl bg-gray-900 border border-gray-800 rounded-xl shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Order {detailOrder.orderNumber}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {formatDate(detailOrder.createdAt)}
                </p>
              </div>
              <button
                onClick={closeDetail}
                className="p-2 rounded hover:bg-gray-800 text-gray-400 hover:text-white transition"
                aria-label="Close detail"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-6">
              {/* Status badges */}
              <div className="flex flex-wrap gap-2">
                <span className="text-xs px-3 py-1 rounded border border-gray-700 text-gray-300">
                  Status: {detailOrder.status}
                </span>
                <span
                  className={`text-xs px-3 py-1 rounded border ${
                    detailOrder.paymentStatus === "PAID"
                      ? "bg-green-500/10 text-green-400 border-green-500/30"
                      : detailOrder.paymentStatus === "FAILED"
                      ? "bg-red-500/10 text-red-400 border-red-500/30"
                      : "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                  }`}
                >
                  Payment: {detailOrder.paymentStatus}
                </span>
                <span className="text-xs px-3 py-1 rounded border border-gray-700 text-gray-300">
                  Method: {detailOrder.paymentMethod}
                </span>
              </div>

              {detailLoading && (
                <p className="text-sm text-gray-400">Loading details…</p>
              )}
              {detailError && (
                <p className="text-sm text-red-400">{detailError}</p>
              )}

              {/* Customer */}
              <section>
                <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">
                  Customer
                </h3>
                <div className="text-sm text-gray-300 space-y-1">
                  <p className="text-white font-medium">
                    {detailOrder.user?.name || "Guest"}
                  </p>
                  <p>{detailOrder.user?.email || "—"}</p>
                </div>
              </section>

              {/* Shipping address */}
              <section>
                <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">
                  Shipping Address
                </h3>
                <div className="text-sm text-gray-300 space-y-0.5">
                  <p className="text-white">
                    {detailOrder.shippingAddress?.fullName || "—"}
                  </p>
                  <p>{detailOrder.shippingAddress?.addressLine1 || "—"}</p>
                  {detailOrder.shippingAddress?.addressLine2 && (
                    <p>{detailOrder.shippingAddress.addressLine2}</p>
                  )}
                  <p>
                    {detailOrder.shippingAddress?.city || "—"}
                    {detailOrder.shippingAddress?.province
                      ? `, ${detailOrder.shippingAddress.province}`
                      : ""}
                    {detailOrder.shippingAddress?.postalCode
                      ? ` ${detailOrder.shippingAddress.postalCode}`
                      : ""}
                  </p>
                  <p>{detailOrder.shippingAddress?.country || "—"}</p>
                  <p className="text-gray-400">
                    Phone: {detailOrder.shippingAddress?.phone || "—"}
                  </p>
                </div>
              </section>

              {/* Items */}
              <section>
                <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">
                  Items
                </h3>
                <div className="space-y-2">
                  {detailOrder.items?.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-3 text-sm border-b border-gray-800/60 pb-2"
                    >
                      <div>
                        <p className="text-white">
                          {item.productVariant?.product?.name || "Product"}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {item.productVariant?.size || "—"}
                          {item.productVariant?.color
                            ? ` / ${item.productVariant.color}`
                            : ""}
                          {item.productVariant?.sku
                            ? ` · SKU: ${item.productVariant.sku}`
                            : ""}
                        </p>
                        {item.customMeasurement?.label && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            Measurement: {item.customMeasurement.label}
                          </p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-white">
                          {formatPrice(Number(item.priceAtPurchase) * item.quantity)}
                        </p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                  {(!detailOrder.items || detailOrder.items.length === 0) && (
                    <p className="text-sm text-gray-500">No items</p>
                  )}
                </div>

                {/* Totals */}
                <div className="mt-4 pt-3 border-t border-gray-800 space-y-1.5">
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>Subtotal</span>
                    <span>{formatPrice(Number(detailOrder.subtotal))}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>Shipping</span>
                    <span>{formatPrice(Number(detailOrder.shippingCost))}</span>
                  </div>
                  {Number(detailOrder.discount) > 0 && (
                    <div className="flex justify-between text-sm text-green-400">
                      <span>Discount</span>
                      <span>−{formatPrice(Number(detailOrder.discount))}</span>
                    </div>
                  )}
                  {detailOrder.promoCode && (
                    <div className="flex justify-between text-sm text-gray-400">
                      <span>Promo Code</span>
                      <span>{detailOrder.promoCode}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-white font-semibold pt-1 border-t border-gray-800">
                    <span>Total</span>
                    <span>{formatPrice(Number(detailOrder.total))}</span>
                  </div>
                </div>
              </section>

              {/* JazzCash payment slip */}
              {detailOrder.paymentMethod === "JAZZCASH" && (
                <section>
                  <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">
                    JazzCash Payment Slip
                  </h3>
                  {detailOrder.paymentSlipUrl ? (
                    <div className="space-y-3">
                      <a
                        href={detailOrder.paymentSlipUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block text-sm text-blue-400 hover:text-blue-300 underline"
                      >
                        Open slip image ↗
                      </a>
                      <div className="max-h-72 overflow-auto rounded border border-gray-800 bg-black/40">
                        <img
                          src={detailOrder.paymentSlipUrl}
                          alt="JazzCash payment slip"
                          className="w-full object-contain"
                        />
                      </div>
                      {detailOrder.paymentStatus === "PENDING" && (
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => handleJazzCashAction(detailOrder.id, "approve")}
                            className="text-xs px-4 py-2 rounded bg-green-600/20 text-green-400 border border-green-600/30 hover:bg-green-600/30 transition"
                          >
                            Approve Payment
                          </button>
                          <button
                            onClick={() => handleJazzCashAction(detailOrder.id, "reject")}
                            className="text-xs px-4 py-2 rounded bg-red-600/20 text-red-400 border border-red-600/30 hover:bg-red-600/30 transition"
                          >
                            Reject Payment
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No slip uploaded yet.</p>
                  )}
                  {detailOrder.paymentRejectionReason && (
                    <p className="text-sm text-red-400 mt-2">
                      Rejection reason: {detailOrder.paymentRejectionReason}
                    </p>
                  )}
                </section>
              )}

              {/* Status history */}
              {detailOrder.statusHistory && detailOrder.statusHistory.length > 0 && (
                <section>
                  <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">
                    Status History
                  </h3>
                  <ol className="space-y-2">
                    {detailOrder.statusHistory.map((entry) => (
                      <li key={entry.id} className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="text-gray-300">
                          {entry.status}
                          {entry.notes && (
                            <span className="text-gray-500 text-xs"> — {entry.notes}</span>
                          )}
                        </span>
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          {new Date(entry.statusChangedAt).toLocaleString("en-PK", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </li>
                    ))}
                  </ol>
                </section>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
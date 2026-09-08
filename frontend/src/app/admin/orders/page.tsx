"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Package, RefreshCw, Bell } from "lucide-react";
import { fetchAdminOrders, updateAdminOrderStatus } from "@/lib/admin-api";
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
    </div>
  );
}
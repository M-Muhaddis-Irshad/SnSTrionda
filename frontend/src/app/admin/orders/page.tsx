"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { fetchAdminOrders, fetchAdminOrder, updateAdminOrderStatus } from "@/lib/admin-api";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  subtotal: number;
  shippingCost: number;
  total: number;
  createdAt: string;
  user?: { id: string; email: string; firstName: string; lastName: string };
  shippingAddress?: {
    fullName: string;
    phone: string;
    addressLine1: string;
    city: string;
    province: string;
    country: string;
  };
  items: {
    id: string;
    quantity: number;
    priceAtPurchase: number;
    productVariant?: {
      size?: string | null;
      color?: string | null;
      sku: string;
      product: { name: string; slug: string };
    };
  }[];
}

const ORDER_STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
const PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED", "REFUNDED"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(amount: number): string {
  return `Rs. ${amount.toLocaleString()}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusBadge(status: string): string {
  switch (status) {
    case "PAID":
    case "DELIVERED":
      return "text-emerald-400 border-emerald-400/30";
    case "PENDING":
    case "CONFIRMED":
      return "text-amber-400 border-amber-400/30";
    case "PROCESSING":
    case "SHIPPED":
      return "text-blue-400 border-blue-400/30";
    case "CANCELLED":
    case "FAILED":
      return "text-red-400 border-red-400/30";
    case "REFUNDED":
      return "text-purple-400 border-purple-400/30";
    default:
      return "text-muted border-chrome-400/30";
  }
}

// ===========================================================================
// PAGE
// ===========================================================================

function OrdersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isAdmin } = useAuthStore();

  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Check URL for order ID
  const orderId = searchParams.get("id");

  useEffect(() => {
    if (!isAuthenticated() || !isAdmin()) {
      router.replace("/admin/login");
      return;
    }
    loadOrders();
  }, []);

  useEffect(() => {
    if (orderId) {
      openOrderDetail(orderId);
    }
  }, [orderId]);

  async function loadOrders(page = 1) {
    try {
      setLoading(true);
      const res = await fetchAdminOrders({
        page,
        limit: 20,
        status: statusFilter || undefined,
        search: search || undefined,
      });
      setOrders(res.data);
      setPagination(res.pagination);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function openOrderDetail(orderId: string) {
    try {
      setLoadingDetail(true);
      const res = await fetchAdminOrder(orderId);
      setSelectedOrder(res.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingDetail(false);
    }
  }

  function closeDetail() {
    setSelectedOrder(null);
    router.replace("/admin/orders");
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    loadOrders(1);
  }

  function handleFilterChange(value: string) {
    setStatusFilter(value);
    // Reset to page 1 on filter change
    setTimeout(() => loadOrders(1), 0);
  }

  // If viewing an order detail
  if (selectedOrder) {
    return (
      <OrderDetail
        order={selectedOrder}
        loading={loadingDetail}
        onClose={closeDetail}
        onUpdated={() => {
          loadOrders(pagination.page);
          openOrderDetail(selectedOrder.id);
        }}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl text-foreground tracking-wide">
          Orders
        </h1>
        <p className="font-body text-sm text-muted mt-1">
          {pagination.total} order{pagination.total !== 1 ? "s" : ""} total
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex gap-3 flex-1">
          <Input
            type="text"
            placeholder="Search by order # or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <Button type="submit" variant="filled" size="sm">
            Search
          </Button>
        </form>

        <select
          value={statusFilter}
          onChange={(e) => handleFilterChange(e.target.value)}
          className="bg-surface border border-chrome-500 px-4 py-2 text-sm text-foreground font-body focus:outline-none focus:border-chrome-300 focus-visible:ring-2 focus-visible:ring-chrome-300 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          <option value="">All Statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 border border-red-500/50 bg-red-500/10 text-red-400 text-sm font-body">
          {error}
          <button
            onClick={() => { setError(""); loadOrders(); }}
            className="ml-3 underline hover:text-red-300"
          >
            Retry
          </button>
        </div>
      )}

      {/* Orders Table */}
      {loading ? (
        <div className="py-12 text-center text-muted font-body text-sm tracking-wider uppercase">
          Loading orders...
        </div>
      ) : orders.length === 0 ? (
        <div className="py-12 text-center text-muted font-body text-sm border border-chrome-500 bg-surface">
          No orders found.
        </div>
      ) : (
        <div className="border border-chrome-500 bg-surface overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-chrome-500">
                  <th className="px-6 py-3 text-left font-body text-xs text-muted tracking-wider uppercase">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left font-body text-xs text-muted tracking-wider uppercase">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-right font-body text-xs text-muted tracking-wider uppercase">
                    Total
                  </th>
                  <th className="px-6 py-3 text-center font-body text-xs text-muted tracking-wider uppercase">
                    Order Status
                  </th>
                  <th className="px-6 py-3 text-center font-body text-xs text-muted tracking-wider uppercase">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-right font-body text-xs text-muted tracking-wider uppercase">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-chrome-500">
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-chrome-500/10 transition-colors cursor-pointer"
                    onClick={() => openOrderDetail(order.id)}
                  >
                    <td className="px-6 py-4">
                      <span className="font-body text-sm text-foreground">
                        {order.orderNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-body text-sm text-foreground truncate max-w-[200px]">
                        {order.user?.email || "—"}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-body text-sm text-foreground">
                        {formatCurrency(Number(order.total))}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`font-body text-xs px-2 py-1 border ${statusBadge(order.status)}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`font-body text-xs px-2 py-1 border ${statusBadge(order.paymentStatus)}`}
                      >
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-body text-xs text-muted">
                        {formatDate(order.createdAt)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-chrome-500">
            {orders.map((order) => (
              <div
                key={order.id}
                className="p-4 hover:bg-chrome-500/10 transition-colors cursor-pointer"
                onClick={() => openOrderDetail(order.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-body text-sm text-foreground">{order.orderNumber}</span>
                  <span className="font-body text-sm text-foreground">{formatCurrency(Number(order.total))}</span>
                </div>
                <p className="font-body text-xs text-muted mb-2">{order.user?.email || "—"}</p>
                <div className="flex items-center gap-2">
                  <span className={`font-body text-xs px-2 py-0.5 border ${statusBadge(order.status)}`}>
                    {order.status}
                  </span>
                  <span className={`font-body text-xs px-2 py-0.5 border ${statusBadge(order.paymentStatus)}`}>
                    {order.paymentStatus}
                  </span>
                  <span className="font-body text-xs text-muted ml-auto">
                    {formatDate(order.createdAt)}
                  </span>
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
                onClick={() => loadOrders(page)}
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
}

// ===========================================================================
// ORDER DETAIL
// ===========================================================================

function OrderDetail({
  order,
  loading,
  onClose,
  onUpdated,
}: {
  order: Order;
  loading: boolean;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [newStatus, setNewStatus] = useState(order.status);
  const [newPaymentStatus, setNewPaymentStatus] = useState(order.paymentStatus);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleStatusUpdate() {
    setSaving(true);
    setMessage("");

    try {
      const updates: { status?: string; paymentStatus?: string } = {};
      if (newStatus !== order.status) updates.status = newStatus;
      if (newPaymentStatus !== order.paymentStatus) updates.paymentStatus = newPaymentStatus;

      if (Object.keys(updates).length === 0) {
        setMessage("No changes to save.");
        setSaving(false);
        return;
      }

      await updateAdminOrderStatus(order.id, updates);
      setMessage("Order updated successfully!");
      onUpdated();
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-muted font-body text-sm tracking-wider uppercase">
          Loading order details...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl text-foreground tracking-wide">
            {order.orderNumber}
          </h1>
          <p className="font-body text-sm text-muted mt-1">
            Placed on {formatDate(order.createdAt)}
          </p>
        </div>
        <button
          onClick={onClose}
          className="font-body text-sm text-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chrome-300 px-3 py-1"
        >
          ← Back to Orders
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Order details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="border border-chrome-500 bg-surface p-6">
            <h2 className="font-display text-lg text-foreground mb-4">Items</h2>
            <div className="divide-y divide-chrome-500">
              {order.items.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-body text-sm text-foreground">
                      {item.productVariant?.product.name || "Unknown Product"}
                    </p>
                    <p className="font-body text-xs text-muted mt-0.5">
                      {[item.productVariant?.size, item.productVariant?.color]
                        .filter(Boolean)
                        .join(" / ") || item.productVariant?.sku}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-body text-sm text-foreground">
                      {formatCurrency(Number(item.priceAtPurchase))} × {item.quantity}
                    </p>
                    <p className="font-body text-xs text-muted">
                      = {formatCurrency(Number(item.priceAtPurchase) * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-4 pt-4 border-t border-chrome-500 space-y-2">
              <div className="flex justify-between">
                <span className="font-body text-sm text-muted">Subtotal</span>
                <span className="font-body text-sm text-foreground">
                  {formatCurrency(Number(order.subtotal))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-body text-sm text-muted">Shipping</span>
                <span className="font-body text-sm text-foreground">
                  {formatCurrency(Number(order.shippingCost))}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-chrome-500">
                <span className="font-display text-lg text-foreground">Total</span>
                <span className="font-display text-lg text-foreground">
                  {formatCurrency(Number(order.total))}
                </span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          {order.shippingAddress && (
            <div className="border border-chrome-500 bg-surface p-6">
              <h2 className="font-display text-lg text-foreground mb-4">Shipping Address</h2>
              <div className="font-body text-sm text-muted space-y-1">
                <p className="text-foreground">{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.addressLine1}</p>
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.province}
                </p>
                <p>{order.shippingAddress.country}</p>
                <p className="mt-2">Phone: {order.shippingAddress.phone}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Status + Customer */}
        <div className="space-y-6">
          {/* Customer */}
          <div className="border border-chrome-500 bg-surface p-6">
            <h2 className="font-display text-lg text-foreground mb-4">Customer</h2>
            <div className="font-body text-sm space-y-2">
              <p className="text-foreground">
                {order.user?.firstName} {order.user?.lastName}
              </p>
              <p className="text-muted">{order.user?.email}</p>
            </div>
          </div>

          {/* Status Update */}
          <div className="border border-chrome-500 bg-surface p-6">
            <h2 className="font-display text-lg text-foreground mb-4">Update Status</h2>

            <div className="space-y-4">
              <div>
                <label className="block font-body text-xs text-muted mb-2 tracking-wider uppercase">
                  Order Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-surface border border-chrome-500 px-4 py-2 text-sm text-foreground font-body focus:outline-none focus:border-chrome-300 focus-visible:ring-2 focus-visible:ring-chrome-300 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-body text-xs text-muted mb-2 tracking-wider uppercase">
                  Payment Status
                </label>
                <select
                  value={newPaymentStatus}
                  onChange={(e) => setNewPaymentStatus(e.target.value)}
                  className="w-full bg-surface border border-chrome-500 px-4 py-2 text-sm text-foreground font-body focus:outline-none focus:border-chrome-300 focus-visible:ring-2 focus-visible:ring-chrome-300 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                >
                  {PAYMENT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-body text-xs text-muted mb-2 tracking-wider uppercase">
                  Payment Method
                </label>
                <p className="font-body text-sm text-foreground">
                  {order.paymentMethod}
                </p>
              </div>

              <Button
                variant="primary"
                className="w-full"
                onClick={handleStatusUpdate}
                disabled={saving}
              >
                {saving ? "Saving..." : "Update Status"}
              </Button>

              {message && (
                <p
                  className={`font-body text-sm ${
                    message.startsWith("Error") ? "text-red-400" : "text-emerald-400"
                  }`}
                >
                  {message}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// WRAPPER (Suspense for useSearchParams)
// ===========================================================================

export default function AdminOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <div className="text-muted font-body text-sm tracking-wider uppercase">
            Loading...
          </div>
        </div>
      }
    >
      <OrdersPageContent />
    </Suspense>
  );
}

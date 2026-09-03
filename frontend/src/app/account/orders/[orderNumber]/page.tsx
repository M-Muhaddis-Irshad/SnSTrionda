"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";
import { getSocket } from "@/lib/socket";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  subtotal: number;
  shippingCost: number;
  total: number;
  createdAt: string;
  userId: string;
  items: {
    quantity: number;
    priceAtPurchase: number;
    productVariant: {
      product: { name: string; slug: string };
      size: string;
      color: string;
      sku: string;
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
  user: {
    id: string;
    email: string;
    name: string;
  };
  statusHistory?: {
    id: string;
    status: string;
    statusChangedAt: string;
    notes?: string | null;
  }[];
}

function formatPrice(price: number): string {
  return `Rs. ${price.toLocaleString("en-PK")}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-PK", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, accessToken } = useAuthStore();
  const orderNumber = params.orderNumber as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/orders/mine/${orderNumber}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        setError("Order not found.");
        setLoading(false);
        return;
      }

      const data = await res.json();
      setOrder(data.data);
      setError("");
    } catch {
      setError("Failed to load order details.");
    } finally {
      setLoading(false);
    }
  }, [orderNumber, accessToken]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder, user?.id]);

  // Live updates: the admin changes the status → refetch the freshest state
  // (history rows + totals) and re-render the timeline in place.
  useEffect(() => {
    const sock = getSocket();
    if (!sock) return;

    const onStatusUpdate = (data: any) => {
      if (data.orderNumber === orderNumber || data.orderId === order?.id) {
        fetchOrder();
      }
    };

    sock.on("order:status-updated", onStatusUpdate);
    return () => {
      sock.off("order:status-updated", onStatusUpdate);
    };
  }, [orderNumber, order?.id, fetchOrder]);

  if (loading) {
    return (
      <div className="border border-chrome-500 bg-surface p-6 text-center">
        <p className="font-body text-sm text-muted">Loading order details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-chrome-500 bg-surface p-6 text-center">
        <p className="font-body text-sm text-red-400 mb-4">{error}</p>
        <Link
          href="/account/orders"
          className="font-body text-sm text-chrome-200 hover:text-foreground transition-colors"
        >
          ← Back to order history
        </Link>
      </div>
    );
  }

  if (!order) return null;

  const address = order.shippingAddress;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/account/orders"
        className="font-body text-sm text-muted hover:text-foreground transition-colors"
      >
        ← Back to order history
      </Link>

      {/* Order header */}
      <section className="border border-chrome-500 bg-surface p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-xl text-foreground">
              {order.orderNumber}
            </h2>
            <p className="font-body text-xs text-muted mt-1">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
          <div className="flex gap-2">
            <span className="font-body text-xs px-3 py-1 border border-chrome-500 text-muted">
              {order.status}
            </span>
            <span className="font-body text-xs px-3 py-1 border border-chrome-500 text-muted">
              {order.paymentStatus}
            </span>
          </div>
        </div>
      </section>

      {/* Status timeline — live: updates instantly when the admin changes status */}
      <StatusTimeline
        status={order.status}
        history={order.statusHistory || []}
      />

      {/* Items */}
      <section className="border border-chrome-500 bg-surface p-6">
        <h3 className="font-display text-lg text-foreground mb-4">Items</h3>
        <div className="space-y-4">
          {order.items.map((item, idx) => (
            <div
              key={idx}
              className="flex items-start justify-between pb-4 border-b border-chrome-500 last:border-b-0 last:pb-0"
            >
              <div>
                <p className="font-body text-sm text-foreground">
                  {item.productVariant.product.name}
                </p>
                <p className="font-body text-xs text-muted mt-1">
                  {item.productVariant.size} · {item.productVariant.color}
                </p>
                {item.customMeasurement && (
                  <p className="font-body text-xs text-muted mt-1">
                    Measurement: {item.customMeasurement.label}
                  </p>
                )}
                <p className="font-body text-xs text-muted mt-1">
                  Qty: {item.quantity}
                </p>
              </div>
              <p className="font-body text-sm text-foreground">
                {formatPrice(item.priceAtPurchase * item.quantity)}
              </p>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="mt-6 pt-4 border-t border-chrome-500 space-y-2">
          <div className="flex justify-between">
            <span className="font-body text-sm text-muted">Subtotal</span>
            <span className="font-body text-sm text-foreground">{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-body text-sm text-muted">Shipping</span>
            <span className="font-body text-sm text-foreground">{formatPrice(order.shippingCost)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-chrome-500">
            <span className="font-body text-sm text-foreground font-medium">Total</span>
            <span className="font-body text-sm text-foreground font-medium">{formatPrice(order.total)}</span>
          </div>
        </div>
      </section>

      {/* Shipping address */}
      <section className="border border-chrome-500 bg-surface p-6">
        <h3 className="font-display text-lg text-foreground mb-4">Shipping Address</h3>
        <div className="font-body text-sm text-foreground space-y-1">
          <p>{address.fullName}</p>
          <p>{address.addressLine1}</p>
          {address.addressLine2 && <p>{address.addressLine2}</p>}
          <p>
            {address.city}, {address.province}
            {address.postalCode ? ` ${address.postalCode}` : ""}
          </p>
          <p>{address.country}</p>
          <p className="text-muted mt-2">Phone: {address.phone}</p>
        </div>
      </section>

      {/* Payment info */}
      <section className="border border-chrome-500 bg-surface p-6">
        <h3 className="font-display text-lg text-foreground mb-4">Payment</h3>
        <div className="font-body text-sm text-foreground space-y-1">
          <p>
            <span className="text-muted">Method: </span>
            {order.paymentMethod === "COD"
              ? "Cash on Delivery"
              : order.paymentMethod === "CARD"
              ? "Credit / Debit Card"
              : order.paymentMethod}
          </p>
          <p>
            <span className="text-muted">Status: </span>
            {order.paymentStatus}
          </p>
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// StatusTimeline — order progress from statusHistory (falls back to the
// canonical PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED flow).
// ---------------------------------------------------------------------------

const ORDER_FLOW = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];

function humanizeStatus(status: string): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function StatusTimeline({ status, history }: { status: string; history: OrderDetail["statusHistory"] }) {
  if (status === "CANCELLED") {
    return (
      <section className="border border-red-300/40 bg-red-50 p-6">
        <h3 className="font-display text-lg text-red-700 mb-2">Order Cancelled</h3>
        <p className="font-body text-sm text-red-600">
          This order was cancelled. Contact support if you believe this is a mistake.
        </p>
      </section>
    );
  }

  // Prefer the recorded history when available
  if (history && history.length > 0) {
    return (
      <section className="border border-chrome-500 bg-surface p-6">
        <h3 className="font-display text-lg text-foreground mb-5">Order Status</h3>
        <ol className="space-y-6 border-l border-chrome-300 ml-1.5">
          {history.map((entry) => {
            const isLast = entry.status === status;
            return (
              <li key={entry.id} className="relative pl-5">
                <span
                  className={`absolute left-0 top-1 -translate-x-1/2 w-2.5 h-2.5 rounded-full ${
                    isLast ? "bg-emerald-500" : "bg-chrome-300"
                  }`}
                />
                <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                  <p className={`font-body text-sm font-medium ${isLast ? "text-emerald-700" : "text-foreground"}`}>
                    {humanizeStatus(entry.status)}
                    {isLast && <span className="ml-2 text-[10px] uppercase tracking-wider text-emerald-600">Current</span>}
                  </p>
                  <p className="font-body text-xs text-muted">
                    {new Date(entry.statusChangedAt).toLocaleString("en-PK", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {entry.notes && <p className="font-body text-xs text-muted mt-0.5">{entry.notes}</p>}
              </li>
            );
          })}
        </ol>
      </section>
    );
  }

  // Fallback for legacy orders created before history tracking
  const currentIdx = ORDER_FLOW.indexOf(status);
  return (
    <section className="border border-chrome-500 bg-surface p-6">
      <h3 className="font-display text-lg text-foreground mb-5">Order Status</h3>
      <ol className="flex items-center flex-wrap gap-y-3">
        {ORDER_FLOW.map((step, idx) => {
          const done = idx <= currentIdx;
          return (
            <li key={step} className="flex items-center">
              <span
                className={`font-body text-[11px] uppercase tracking-wide px-2.5 py-1.5 border ${
                  done ? "border-emerald-500 text-emerald-700 bg-emerald-50" : "border-chrome-500 text-muted"
                }`}
              >
                {humanizeStatus(step)}
              </span>
              {idx < ORDER_FLOW.length - 1 && <span className="mx-1 text-muted">—</span>}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

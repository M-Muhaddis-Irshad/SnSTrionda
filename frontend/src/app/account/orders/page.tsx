"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface OrderSummary {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  total: number;
  createdAt: string;
  items: {
    quantity: number;
    priceAtPurchase: number;
    productVariant: {
      product: { name: string };
      size: string;
      color: string;
    };
  }[];
}

function formatPrice(price: number): string {
  return `Rs. ${price.toLocaleString("en-PK")}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function OrderHistoryPage() {
  const { accessToken } = useAuthStore();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch(`${API_URL}/api/orders/mine`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setOrders(data.data || []);
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [accessToken]);

  if (loading) {
    return (
      <div className="border border-chrome-500 bg-surface p-6 text-center">
        <p className="font-body text-sm text-muted">Loading your orders...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="border border-chrome-500 bg-surface p-6 text-center">
        <p className="font-body text-sm text-muted mb-4">
          You haven&apos;t placed any orders yet.
        </p>
        <Link
          href="/shop"
          className="inline-block font-body text-sm text-chrome-200 hover:text-foreground transition-colors"
        >
          Start shopping →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="font-display text-lg text-foreground">Order History</h2>

      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="block border border-chrome-500 bg-surface p-5 hover:border-chrome-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chrome-300 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {/* Header row */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-body text-sm text-foreground font-medium">
                  {order.orderNumber}
                </p>
                <p className="font-body text-xs text-muted mt-1">
                  {formatDate(order.createdAt)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-body text-sm text-foreground font-medium">
                  {formatPrice(order.total)}
                </p>
                <div className="flex gap-2 mt-1 justify-end">
                  <span className="font-body text-xs px-2 py-0.5 border border-chrome-500 text-muted">
                    {order.status}
                  </span>
                  <span className="font-body text-xs px-2 py-0.5 border border-chrome-500 text-muted">
                    {order.paymentStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Item preview */}
            <div className="border-t border-chrome-500 pt-3">
              {order.items.slice(0, 3).map((item, idx) => (
                <p key={idx} className="font-body text-xs text-muted">
                  {item.productVariant.product.name} ({item.productVariant.size}, {item.productVariant.color}) × {item.quantity}
                </p>
              ))}
              {order.items.length > 3 && (
                <p className="font-body text-xs text-muted mt-1">
                  + {order.items.length - 3} more item{order.items.length - 3 !== 1 ? "s" : ""}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-3 pt-3 border-t border-chrome-500">
              <Link
                href={`/account/orders/${order.orderNumber}`}
                className="font-body text-xs uppercase tracking-wider text-chrome-200 hover:text-foreground transition-colors"
              >
                View Details
              </Link>
              <Link
                href={`/order-confirmation/${order.orderNumber}`}
                className="font-body text-xs uppercase tracking-wider text-chrome-200 hover:text-foreground transition-colors"
              >
                View Receipt
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

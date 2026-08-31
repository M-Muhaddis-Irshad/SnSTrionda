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
  total: number;
  createdAt: string;
  items: { quantity: number }[];
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

export default function AccountOverviewPage() {
  const { user, accessToken } = useAuthStore();
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
        // Silently fail — will show empty state
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [accessToken]);

  const totalSpent = orders
    .filter((o) => o.paymentStatus === "PAID" || o.status === "DELIVERED")
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="space-y-8">
      {/* Account info card */}
      <section className="border border-chrome-500 bg-surface p-6">
        <h2 className="font-display text-lg text-foreground mb-4">
          Account Details
        </h2>
        <div className="space-y-2">
          <p className="font-body text-sm text-foreground">
            <span className="text-muted">Name: </span>
            {user?.firstName} {user?.lastName}
          </p>
          <p className="font-body text-sm text-foreground">
            <span className="text-muted">Email: </span>
            {user?.email}
          </p>
          {user?.phone && (
            <p className="font-body text-sm text-foreground">
              <span className="text-muted">Phone: </span>
              {user.phone}
            </p>
          )}
        </div>
      </section>

      {/* Quick stats */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="border border-chrome-500 bg-surface p-6">
          <p className="font-body text-xs text-muted tracking-wider uppercase mb-1">
            Total Orders
          </p>
          <p className="font-display text-2xl text-foreground">{orders.length}</p>
        </div>
        <div className="border border-chrome-500 bg-surface p-6">
          <p className="font-body text-xs text-muted tracking-wider uppercase mb-1">
            Total Spent
          </p>
          <p className="font-display text-2xl text-foreground">{formatPrice(totalSpent)}</p>
        </div>
      </section>

      {/* Recent orders */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg text-foreground">Recent Orders</h2>
          {orders.length > 0 && (
            <Link
              href="/account/orders"
              className="font-body text-sm text-chrome-200 hover:text-foreground transition-colors"
            >
              View all →
            </Link>
          )}
        </div>

        {loading ? (
          <div className="border border-chrome-500 bg-surface p-6 text-center">
            <p className="font-body text-sm text-muted">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
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
        ) : (
          <div className="space-y-3">
            {orders.slice(0, 5).map((order) => (
              <Link
                key={order.id}
                href={`/account/orders/${order.orderNumber}`}
                className="block border border-chrome-500 bg-surface p-4 hover:border-chrome-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chrome-300 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-body text-sm text-foreground">
                      {order.orderNumber}
                    </p>
                    <p className="font-body text-xs text-muted mt-1">
                      {formatDate(order.createdAt)} · {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-body text-sm text-foreground">
                      {formatPrice(order.total)}
                    </p>
                    <span className="inline-block font-body text-xs mt-1 px-2 py-0.5 border border-chrome-500 text-muted">
                      {order.status}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

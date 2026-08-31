"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { fetchDashboardStats } from "@/lib/admin-api";
import RevenueChart from "@/components/admin/RevenueChart";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalCustomers: number;
  recentOrders: any[];
  lowStockProducts: any[];
  revenueByDay: { date: string; day: string; revenue: number; orders: number }[];
}

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
  });
}

function statusColor(status: string): string {
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
    default:
      return "text-muted border-chrome-400/30";
  }
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function AdminDashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isAdmin } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated() || !isAdmin()) {
      router.replace("/admin/login");
      return;
    }

    loadStats();
  }, []);

  async function loadStats() {
    try {
      setLoading(true);
      const res = await fetchDashboardStats();
      setStats(res.data);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-muted font-body text-sm tracking-wider uppercase">
          Loading dashboard...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-20 text-center">
        <p className="text-red-400 font-body text-sm mb-4">{error}</p>
        <button
          onClick={loadStats}
          className="font-body text-sm text-muted hover:text-foreground underline transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl text-foreground tracking-wide">
          Dashboard
        </h1>
        <p className="font-body text-sm text-muted mt-1">
          Overview of your store performance
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard
          label="Total Orders"
          value={stats.totalOrders.toString()}
          icon="🛒"
        />
        <StatCard
          label="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          icon="💰"
        />
        <StatCard
          label="Active Products"
          value={stats.totalProducts.toString()}
          icon="📦"
        />
        <StatCard
          label="Customers"
          value={stats.totalCustomers.toString()}
          icon="👥"
        />
      </div>

      {/* Revenue Analytics Chart */}
      <div className="border border-chrome-500 bg-surface mb-6">
        <div className="px-6 py-4 border-b border-chrome-500">
          <h2 className="font-display text-lg text-foreground">Revenue Analytics</h2>
          <p className="font-body text-xs text-muted mt-0.5">Last 7 days — paid orders only</p>
        </div>
        <div className="px-4 py-4">
          <RevenueChart data={stats.revenueByDay || []} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 border border-chrome-500 bg-surface">
          <div className="px-6 py-4 border-b border-chrome-500 flex items-center justify-between">
            <h2 className="font-display text-lg text-foreground">Recent Orders</h2>
            <button
              onClick={() => router.push("/admin/orders")}
              className="font-body text-xs text-muted hover:text-foreground transition-colors tracking-wider uppercase"
            >
              View All →
            </button>
          </div>

          {stats.recentOrders.length === 0 ? (
            <div className="px-6 py-12 text-center text-muted font-body text-sm">
              No orders yet.
            </div>
          ) : (
            <div className="divide-y divide-chrome-500">
              {stats.recentOrders.map((order: any) => (
                <div
                  key={order.id}
                  className="px-6 py-4 flex items-center justify-between hover:bg-chrome-500/10 transition-colors cursor-pointer"
                  onClick={() => router.push(`/admin/orders?id=${order.id}`)}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-body text-sm text-foreground truncate">
                      {order.orderNumber}
                    </p>
                    <p className="font-body text-xs text-muted mt-0.5">
                      {order.user?.email || "Unknown"}
                    </p>
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    <p className="font-body text-sm text-foreground">
                      {formatCurrency(Number(order.total))}
                    </p>
                    <div className="flex items-center gap-2 mt-1 justify-end">
                      <span
                        className={`font-body text-xs px-2 py-0.5 border ${statusColor(order.status)}`}
                      >
                        {order.status}
                      </span>
                      <span className="font-body text-xs text-muted">
                        {formatDate(order.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock */}
        <div className="border border-chrome-500 bg-surface">
          <div className="px-6 py-4 border-b border-chrome-500">
            <h2 className="font-display text-lg text-foreground">Low Stock</h2>
          </div>

          {stats.lowStockProducts.length === 0 ? (
            <div className="px-6 py-12 text-center text-muted font-body text-sm">
              All products well-stocked.
            </div>
          ) : (
            <div className="divide-y divide-chrome-500 max-h-96 overflow-y-auto">
              {stats.lowStockProducts.map((variant: any) => (
                <div
                  key={variant.id}
                  className="px-6 py-3 flex items-center justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-body text-sm text-foreground truncate">
                      {variant.product.name}
                    </p>
                    <p className="font-body text-xs text-muted mt-0.5">
                      {[variant.size, variant.color].filter(Boolean).join(" / ") || variant.sku}
                    </p>
                  </div>
                  <span
                    className={`font-body text-sm font-medium ${
                      variant.stockQuantity === 0
                        ? "text-red-400"
                        : variant.stockQuantity < 3
                        ? "text-amber-400"
                        : "text-foreground"
                    }`}
                  >
                    {variant.stockQuantity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="border border-chrome-500 bg-surface px-6 py-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-body text-xs text-muted tracking-wider uppercase">{label}</p>
          <p className="font-display text-2xl text-foreground mt-2">{value}</p>
        </div>
        <span className="text-xl">{icon}</span>
      </div>
    </div>
  );
}

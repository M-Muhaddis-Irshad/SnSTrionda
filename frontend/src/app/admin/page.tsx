'use client';

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { Banknote, Package, Users, ShoppingBag, TrendingUp, Activity as ActivityIcon } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { getSocket } from '@/lib/socket';
import { adminFetch } from '@/lib/admin-api';
import type { AdminLiveStats, AdminActivityEntry } from '@/types/realtime';
import { ACTIVITY_ACTION_LABELS } from '@/types/realtime';
import Link from 'next/link';

interface DashboardData {
  stats: {
    totalRevenue: number;
    revenueChange: string;
    totalOrders: number;
    ordersChange: string;
    totalCustomers: number;
    customersChange: string;
    totalProducts: number;
    conversionRate: string;
  };
  chartData: Array<{ date: string; revenue: number; orders: number }>;
  statusData: Array<{ name: string; value: number }>;
  channelData: Array<{ name: string; revenue: number; percentage: string }>;
  topProducts: Array<{
    id: string;
    name: string;
    price: number;
    sold: number;
  }>;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    customer: string;
    date: string;
    status: string;
    total: number;
  }>;
  recentActivities: Array<{
    id: string;
    type: string;
    message: string;
    user: string;
    timestamp: string;
  }>;
  customerStats: {
    total: number;
    new: number;
    returning: number;
    avgOrderValue: string;
    customerLifetimeValue: string;
  };
}

const COLORS = ['#ffffff', '#a3a3a3', '#666666', '#333333'];
// Grayscale ramp — statuses stay distinguishable while matching the
// black/white/minimal admin theme. Also drives the recent-order badges.
const STATUS_COLORS: Record<string, string> = {
  PENDING: '#d4d4d4',
  CONFIRMED: '#a3a3a3',
  PROCESSING: '#7a7a7a',
  SHIPPED: '#4d4d4d',
  DELIVERED: '#ffffff',
  CANCELLED: '#2e2e2e',
};

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // -------------------------------------------------------------------------
  // LIVE layer — stats every 30s + activity feed (Socket.IO)
  // -------------------------------------------------------------------------
  const [liveStats, setLiveStats] = useState<AdminLiveStats | null>(null);
  const [activities, setActivities] = useState<AdminActivityEntry[]>([]);

  useEffect(() => {
    // Seed the activity feed
    adminFetch<{ data: any[] }>('/activity?page=1&limit=8')
      .then((res) => {
        setActivities(
          (res.data || []).map((a: any) => ({
            activityId: a.id,
            adminId: a.adminId,
            adminName: a.admin?.name || a.admin?.email || 'Admin',
            action: a.action,
            entityType: a.entityType,
            entityId: a.entityId,
            details: a.details ?? null,
            timestamp: a.createdAt,
          }))
        );
      })
      .catch(() => {});

    const sock = getSocket();
    if (!sock) return;

    const onStats = (stats: AdminLiveStats) => {
      setLiveStats(stats);
      // Keep the headline cards live too
      setData((prev) =>
        prev
          ? {
              ...prev,
              stats: {
                ...prev.stats,
                totalRevenue: stats.totalRevenue,
                totalOrders: stats.totalOrders,
              },
            }
          : prev
      );
    };

    const onActivity = (entry: AdminActivityEntry) => {
      setActivities((prev) =>
        [entry, ...prev].filter((e, i, arr) => arr.findIndex((x) => x.activityId === e.activityId) === i).slice(0, 8)
      );
    };

    sock.on('admin:stats-updated', onStats);
    sock.on('admin:activity-logged', onActivity);
    return () => {
      sock.off('admin:stats-updated', onStats);
      sock.off('admin:activity-logged', onActivity);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      // adminFetch refreshes the access token on 401 and retries, so a stale
      // token after a hard refresh doesn't leave the dashboard broken.
      const json = await adminFetch<{ data: any }>('/dashboard/stats');
      const stats = json.data;

      // Transform backend response to frontend shape
      const totalRevenue = stats.totalRevenue || 0;
      const totalOrders = stats.totalOrders || 0;
      const totalProducts = stats.totalProducts || 0;
      const totalCustomers = stats.totalCustomers || 0;

      // Chart data from revenueByDay
      const chartData = (stats.revenueByDay || []).map((day: any) => ({
        date: day.day,
        revenue: day.revenue || 0,
        orders: day.orders || 0,
      }));

      // Status data from recent orders
      const statusCounts: Record<string, number> = {};
      (stats.recentOrders || []).forEach((o: any) => {
        statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
      });
      const statusData = Object.entries(statusCounts).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1).toLowerCase(),
        value,
      }));

      // Channel data - empty for now (not in backend stats)
      const channelData: Array<{ name: string; revenue: number; percentage: string }> = [];

      // Top products
      const topProducts = (stats.lowStockProducts || []).slice(0, 5).map((p: any) => ({
        id: p.product?.id || p.id,
        name: p.product?.name || 'Unknown',
        price: 0,
        sold: 0,
      }));

      // Recent orders
      const recentOrders = (stats.recentOrders || []).slice(0, 5).map((o: any) => ({
        id: o.id,
        orderNumber: o.id.substring(0, 8).toUpperCase(),
        customer: o.user?.email || 'Guest',
        date: new Date(o.createdAt).toLocaleDateString(),
        status: o.status,
        total: Number(o.total),
      }));

      setData({
        stats: {
          totalRevenue,
          revenueChange: '+0%',
          totalOrders,
          ordersChange: '+0%',
          totalCustomers,
          customersChange: '+0%',
          totalProducts,
          conversionRate: totalCustomers > 0 ? ((totalOrders / totalCustomers) * 100).toFixed(2) + '%' : '0.00%',
        },
        chartData,
        statusData,
        channelData,
        topProducts,
        recentOrders,
        recentActivities: [],
        customerStats: {
          total: totalCustomers,
          new: 0,
          returning: 0,
          avgOrderValue: totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : '0.00',
          customerLifetimeValue: '0.00',
        },
      });
    } catch (err: any) {
      console.error('Dashboard error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-20 text-center">
        <p className="text-red-400 text-sm mb-4">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="text-gray-400 hover:text-white text-sm underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      {/* STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          label="TOTAL REVENUE"
          value={`Rs. ${data.stats.totalRevenue.toLocaleString()}`}
          change={data.stats.revenueChange}
          period="vs last 30 days"
          icon={<Banknote size={18} strokeWidth={1.75} />}
        />
        <StatCard
          label="TOTAL ORDERS"
          value={data.stats.totalOrders.toString()}
          change={data.stats.ordersChange}
          period="vs last 30 days"
          icon={<Package size={18} strokeWidth={1.75} />}
        />
        <StatCard
          label="TOTAL CUSTOMERS"
          value={data.stats.totalCustomers.toString()}
          change={data.stats.customersChange}
          period="vs last 30 days"
          icon={<Users size={18} strokeWidth={1.75} />}
        />
        <StatCard
          label="TOTAL PRODUCTS"
          value={data.stats.totalProducts.toString()}
          change="+0%"
          period="vs last 30 days"
          icon={<ShoppingBag size={18} strokeWidth={1.75} />}
        />
        <StatCard
          label="CONVERSION RATE"
          value={data.stats.conversionRate}
          change="+0%"
          period="vs last 30 days"
          icon={<TrendingUp size={18} strokeWidth={1.75} />}
        />
      </div>

      {/* LIVE STRIP — pushed by the backend every 30s + after events */}
      {liveStats && (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          <LiveStat label="ORDERS TODAY" value={String(liveStats.ordersToday)} />
          <LiveStat label="REVENUE TODAY" value={`Rs. ${liveStats.revenueToday.toLocaleString()}`} />
          <LiveStat label="PENDING REVIEWS" value={String(liveStats.pendingReviews)} accent={liveStats.pendingReviews > 0 ? 'text-amber-400' : ''} />
          <LiveStat label="ACTIVE CHATS" value={String(liveStats.activeChats)} accent={liveStats.activeChats > 0 ? 'text-emerald-400' : ''} />
          <LiveStat label="ADMINS ONLINE" value={String(liveStats.connectedAdmins)} />
        </div>
      )}

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LINE CHART - Sales Overview */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white font-semibold">SALES OVERVIEW</h3>
          </div>
          {data.chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '8px',
                  }}
                  formatter={(value: any) =>
                    typeof value === 'number' ? `Rs. ${value.toLocaleString()}` : value
                  }
                />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#fff" strokeWidth={2} dot={false} name="Revenue" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
              No sales data yet
            </div>
          )}
        </div>

        {/* PIE CHART - Order Status */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h3 className="text-white font-semibold mb-6">ORDERS BY STATUS</h3>
          {data.statusData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {data.statusData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={STATUS_COLORS[entry.name.toUpperCase()] || COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-6 space-y-2">
                {data.statusData.map((status) => {
                  const total = data.statusData.reduce((sum, s) => sum + s.value, 0);
                  const percentage = ((status.value / total) * 100).toFixed(1);
                  return (
                    <div key={status.name} className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">● {status.name}</span>
                      <span className="text-white">{status.value} ({percentage}%)</span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
              No orders yet
            </div>
          )}
        </div>
      </div>

      {/* BAR CHART - Sales by Channel */}
      {data.channelData.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h3 className="text-white font-semibold mb-6">SALES BY CHANNEL</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.channelData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                formatter={(value: any) => typeof value === 'number' ? `Rs. ${value.toLocaleString()}` : value}
              />
              <Bar dataKey="revenue" fill="#fff" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* TABLES SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RECENT ORDERS TABLE */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white font-semibold">RECENT ORDERS</h3>
            <Link href="/admin/orders" className="text-gray-400 hover:text-white text-sm">View All</Link>
          </div>
          <div className="space-y-2">
            {data.recentOrders.length > 0 ? (
              data.recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between py-3 border-b border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-800 rounded flex items-center justify-center">
                      <Package size={18} strokeWidth={1.75} className="text-gray-400" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">#{order.orderNumber}</p>
                      <p className="text-gray-500 text-xs">{order.customer}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white text-sm">{order.date}</p>
                    <span
                      className="text-xs px-2 py-1 rounded"
                      style={{
                        backgroundColor: `${STATUS_COLORS[order.status.toUpperCase()] || '#555'}33`,
                        color: STATUS_COLORS[order.status.toUpperCase()] || '#999',
                      }}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm text-center py-6">No orders yet</p>
            )}
          </div>
        </div>

        {/* TOP PRODUCTS TABLE */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white font-semibold">TOP SELLING PRODUCTS</h3>
            <Link href="/admin/products" className="text-gray-400 hover:text-white text-sm">View All</Link>
          </div>
          <div className="space-y-2">
            {data.topProducts.length > 0 ? (
              data.topProducts.map((product, index) => (
                <div key={product.id} className="flex items-center justify-between py-3 border-b border-gray-800">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 font-semibold w-6">{index + 1}</span>
                    <div>
                      <p className="text-white font-semibold text-sm">{product.name}</p>
                      <p className="text-gray-500 text-xs">{product.sold} sold</p>
                    </div>
                  </div>
                  <p className="text-white font-semibold">Rs. {product.price.toLocaleString()}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm text-center py-6">No products yet</p>
            )}
          </div>
        </div>
      </div>

      {/* LIVE ACTIVITY FEED */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-white font-semibold">LIVE ACTIVITY</h3>
          <Link href="/admin/activity" className="text-gray-400 hover:text-white text-sm">
            View All
          </Link>
        </div>
        {activities.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">No admin activity yet</p>
        ) : (
          <div className="space-y-3">
            {activities.slice(0, 6).map((entry) => (
              <div key={entry.activityId} className="flex items-center gap-3 py-2 border-b border-gray-800 last:border-b-0">
                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center shrink-0">
                  <ActivityIcon size={14} className="text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-200 truncate">
                    <span className="font-semibold text-white">{entry.adminName}</span>
                    <span className="text-gray-400"> {ACTION_LABEL(entry.action)}</span>
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {entry.entityType} · {entry.entityId}
                  </p>
                </div>
                <span className="text-xs text-gray-500 shrink-0">
                  {new Date(entry.timestamp).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CUSTOMER OVERVIEW */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h3 className="text-white font-semibold mb-6">CUSTOMER OVERVIEW</h3>
        <div className="space-y-4">
          <OverviewStat label="Total Customers" value={data.customerStats.total.toString()} />
          <OverviewStat label="New Customers (This Month)" value={data.customerStats.new.toString()} />
          <OverviewStat label="Returning Customers" value={data.customerStats.returning.toString()} />
          <OverviewStat label="Average Order Value" value={`Rs. ${data.customerStats.avgOrderValue}`} />
          <OverviewStat label="Customer Lifetime Value" value={`Rs. ${data.customerStats.customerLifetimeValue}`} />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, change, period, icon }: {
  label: string; value: string; change: string; period: string; icon: React.ReactNode;
}) {
  const isPositive = !change.startsWith('-');
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase text-gray-500 font-bold mb-2">{label}</p>
          <p className="text-3xl font-semibold text-white">{value}</p>
          <p className={`text-xs mt-2 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {change} <span className="text-gray-500">{period}</span>
          </p>
        </div>
        <div className="w-8 h-8 bg-gray-800 rounded flex items-center justify-center text-gray-400">{icon}</div>
      </div>
    </div>
  );
}

function LiveStat({ label, value, accent = '' }: { label: string; value: string; accent?: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <p className="text-[11px] uppercase text-gray-500 font-bold mb-1.5">{label}</p>
      <p className={`text-2xl font-semibold text-white ${accent}`}>{value}</p>
    </div>
  );
}

function ACTION_LABEL(action: string): string {
  return ACTIVITY_ACTION_LABELS[action] || action.replace(/_/g, ' ').toLowerCase();
}

function OverviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-800">
      <span className="text-gray-400 text-sm">{label}</span>
      <p className="text-white font-semibold text-sm">{value}</p>
    </div>
  );
}

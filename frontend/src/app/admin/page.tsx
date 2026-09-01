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

const COLORS = ['#ffffff', '#888888', '#555555', '#333333'];
const STATUS_COLORS: Record<string, string> = {
  Pending: '#fbbf24',
  Processing: '#60a5fa',
  Shipped: '#34d399',
  Delivered: '#10b981',
  Cancelled: '#ef4444',
};

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/admin/dashboard/stats');
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to fetch');
      }
      const dashboardData = await res.json();
      setData(dashboardData);
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
          <div className="w-12 h-12 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
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
          icon="💰"
        />
        <StatCard
          label="TOTAL ORDERS"
          value={data.stats.totalOrders.toString()}
          change={data.stats.ordersChange}
          period="vs last 30 days"
          icon="📦"
        />
        <StatCard
          label="TOTAL CUSTOMERS"
          value={data.stats.totalCustomers.toString()}
          change={data.stats.customersChange}
          period="vs last 30 days"
          icon="👥"
        />
        <StatCard
          label="TOTAL PRODUCTS"
          value={data.stats.totalProducts.toString()}
          change="+0%"
          period="vs last 30 days"
          icon="🛍️"
        />
        <StatCard
          label="CONVERSION RATE"
          value={data.stats.conversionRate}
          change="+0%"
          period="vs last 30 days"
          icon="📈"
        />
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LINE CHART - Sales Overview */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white font-semibold">SALES OVERVIEW</h3>
            <select className="bg-gray-800 text-white text-sm px-3 py-1 rounded border border-gray-700">
              <option>This Month</option>
              <option>Last Month</option>
            </select>
          </div>
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
                  typeof value === 'number'
                    ? `Rs. ${value.toLocaleString()}`
                    : value
                }
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#fff"
                strokeWidth={2}
                dot={false}
                name="Revenue"
              />
            </LineChart>
          </ResponsiveContainer>
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
                        fill={STATUS_COLORS[entry.name] || COLORS[index % COLORS.length]}
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
                      <span className="text-gray-400">
                        ● {status.name}
                      </span>
                      <span className="text-white">
                        {status.value} ({percentage}%)
                      </span>
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
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #333',
                }}
                formatter={(value: any) =>
                  typeof value === 'number'
                    ? `Rs. ${value.toLocaleString()}`
                    : value
                }
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
            <a href="/admin/orders" className="text-gray-400 hover:text-white text-sm">
              View All
            </a>
          </div>
          <div className="space-y-2">
            {data.recentOrders.length > 0 ? (
              data.recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between py-3 border-b border-gray-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-800 rounded flex items-center justify-center">
                      📦
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">
                        #{order.orderNumber}
                      </p>
                      <p className="text-gray-500 text-xs">{order.customer}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white text-sm">{order.date}</p>
                    <span
                      className="text-xs px-2 py-1 rounded"
                      style={{
                        backgroundColor: `${STATUS_COLORS[order.status] || '#555'}33`,
                        color: STATUS_COLORS[order.status] || '#999',
                      }}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm text-center py-6">
                No orders yet
              </p>
            )}
          </div>
        </div>

        {/* TOP PRODUCTS TABLE */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white font-semibold">TOP SELLING PRODUCTS</h3>
            <a href="/admin/products" className="text-gray-400 hover:text-white text-sm">
              View All
            </a>
          </div>
          <div className="space-y-2">
            {data.topProducts.length > 0 ? (
              data.topProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between py-3 border-b border-gray-800"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 font-semibold w-6">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-white font-semibold text-sm">
                        {product.name}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {product.sold} sold
                      </p>
                    </div>
                  </div>
                  <p className="text-white font-semibold">
                    Rs. {product.price.toLocaleString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm text-center py-6">
                No products yet
              </p>
            )}
          </div>
        </div>
      </div>

      {/* CUSTOMER OVERVIEW & ACTIVITIES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        {/* RECENT ACTIVITIES */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h3 className="text-white font-semibold mb-6">RECENT ACTIVITIES</h3>
          <div className="space-y-2">
            {data.recentActivities.length > 0 ? (
              data.recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 py-3 border-b border-gray-800"
                >
                  <div className="text-lg">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm break-words">
                      {activity.message}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-gray-500 text-xs">{activity.user}</p>
                      <p className="text-gray-600 text-xs">
                        {activity.timestamp}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm text-center py-6">
                No activities yet
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  change,
  period,
  icon,
}: {
  label: string;
  value: string;
  change: string;
  period: string;
  icon: string;
}) {
  const isPositive = !change.startsWith('-');

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase text-gray-500 font-bold mb-2">
            {label}
          </p>
          <p className="text-3xl font-semibold text-white">{value}</p>
          <p className={`text-xs mt-2 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {change}{' '}
            <span className="text-gray-500">{period}</span>
          </p>
        </div>
        <div className="w-8 h-8 bg-gray-800 rounded flex items-center justify-center text-lg">
          {icon}
        </div>
      </div>
    </div>
  );
}

function OverviewStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-800">
      <span className="text-gray-400 text-sm">{label}</span>
      <p className="text-white font-semibold text-sm">{value}</p>
    </div>
  );
}

function getActivityIcon(type: string): string {
  const icons: Record<string, string> = {
    order: '📦',
    product: '🛍️',
    customer: '👥',
    discount: '🏷️',
    review: '⭐',
  };
  return icons[type] || '📌';
}

// =============================================================================
// Admin — Revenue Analytics Bar Chart (recharts)
// =============================================================================

"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DayData {
  date: string;
  day: string;
  revenue: number;
  orders: number;
}

interface RevenueChartProps {
  data: DayData[];
}

function formatCurrency(value: number): string {
  if (value >= 1000) {
    return `Rs. ${(value / 1000).toFixed(1)}k`;
  }
  return `Rs. ${value.toLocaleString()}`;
}

// ---------------------------------------------------------------------------
// Custom Tooltip
// ---------------------------------------------------------------------------

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  const data = payload[0].payload as DayData;

  return (
    <div className="bg-surface border border-chrome-400 px-4 py-3 shadow-lg">
      <p className="font-body text-xs text-muted tracking-wider uppercase mb-1">
        {data.day} — {data.date}
      </p>
      <p className="font-display text-lg text-foreground">
        {formatCurrency(data.revenue)}
      </p>
      <p className="font-body text-xs text-muted mt-1">
        {data.orders} order{data.orders !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chart Component
// ---------------------------------------------------------------------------

export default function RevenueChart({ data }: RevenueChartProps) {
  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#3A3A3A"
            vertical={false}
          />
          <XAxis
            dataKey="day"
            tick={{ fill: "#B8B8B8", fontSize: 12, fontFamily: "Inter" }}
            axisLine={{ stroke: "#3A3A3A" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#B8B8B8", fontSize: 12, fontFamily: "Inter" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(val) => formatCurrency(val)}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
          />
          <Bar
            dataKey="revenue"
            fill="#B8B8B8"
            radius={[2, 2, 0, 0]}
            maxBarSize={48}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

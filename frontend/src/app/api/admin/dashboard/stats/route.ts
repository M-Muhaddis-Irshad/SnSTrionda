import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Calculate 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 1. TOTAL REVENUE (All time)
    const revenueResult = await prisma.order.aggregate({
      _sum: { total: true },
    });
    const totalRevenue = Number(revenueResult._sum.total) || 0;

    // 2. REVENUE LAST 30 DAYS
    const revenueLastMonth = await prisma.order.aggregate({
      _sum: { total: true },
      where: { createdAt: { gte: thirtyDaysAgo } },
    });
    const totalRevenueLastMonth = Number(revenueLastMonth._sum.total) || 0;

    // Calculate revenue change percentage
    const previousMonth = new Date(thirtyDaysAgo);
    previousMonth.setDate(previousMonth.getDate() - 30);
    const revenuePreviousMonth = await prisma.order.aggregate({
      _sum: { total: true },
      where: {
        createdAt: { gte: previousMonth, lt: thirtyDaysAgo },
      },
    });
    const revenuePrevious = Number(revenuePreviousMonth._sum.total) || 1;
    const revenueChange = (
      ((totalRevenueLastMonth - revenuePrevious) / revenuePrevious) *
      100
    ).toFixed(1);

    // 3. TOTAL ORDERS
    const totalOrders = await prisma.order.count();

    // 4. ORDERS LAST 30 DAYS
    const ordersLastMonth = await prisma.order.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    });

    // Calculate orders change
    const ordersPrevious = await prisma.order.count({
      where: {
        createdAt: { gte: previousMonth, lt: thirtyDaysAgo },
      },
    });
    const ordersChange = (
      ((ordersLastMonth - ordersPrevious) / (ordersPrevious || 1)) *
      100
    ).toFixed(1);

    // 5. TOTAL CUSTOMERS
    const totalCustomers = await prisma.user.count({
      where: { role: 'CUSTOMER' },
    });

    // 6. NEW CUSTOMERS LAST 30 DAYS
    const newCustomersLastMonth = await prisma.user.count({
      where: {
        role: 'CUSTOMER',
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    // Calculate customers change
    const customersPrevious = await prisma.user.count({
      where: {
        role: 'CUSTOMER',
        createdAt: { gte: previousMonth, lt: thirtyDaysAgo },
      },
    });
    const customersChange = (
      ((newCustomersLastMonth - customersPrevious) / (customersPrevious || 1)) *
      100
    ).toFixed(1);

    // 7. TOTAL PRODUCTS
    const totalProducts = await prisma.product.count();

    // 8. CONVERSION RATE
    const conversionRate =
      totalCustomers > 0
        ? ((totalOrders / totalCustomers) * 100).toFixed(2)
        : '0.00';

    // 9. SALES BY DAY (Last 30 days - FOR LINE CHART)
    const salesByDay = await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        SUM(total) as revenue,
        COUNT(*) as order_count
      FROM "Order"
      WHERE created_at >= ${thirtyDaysAgo}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    const chartData = (salesByDay as any[]).map((day) => ({
      date: new Date(day.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      revenue: parseFloat(day.revenue) || 0,
      orders: parseInt(day.order_count) || 0,
    }));

    // 10. ORDER STATUS BREAKDOWN (FOR PIE CHART)
    const orderStatusBreakdown = await prisma.order.groupBy({
      by: ['status'],
      _count: true,
    });

    const statusData = orderStatusBreakdown.map((status) => ({
      name:
        status.status.charAt(0).toUpperCase() + status.status.slice(1) ||
        'Unknown',
      value: status._count,
    }));

    // 11. TOP SELLING PRODUCTS (via variants)
    const topProductsRaw = await prisma.$queryRaw`
      SELECT p.id, p.name, p."basePrice" as price, COUNT(oi.id)::int as sold
      FROM "Product" p
      JOIN "ProductVariant" pv ON pv."productId" = p.id
      JOIN "OrderItem" oi ON oi."productVariantId" = pv.id
      GROUP BY p.id, p.name, p."basePrice"
      ORDER BY sold DESC
      LIMIT 5
    `;
    const topProducts = (topProductsRaw as any[]).map((p) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      sold: p.sold,
    }));

    // 12. RECENT ORDERS
    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true, image: true } },
      },
    });

    // 13. RECENT ACTIVITIES
    const recentActivities = await prisma.activity.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    const formattedActivities = recentActivities.map((activity) => ({
      id: activity.id,
      type: activity.type,
      message: activity.message,
      user: activity.user.name || activity.user.email || 'System',
      timestamp: formatTimeAgo(activity.createdAt),
      createdAt: activity.createdAt,
    }));

    // 14. CUSTOMER STATS
    const returningCustomersRaw = await prisma.$queryRaw`
      SELECT "userId", COUNT(*)::int as cnt
      FROM "Order"
      GROUP BY "userId"
      HAVING COUNT(*) > 1
    `;

    const returningCustomerCount = (returningCustomersRaw as any[]).length;

    // Average order value
    const avgOrderValue =
      totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : '0.00';

    // Customer lifetime value
    const avgOrdersPerCustomer =
      totalCustomers > 0 ? (totalOrders / totalCustomers).toFixed(2) : '0';
    const customerLifetimeValue = (
      parseFloat(avgOrdersPerCustomer) * parseFloat(avgOrderValue)
    ).toFixed(2);

    // 15. SALES BY CHANNEL
    const salesByChannel = await prisma.order.groupBy({
      by: ['paymentMethod'],
      _sum: { total: true },
      _count: true,
    });

    const channelData = (salesByChannel as any[]).map((channel) => ({
      name: channel.paymentMethod || 'Unknown',
      revenue: Number(channel._sum.total) || 0,
      percentage: (
        ((Number(channel._sum.total) || 0) / totalRevenue) *
        100
      ).toFixed(1),
    }));

    return NextResponse.json({
      // Stats Cards
      stats: {
        totalRevenue,
        revenueChange: `+${revenueChange}%`,
        totalOrders,
        ordersChange: `+${ordersChange}%`,
        totalCustomers,
        customersChange: `+${customersChange}%`,
        totalProducts,
        conversionRate: `${conversionRate}%`,
      },

      // Chart Data
      chartData,
      statusData,
      channelData,

      // Tables
      topProducts,
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customer: o.user?.name || 'Guest',
        date: o.createdAt.toLocaleDateString(),
        status: o.status,
        total: Number(o.total),
      })),

      // Activities
      recentActivities: formattedActivities,

      // Customer stats
      customerStats: {
        total: totalCustomers,
        new: newCustomersLastMonth,
        returning: returningCustomerCount,
        avgOrderValue,
        customerLifetimeValue,
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  return date.toLocaleDateString();
}

// =============================================================================
// Internal API Endpoints — called by the standalone socket server via HTTP
// =============================================================================
// Protected by EMIT_API_KEY (same key used for the /emit bridge).
// These endpoints exist so the socket server does NOT need its own Prisma
// connection — it calls the backend (which already has the DB) via HTTP.
// =============================================================================

import { Router, Request, Response } from "express";
import { prisma } from "../../db";

const router = Router();
const EMIT_API_KEY = process.env.EMIT_API_KEY || "";

// Auth middleware — only the socket server (with the shared EMIT_API_KEY) can call these
function requireInternalAuth(req: Request, res: Response, next: Function) {
  const auth = req.headers.authorization;
  if (!EMIT_API_KEY || auth !== `Bearer ${EMIT_API_KEY}`) {
    return res.status(401).json({ error: "Invalid or missing EMIT_API_KEY." });
  }
  next();
}

router.use(requireInternalAuth);

// GET /api/internal/admin-stats
// Returns the computed admin dashboard stats (orders, revenue, reviews, etc.)
router.get("/admin-stats", async (_req: Request, res: Response) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [totalOrders, paidAgg, ordersToday, paidTodayAgg, pendingReviews, activeChats] =
      await Promise.all([
        prisma.order.count(),
        prisma.order.aggregate({ where: { paymentStatus: "PAID" }, _sum: { total: true } }),
        prisma.order.count({ where: { createdAt: { gte: startOfDay } } }),
        prisma.order.aggregate({
          where: { paymentStatus: "PAID", createdAt: { gte: startOfDay } },
          _sum: { total: true },
        }),
        prisma.review.count({ where: { status: "PENDING" } }),
        prisma.chatSession.count({ where: { status: "OPEN" } }),
      ]);

    res.json({
      totalOrders,
      totalRevenue: Number(paidAgg._sum.total || 0),
      ordersToday,
      revenueToday: Number(paidTodayAgg._sum.total || 0),
      pendingReviews,
      activeChats,
    });
  } catch (err) {
    console.error("Internal /admin-stats failed:", err);
    res.status(500).json({ error: "Failed to compute admin stats." });
  }
});

// POST /api/internal/admin-connected
// Body: { adminId: string }
// Returns the last 10 admin activity entries for replay to a newly connected admin.
router.post("/admin-connected", async (req: Request, res: Response) => {
  try {
    const { adminId } = req.body;
    if (!adminId) return res.status(400).json({ error: "adminId is required." });

    const recent = await prisma.adminActivity.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { admin: { select: { id: true, name: true, email: true } } },
    });

    const activities = recent.map((entry) => ({
      activityId: entry.id,
      adminId: entry.adminId,
      adminName: entry.admin.name || entry.admin.email || "Admin",
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      details: entry.details,
      timestamp: entry.createdAt,
    }));

    res.json({ activities });
  } catch (err) {
    console.error("Internal /admin-connected failed:", err);
    res.status(500).json({ error: "Failed to fetch admin activity." });
  }
});

// POST /api/internal/validate-chat-member
// Body: { sessionId: string, userId: string, isAdmin: boolean }
// Returns { isParticipant: boolean }
router.post("/validate-chat-member", async (req: Request, res: Response) => {
  try {
    const { sessionId, userId, isAdmin } = req.body;
    if (!sessionId || !userId) return res.status(400).json({ error: "sessionId and userId required." });

    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      select: { id: true, customerId: true, adminId: true },
    });

    if (!session) return res.json({ isParticipant: false });

    const isParticipant =
      session.customerId === userId || isAdmin || session.adminId === userId;

    res.json({ isParticipant });
  } catch (err) {
    console.error("Internal /validate-chat-member failed:", err);
    res.status(500).json({ error: "Failed to validate chat membership." });
  }
});

export default router;

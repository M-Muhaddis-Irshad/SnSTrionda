// =============================================================================
// Activity Feature — Request Handlers (Controller)
// =============================================================================

import { Request, Response } from "express";
import { listAdminActivity } from "./activity.service";

// ---------------------------------------------------------------------------
// GET /api/admin/activity — paginated feed with optional filters
// ---------------------------------------------------------------------------

export async function handleListActivity(req: Request, res: Response) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));

    const result = await listAdminActivity({
      page,
      limit,
      action: (req.query.action as string) || undefined,
      entityType: (req.query.entityType as string) || undefined,
      from: (req.query.from as string) || undefined,
      to: (req.query.to as string) || undefined,
    });

    res.json(result);
  } catch (err: any) {
    console.error("Activity list error:", err?.message || err);
    res.status(500).json({ error: "Internal server error" });
  }
}

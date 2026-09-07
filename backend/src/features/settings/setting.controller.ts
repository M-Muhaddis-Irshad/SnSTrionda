// =============================================================================
// Store Settings Feature — Request Handlers (Controller)
// =============================================================================

import { Request, Response } from "express";
import { getAllSettings, upsertSettings } from "./setting.service";
import { logAdminActivity, broadcastCatalogChange } from "../../services/socketService";

export async function handleGetPublicSettings(_req: Request, res: Response) {
  try {
    const settings = await getAllSettings();
    res.json({ data: settings });
  } catch (err: any) {
    console.error("Get public settings error:", err?.message || err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function handleGetAdminSettings(_req: Request, res: Response) {
  try {
    const settings = await getAllSettings();
    res.json({ data: settings });
  } catch (err: any) {
    console.error("Get admin settings error:", err?.message || err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function handleUpdateSettings(req: Request, res: Response) {
  try {
    const settings = await upsertSettings(req.body ?? {});
    res.json({ data: settings, message: "Settings saved successfully" });
    const adminId = req.user?.userId;
    if (adminId) {
      logAdminActivity(adminId, "UPDATE_SETTINGS", "Settings", "store", null).catch(() => {});
    }
    broadcastCatalogChange("updated", "settings", null);
  } catch (err: any) {
    console.error("Update settings error:", err?.message || err);
    res.status(500).json({ error: err?.message || "Internal server error" });
  }
}

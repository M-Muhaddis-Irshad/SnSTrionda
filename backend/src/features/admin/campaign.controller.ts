// =============================================================================
// Admin Feature — Campaign Handlers (Controller)
// =============================================================================

import { Request, Response } from "express";
import {
  listCampaigns,
  listActiveCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  setCampaignsActive,
  CampaignError,
} from "./campaign.service";
import { broadcastCatalogChange } from "../../services/socketService";

function handleError(err: any, res: Response) {
  if (err instanceof CampaignError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  console.error("Campaign admin error:", err?.message || err);
  res.status(500).json({ error: "Internal server error" });
}

// ---------------------------------------------------------------------------
// GET /api/admin/campaigns — list (paginated)
// ---------------------------------------------------------------------------

export async function handleListCampaigns(req: Request, res: Response) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const search = (req.query.search as string) || undefined;

    const result = await listCampaigns({ page, limit, search });
    res.json(result);
  } catch (err: any) {
    handleError(err, res);
  }
}

// ---------------------------------------------------------------------------
// POST /api/admin/campaigns — create campaign
// ---------------------------------------------------------------------------

export async function handleCreateCampaign(req: Request, res: Response) {
  try {
    const { title, description, imageId, startDate, endDate, discount } = req.body;
    const active = req.body.active === undefined ? undefined : !!req.body.active;

    const campaign = await createCampaign({
      title,
      description,
      imageId,
      startDate,
      endDate,
      discount: Number(discount),
      active,
    });
    res.status(201).json({ data: campaign, message: "Campaign created successfully" });
    broadcastCatalogChange("created", "settings", { entity: "campaign", id: campaign.id, title: campaign.title });
  } catch (err: any) {
    handleError(err, res);
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/admin/campaigns/:id — update campaign
// ---------------------------------------------------------------------------

export async function handleUpdateCampaign(req: Request, res: Response) {
  try {
    const campaignId = req.params.id as string;
    const { title, description, imageId, startDate, endDate, discount } = req.body;
    const active = req.body.active === undefined ? undefined : !!req.body.active;

    const campaign = await updateCampaign(campaignId, {
      title,
      description,
      imageId,
      startDate,
      endDate,
      discount: discount !== undefined ? Number(discount) : undefined,
      active,
    });
    res.json({ data: campaign, message: "Campaign updated successfully" });
    broadcastCatalogChange("updated", "settings", { entity: "campaign", id: campaign.id, title: campaign.title });
  } catch (err: any) {
    handleError(err, res);
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/admin/campaigns/:id — delete campaign
// ---------------------------------------------------------------------------

export async function handleDeleteCampaign(req: Request, res: Response) {
  try {
    const campaignId = req.params.id as string;
    const result = await deleteCampaign(campaignId);
    res.json({ ...result, message: "Campaign deleted successfully" });
    broadcastCatalogChange("deleted", "settings", { entity: "campaign", id: campaignId });
  } catch (err: any) {
    handleError(err, res);
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/admin/campaigns/bulk-status — bulk activate/deactivate
// ---------------------------------------------------------------------------

export async function handleBulkCampaignStatus(req: Request, res: Response) {
  try {
    const { ids, active } = req.body;
    const result = await setCampaignsActive(ids, !!active);
    res.json({ ...result, message: "Campaigns updated successfully" });
    broadcastCatalogChange("updated", "settings", { entity: "campaign", ids, active: !!active });
  } catch (err: any) {
    handleError(err, res);
  }
}

// ---------------------------------------------------------------------------
// GET /api/campaigns — public: active campaigns for the storefront
// ---------------------------------------------------------------------------

export async function handleListActiveCampaigns(req: Request, res: Response) {
  try {
    const campaigns = await listActiveCampaigns();
    res.json({ data: campaigns });
  } catch (err: any) {
    handleError(err, res);
  }
}

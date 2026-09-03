// =============================================================================
// Admin Feature — Campaign Routes
// =============================================================================
// NOTE: Mounted inside admin.routes.ts AFTER the authenticate + requireRole("ADMIN")
// middleware, so every route below is admin-protected automatically.

import { Router } from "express";
import {
  handleListCampaigns,
  handleCreateCampaign,
  handleUpdateCampaign,
  handleDeleteCampaign,
  handleBulkCampaignStatus,
} from "./campaign.controller";

const router = Router();

router.get("/", handleListCampaigns);
router.post("/", handleCreateCampaign);
router.patch("/bulk-status", handleBulkCampaignStatus); // must precede /:id
router.patch("/:id", handleUpdateCampaign);
router.delete("/:id", handleDeleteCampaign);

export default router;

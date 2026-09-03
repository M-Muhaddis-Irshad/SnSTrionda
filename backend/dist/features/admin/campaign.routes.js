"use strict";
// =============================================================================
// Admin Feature — Campaign Routes
// =============================================================================
// NOTE: Mounted inside admin.routes.ts AFTER the authenticate + requireRole("ADMIN")
// middleware, so every route below is admin-protected automatically.
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const campaign_controller_1 = require("./campaign.controller");
const router = (0, express_1.Router)();
router.get("/", campaign_controller_1.handleListCampaigns);
router.post("/", campaign_controller_1.handleCreateCampaign);
router.patch("/bulk-status", campaign_controller_1.handleBulkCampaignStatus); // must precede /:id
router.patch("/:id", campaign_controller_1.handleUpdateCampaign);
router.delete("/:id", campaign_controller_1.handleDeleteCampaign);
exports.default = router;
//# sourceMappingURL=campaign.routes.js.map
"use strict";
// =============================================================================
// Admin Feature — Campaign Handlers (Controller)
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleListCampaigns = handleListCampaigns;
exports.handleCreateCampaign = handleCreateCampaign;
exports.handleUpdateCampaign = handleUpdateCampaign;
exports.handleDeleteCampaign = handleDeleteCampaign;
exports.handleBulkCampaignStatus = handleBulkCampaignStatus;
const campaign_service_1 = require("./campaign.service");
function handleError(err, res) {
    if (err instanceof campaign_service_1.CampaignError) {
        return res.status(err.statusCode).json({ error: err.message });
    }
    console.error("Campaign admin error:", err?.message || err);
    res.status(500).json({ error: "Internal server error" });
}
// ---------------------------------------------------------------------------
// GET /api/admin/campaigns — list (paginated)
// ---------------------------------------------------------------------------
async function handleListCampaigns(req, res) {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
        const search = req.query.search || undefined;
        const result = await (0, campaign_service_1.listCampaigns)({ page, limit, search });
        res.json(result);
    }
    catch (err) {
        handleError(err, res);
    }
}
// ---------------------------------------------------------------------------
// POST /api/admin/campaigns — create campaign
// ---------------------------------------------------------------------------
async function handleCreateCampaign(req, res) {
    try {
        const { title, description, imageId, startDate, endDate, discount } = req.body;
        const active = req.body.active === undefined ? undefined : !!req.body.active;
        const campaign = await (0, campaign_service_1.createCampaign)({
            title,
            description,
            imageId,
            startDate,
            endDate,
            discount: Number(discount),
            active,
        });
        res.status(201).json({ data: campaign, message: "Campaign created successfully" });
    }
    catch (err) {
        handleError(err, res);
    }
}
// ---------------------------------------------------------------------------
// PATCH /api/admin/campaigns/:id — update campaign
// ---------------------------------------------------------------------------
async function handleUpdateCampaign(req, res) {
    try {
        const campaignId = req.params.id;
        const { title, description, imageId, startDate, endDate, discount } = req.body;
        const active = req.body.active === undefined ? undefined : !!req.body.active;
        const campaign = await (0, campaign_service_1.updateCampaign)(campaignId, {
            title,
            description,
            imageId,
            startDate,
            endDate,
            discount: discount !== undefined ? Number(discount) : undefined,
            active,
        });
        res.json({ data: campaign, message: "Campaign updated successfully" });
    }
    catch (err) {
        handleError(err, res);
    }
}
// ---------------------------------------------------------------------------
// DELETE /api/admin/campaigns/:id — delete campaign
// ---------------------------------------------------------------------------
async function handleDeleteCampaign(req, res) {
    try {
        const campaignId = req.params.id;
        const result = await (0, campaign_service_1.deleteCampaign)(campaignId);
        res.json({ ...result, message: "Campaign deleted successfully" });
    }
    catch (err) {
        handleError(err, res);
    }
}
// ---------------------------------------------------------------------------
// PATCH /api/admin/campaigns/bulk-status — bulk activate/deactivate
// ---------------------------------------------------------------------------
async function handleBulkCampaignStatus(req, res) {
    try {
        const { ids, active } = req.body;
        const result = await (0, campaign_service_1.setCampaignsActive)(ids, !!active);
        res.json({ ...result, message: "Campaigns updated successfully" });
    }
    catch (err) {
        handleError(err, res);
    }
}
//# sourceMappingURL=campaign.controller.js.map
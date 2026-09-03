"use strict";
// =============================================================================
// Admin Feature — Campaign Service (Campaign CRUD)
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampaignError = void 0;
exports.listCampaigns = listCampaigns;
exports.createCampaign = createCampaign;
exports.updateCampaign = updateCampaign;
exports.deleteCampaign = deleteCampaign;
exports.setCampaignsActive = setCampaignsActive;
const db_1 = require("../../db");
// ---------------------------------------------------------------------------
// Custom Error
// ---------------------------------------------------------------------------
class CampaignError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.name = "CampaignError";
    }
}
exports.CampaignError = CampaignError;
const imageSelect = { select: { id: true, name: true, url: true, alt: true } };
// ---------------------------------------------------------------------------
// List campaigns (paginated)
// ---------------------------------------------------------------------------
async function listCampaigns(params) {
    const { page, limit, search } = params;
    const skip = (page - 1) * limit;
    const where = {};
    if (search) {
        where.OR = [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
        ];
    }
    const [campaigns, total] = await Promise.all([
        db_1.prisma.campaign.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: { image: imageSelect },
        }),
        db_1.prisma.campaign.count({ where }),
    ]);
    const totalPages = Math.ceil(total / limit);
    return {
        data: campaigns,
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        },
    };
}
// ---------------------------------------------------------------------------
// Create campaign
// ---------------------------------------------------------------------------
async function createCampaign(input) {
    validateCampaign(input);
    const image = await db_1.prisma.image.findUnique({ where: { id: input.imageId } });
    if (!image) {
        throw new CampaignError("Selected image does not exist.", 400);
    }
    const campaign = await db_1.prisma.campaign.create({
        data: {
            title: input.title.trim(),
            description: input.description?.trim() || null,
            imageId: input.imageId,
            startDate: new Date(input.startDate),
            endDate: new Date(input.endDate),
            discount: Math.round(input.discount),
            active: input.active ?? true,
        },
        include: { image: imageSelect },
    });
    return campaign;
}
// ---------------------------------------------------------------------------
// Update campaign
// ---------------------------------------------------------------------------
async function updateCampaign(campaignId, input) {
    const existing = await db_1.prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!existing) {
        throw new CampaignError("Campaign not found", 404);
    }
    const data = {};
    if (input.title !== undefined) {
        if (!input.title.trim())
            throw new CampaignError("Campaign title cannot be empty.", 400);
        data.title = input.title.trim();
    }
    if (input.description !== undefined)
        data.description = input.description?.trim() || null;
    if (input.imageId !== undefined) {
        const image = await db_1.prisma.image.findUnique({ where: { id: input.imageId } });
        if (!image)
            throw new CampaignError("Selected image does not exist.", 400);
        data.imageId = input.imageId;
    }
    if (input.discount !== undefined) {
        if (isNaN(input.discount) || input.discount < 0 || input.discount > 100) {
            throw new CampaignError("Discount must be a percentage between 0 and 100.", 400);
        }
        data.discount = Math.round(input.discount);
    }
    if (input.active !== undefined)
        data.active = input.active;
    // Date window validation (only when dates are being changed)
    if (input.startDate !== undefined || input.endDate !== undefined) {
        const start = input.startDate !== undefined ? new Date(input.startDate) : existing.startDate;
        const end = input.endDate !== undefined ? new Date(input.endDate) : existing.endDate;
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            throw new CampaignError("Invalid start or end date.", 400);
        }
        if (end.getTime() <= start.getTime()) {
            throw new CampaignError("End date must be after start date.", 400);
        }
        if (input.startDate !== undefined)
            data.startDate = start;
        if (input.endDate !== undefined)
            data.endDate = end;
    }
    return db_1.prisma.campaign.update({
        where: { id: campaignId },
        data,
        include: { image: imageSelect },
    });
}
// ---------------------------------------------------------------------------
// Delete campaign
// ---------------------------------------------------------------------------
async function deleteCampaign(campaignId) {
    const existing = await db_1.prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!existing) {
        throw new CampaignError("Campaign not found", 404);
    }
    await db_1.prisma.campaign.delete({ where: { id: campaignId } });
    return { deleted: true, campaignId };
}
// ---------------------------------------------------------------------------
// Bulk activate / deactivate
// ---------------------------------------------------------------------------
async function setCampaignsActive(ids, active) {
    if (!Array.isArray(ids) || ids.length === 0) {
        throw new CampaignError("Provide at least one campaign id.", 400);
    }
    const result = await db_1.prisma.campaign.updateMany({
        where: { id: { in: ids } },
        data: { active },
    });
    return { updated: result.count, active };
}
// ---------------------------------------------------------------------------
// Validation helper
// ---------------------------------------------------------------------------
function validateCampaign(input) {
    if (!input.title || !input.title.trim()) {
        throw new CampaignError("Campaign title is required.", 400);
    }
    if (!input.imageId) {
        throw new CampaignError("A campaign image is required.", 400);
    }
    if (!input.startDate || !input.endDate) {
        throw new CampaignError("Start and end dates are required.", 400);
    }
    const start = new Date(input.startDate);
    const end = new Date(input.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new CampaignError("Invalid start or end date.", 400);
    }
    if (end.getTime() <= start.getTime()) {
        throw new CampaignError("End date must be after start date.", 400);
    }
    if (isNaN(input.discount) || input.discount < 0 || input.discount > 100) {
        throw new CampaignError("Discount must be a percentage between 0 and 100.", 400);
    }
}
//# sourceMappingURL=campaign.service.js.map
// =============================================================================
// Admin Feature — Campaign Service (Campaign CRUD)
// =============================================================================

import { prisma } from "../../db";

// ---------------------------------------------------------------------------
// Custom Error
// ---------------------------------------------------------------------------

export class CampaignError extends Error {
  public statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = "CampaignError";
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CampaignListParams {
  page: number;
  limit: number;
  search?: string;
}

export interface CreateCampaignInput {
  title: string;
  description?: string;
  imageId: string;
  startDate: string;
  endDate: string;
  discount: number;
  active?: boolean;
}

export interface UpdateCampaignInput {
  title?: string;
  description?: string;
  imageId?: string;
  startDate?: string;
  endDate?: string;
  discount?: number;
  active?: boolean;
}

const imageSelect = { select: { id: true, name: true, url: true, alt: true } };

// ---------------------------------------------------------------------------
// List campaigns (paginated)
// ---------------------------------------------------------------------------

export async function listCampaigns(params: CampaignListParams) {
  const { page, limit, search } = params;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const [campaigns, total] = await Promise.all([
    prisma.campaign.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { image: imageSelect },
    }),
    prisma.campaign.count({ where }),
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
// Active campaigns (storefront) — active flag on AND inside the date window.
// ---------------------------------------------------------------------------

export async function listActiveCampaigns() {
  const now = new Date();
  return prisma.campaign.findMany({
    where: {
      active: true,
      startDate: { lte: now },
      endDate: { gte: now },
    },
    orderBy: { createdAt: "desc" },
    include: { image: imageSelect },
  });
}

// ---------------------------------------------------------------------------
// Create campaign
// ---------------------------------------------------------------------------

export async function createCampaign(input: CreateCampaignInput) {
  validateCampaign(input);

  const image = await prisma.image.findUnique({ where: { id: input.imageId } });
  if (!image) {
    throw new CampaignError("Selected image does not exist.", 400);
  }

  const campaign = await prisma.campaign.create({
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

export async function updateCampaign(campaignId: string, input: UpdateCampaignInput) {
  const existing = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!existing) {
    throw new CampaignError("Campaign not found", 404);
  }

  const data: any = {};

  if (input.title !== undefined) {
    if (!input.title.trim()) throw new CampaignError("Campaign title cannot be empty.", 400);
    data.title = input.title.trim();
  }
  if (input.description !== undefined) data.description = input.description?.trim() || null;

  if (input.imageId !== undefined) {
    const image = await prisma.image.findUnique({ where: { id: input.imageId } });
    if (!image) throw new CampaignError("Selected image does not exist.", 400);
    data.imageId = input.imageId;
  }

  if (input.discount !== undefined) {
    if (isNaN(input.discount) || input.discount < 0 || input.discount > 100) {
      throw new CampaignError("Discount must be a percentage between 0 and 100.", 400);
    }
    data.discount = Math.round(input.discount);
  }

  if (input.active !== undefined) data.active = input.active;

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
    if (input.startDate !== undefined) data.startDate = start;
    if (input.endDate !== undefined) data.endDate = end;
  }

  return prisma.campaign.update({
    where: { id: campaignId },
    data,
    include: { image: imageSelect },
  });
}

// ---------------------------------------------------------------------------
// Delete campaign
// ---------------------------------------------------------------------------

export async function deleteCampaign(campaignId: string) {
  const existing = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!existing) {
    throw new CampaignError("Campaign not found", 404);
  }
  await prisma.campaign.delete({ where: { id: campaignId } });
  return { deleted: true, campaignId };
}

// ---------------------------------------------------------------------------
// Bulk activate / deactivate
// ---------------------------------------------------------------------------

export async function setCampaignsActive(ids: string[], active: boolean) {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new CampaignError("Provide at least one campaign id.", 400);
  }
  const result = await prisma.campaign.updateMany({
    where: { id: { in: ids } },
    data: { active },
  });
  return { updated: result.count, active };
}

// ---------------------------------------------------------------------------
// Validation helper
// ---------------------------------------------------------------------------

function validateCampaign(input: {
  title: string;
  imageId: string;
  startDate: string;
  endDate: string;
  discount: number;
}) {
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

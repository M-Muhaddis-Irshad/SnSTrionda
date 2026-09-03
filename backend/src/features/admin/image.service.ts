// =============================================================================
// Admin Feature — Site Media Image Service (Image CRUD + Cloudinary upload)
// =============================================================================

import cloudinary, { CLOUDINARY_SITE_FOLDER } from "../../config/cloudinary";
import { prisma } from "../../db";

// ---------------------------------------------------------------------------
// Custom Error
// ---------------------------------------------------------------------------

export class MediaError extends Error {
  public statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = "MediaError";
  }
}

// ---------------------------------------------------------------------------
// Types / constants
// ---------------------------------------------------------------------------

const IMAGE_CATEGORIES = ["HERO", "BANNER", "COLLECTION", "CAROUSEL", "CAMPAIGN"];

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

export interface ImageListParams {
  page: number;
  limit: number;
  category?: string;
  search?: string;
}

export interface CreateImageInput {
  name: string;
  url?: string;
  file?: Express.Multer.File;
  alt?: string;
  category: string;
  active?: boolean;
}

export interface UpdateImageInput {
  name?: string;
  url?: string;
  alt?: string;
  category?: string;
  active?: boolean;
}

// ---------------------------------------------------------------------------
// List images (paginated, filterable)
// ---------------------------------------------------------------------------

export async function listImages(params: ImageListParams) {
  const { page, limit, category, search } = params;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (category) {
    where.category = category;
  }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { alt: { contains: search, mode: "insensitive" } },
    ];
  }

  const [images, total] = await Promise.all([
    prisma.image.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { campaigns: true } } },
    }),
    prisma.image.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: images,
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
// Create image — uploads a file to Cloudinary (or accepts a valid https url)
// ---------------------------------------------------------------------------

export async function createImage(input: CreateImageInput) {
  const category = normalizeCategory(input.category);
  if (!input.name || !input.name.trim()) {
    throw new MediaError("Image name is required.", 400);
  }

  let url = (input.url || "").trim();

  // File upload path
  if (input.file) {
    if (!ALLOWED_MIME_TYPES.includes(input.file.mimetype)) {
      throw new MediaError(
        `Invalid file type: ${input.file.mimetype}. Allowed: JPEG, PNG, WebP, GIF.`,
        400
      );
    }
    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: CLOUDINARY_SITE_FOLDER,
          public_id: `site-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
          resource_type: "image",
        },
        (error, result) => {
          if (error) return reject(error);
          if (!result) return reject(new Error("Upload failed — no result returned"));
          resolve(result);
        }
      );
      uploadStream.end(input.file!.buffer);
    });
    url = result.secure_url;
  }

  if (!url) {
    throw new MediaError("Image URL is required when no file is uploaded.", 400);
  }
  if (!isHttpsUrl(url)) {
    throw new MediaError("Image URL must be a valid https:// URL.", 400);
  }

  return prisma.image.create({
    data: {
      name: input.name.trim(),
      url,
      alt: input.alt?.trim() || null,
      category,
      active: input.active ?? true,
    },
  });
}

// ---------------------------------------------------------------------------
// Update image metadata
// ---------------------------------------------------------------------------

export async function updateImage(imageId: string, input: UpdateImageInput) {
  const existing = await prisma.image.findUnique({ where: { id: imageId } });
  if (!existing) {
    throw new MediaError("Image not found", 404);
  }

  const data: any = {};
  if (input.name !== undefined) {
    if (!input.name.trim()) throw new MediaError("Image name cannot be empty.", 400);
    data.name = input.name.trim();
  }
  if (input.alt !== undefined) data.alt = input.alt?.trim() || null;
  if (input.url !== undefined) {
    const url = input.url.trim();
    if (!isHttpsUrl(url)) {
      throw new MediaError("Image URL must be a valid https:// URL.", 400);
    }
    data.url = url;
  }
  if (input.category !== undefined) {
    data.category = normalizeCategory(input.category);
  }
  if (input.active !== undefined) {
    // Block deactivating the last active image in a category
    if (input.active === false && existing.active === true) {
      const activeCount = await prisma.image.count({
        where: { category: existing.category, active: true, id: { not: imageId } },
      });
      if (activeCount === 0) {
        throw new MediaError(
          `Cannot deactivate: this is the only active image in the ${existing.category} category. Activate another image first.`,
          400
        );
      }
    }
    data.active = input.active;
  }

  return prisma.image.update({
    where: { id: imageId },
    data,
    include: { _count: { select: { campaigns: true } } },
  });
}

// ---------------------------------------------------------------------------
// Usage — where is this image referenced?
// ---------------------------------------------------------------------------

export async function getImageUsage(imageId: string) {
  const image = await prisma.image.findUnique({ where: { id: imageId } });
  if (!image) {
    throw new MediaError("Image not found", 404);
  }

  const campaigns = await prisma.campaign.findMany({
    where: { imageId },
    select: { id: true, title: true, active: true },
  });

  return {
    image,
    usage: {
      campaigns,
      usedByCampaigns: campaigns.length,
    },
  };
}

// ---------------------------------------------------------------------------
// Delete image — blocked while referenced by an active campaign (or any campaign)
// ---------------------------------------------------------------------------

export async function deleteImage(imageId: string) {
  const image = await prisma.image.findUnique({ where: { id: imageId } });
  if (!image) {
    throw new MediaError("Image not found", 404);
  }

  const usage = await getImageUsage(imageId);
  if (usage.usage.campaigns.length > 0) {
    throw new MediaError(
      `Cannot delete this image — it is used by ${usage.usage.campaigns.length} campaign(s): ${usage.usage.campaigns
        .map((c) => c.title)
        .join(", ")}. Remove the campaign link first.`,
      409
    );
  }

  // Best-effort Cloudinary cleanup
  const publicId = extractCloudinaryPublicId(image.url);
  if (publicId) {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (err: any) {
      console.error("Cloudinary delete warning:", err?.message || err);
    }
  }

  await prisma.image.delete({ where: { id: imageId } });
  return { deleted: true, imageId };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeCategory(
  category: string
): "HERO" | "BANNER" | "COLLECTION" | "CAROUSEL" | "CAMPAIGN" {
  const normalized = String(category || "BANNER").trim().toUpperCase();
  if (!IMAGE_CATEGORIES.includes(normalized)) {
    throw new MediaError(
      `Invalid category: ${category}. Must be one of: ${IMAGE_CATEGORIES.join(", ")}.`,
      400
    );
  }
  return normalized as "HERO" | "BANNER" | "COLLECTION" | "CAROUSEL" | "CAMPAIGN";
}

function isHttpsUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function extractCloudinaryPublicId(url: string): string | null {
  try {
    const parts = url.split("/upload/");
    if (parts.length < 2) return null;
    let path = parts[1];
    path = path.replace(/^v\d+/, "");
    path = path.replace(/\.[^.]+$/, "");
    path = path.replace(/^\//, "");
    return path || null;
  } catch {
    return null;
  }
}

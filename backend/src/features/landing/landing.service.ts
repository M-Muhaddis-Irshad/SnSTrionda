// =============================================================================
// Landing Feature — Hero slide/banner management (admin CRUD + public read)
// =============================================================================

import cloudinary from "../../config/cloudinary";
import { prisma } from "../../db";

// ---------------------------------------------------------------------------
// Custom Error
// ---------------------------------------------------------------------------

export class LandingError extends Error {
  public statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = "LandingError";
  }
}

// ---------------------------------------------------------------------------
// Types / constants
// ---------------------------------------------------------------------------

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

export interface HeroSlideInput {
  heading: string;
  headingAccent?: string | null;
  subheading?: string | null;
  ctaLabel?: string;
  ctaHref?: string;
  imageUrl?: string;
  overlayGradient?: string | null;
  active?: boolean;
  sortOrder?: number;
}

// ---------------------------------------------------------------------------
// Public — active slides in display order (storefront)
// ---------------------------------------------------------------------------

export async function listActiveSlides() {
  return prisma.heroSlide.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

// ---------------------------------------------------------------------------
// Admin — full CRUD
// ---------------------------------------------------------------------------

export async function listSlides() {
  return prisma.heroSlide.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

export async function getSlide(slideId: string) {
  const slide = await prisma.heroSlide.findUnique({ where: { id: slideId } });
  if (!slide) throw new LandingError("Slide not found", 404);
  return slide;
}

export async function createSlide(input: HeroSlideInput, file?: Express.Multer.File) {
  const heading = input.heading?.trim();
  if (!heading) throw new LandingError("Heading is required.", 400);

  let imageUrl = input.imageUrl?.trim() || null;
  if (file) {
    imageUrl = await uploadToCloudinary(file);
  }
  if (imageUrl && !isHttpsUrl(imageUrl)) {
    throw new LandingError("Image URL must be a valid https:// URL.", 400);
  }

  return prisma.heroSlide.create({
    data: {
      heading,
      headingAccent: input.headingAccent?.trim() || null,
      subheading: input.subheading?.trim() || null,
      ctaLabel: input.ctaLabel?.trim() || "Shop Collection",
      ctaHref: input.ctaHref?.trim() || "/shop",
      imageUrl,
      overlayGradient: input.overlayGradient?.trim() || null,
      active: input.active ?? true,
      sortOrder: typeof input.sortOrder === "number" ? input.sortOrder : 0,
    },
  });
}

export async function updateSlide(slideId: string, input: HeroSlideInput, file?: Express.Multer.File) {
  const existing = await prisma.heroSlide.findUnique({ where: { id: slideId } });
  if (!existing) throw new LandingError("Slide not found", 404);

  const data: any = {};
  if (input.heading !== undefined) {
    if (!input.heading.trim()) throw new LandingError("Heading cannot be empty.", 400);
    data.heading = input.heading.trim();
  }
  if (input.headingAccent !== undefined) data.headingAccent = input.headingAccent?.trim() || null;
  if (input.subheading !== undefined) data.subheading = input.subheading?.trim() || null;
  if (input.ctaLabel !== undefined) data.ctaLabel = input.ctaLabel?.trim() || "Shop Collection";
  if (input.ctaHref !== undefined) data.ctaHref = input.ctaHref?.trim() || "/shop";
  if (input.overlayGradient !== undefined) data.overlayGradient = input.overlayGradient?.trim() || null;
  if (input.active !== undefined) data.active = input.active;
  if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder;

  if (file) {
    data.imageUrl = await uploadToCloudinary(file);
  } else if (input.imageUrl !== undefined) {
    const url = input.imageUrl.trim();
    if (url && !isHttpsUrl(url)) {
      throw new LandingError("Image URL must be a valid https:// URL.", 400);
    }
    data.imageUrl = url || null;
  }

  return prisma.heroSlide.update({ where: { id: slideId }, data });
}

export async function deleteSlide(slideId: string) {
  const existing = await prisma.heroSlide.findUnique({ where: { id: slideId } });
  if (!existing) throw new LandingError("Slide not found", 404);

  // Best-effort Cloudinary cleanup
  if (existing.imageUrl) {
    const publicId = extractCloudinaryPublicId(existing.imageUrl);
    if (publicId) {
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (err: any) {
        console.error("Cloudinary delete warning:", err?.message || err);
      }
    }
  }

  await prisma.heroSlide.delete({ where: { id: slideId } });
  return { deleted: true, slideId };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function uploadToCloudinary(file: Express.Multer.File): Promise<string> {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    throw new LandingError(
      `Invalid file type: ${file.mimetype}. Allowed: JPEG, PNG, WebP, GIF.`,
      400
    );
  }
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "trionda-wears/landing",
        public_id: `hero-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error("Upload failed — no result returned"));
        resolve(result.secure_url);
      }
    );
    uploadStream.end(file.buffer);
  });
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
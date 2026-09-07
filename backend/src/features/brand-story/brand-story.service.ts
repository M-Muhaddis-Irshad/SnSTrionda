import { prisma } from "../../db";
import cloudinary from "../../config/cloudinary";

// Custom Error
export class BrandStoryError extends Error {
  public statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = "BrandStoryError";
  }
}

// Get the active brand story (for homepage)
export async function getActiveStory() {
  return prisma.brandStory.findFirst({
    where: { active: true },
    orderBy: { createdAt: "desc" },
  });
}

// Get all stories (admin)
export async function listStories() {
  return prisma.brandStory.findMany({
    orderBy: { createdAt: "desc" },
  });
}

// Get a single story
export async function getStory(storyId: string) {
  const story = await prisma.brandStory.findUnique({ where: { id: storyId } });
  if (!story) throw new BrandStoryError("Brand story not found", 404);
  return story;
}

// Create story
export async function createStory(data: { label?: string; heading: string; text: string; ctaLabel?: string; ctaHref?: string; imageUrl?: string; active?: boolean }, file?: Express.Multer.File) {
  if (!data.heading?.trim()) throw new BrandStoryError("Heading is required.", 400);
  if (!data.text?.trim()) throw new BrandStoryError("Text is required.", 400);

  let imageUrl = data.imageUrl?.trim() || null;
  if (file) imageUrl = await uploadToCloudinary(file);

  return prisma.brandStory.create({
    data: {
      label: data.label?.trim() || "Our Story",
      heading: data.heading.trim(),
      text: data.text.trim(),
      ctaLabel: data.ctaLabel?.trim() || "Read More",
      ctaHref: data.ctaHref?.trim() || "/about",
      imageUrl,
      active: data.active ?? true,
    },
  });
}

// Update story
export async function updateStory(storyId: string, data: { label?: string; heading?: string; text?: string; ctaLabel?: string; ctaHref?: string; imageUrl?: string; active?: boolean }, file?: Express.Multer.File) {
  const existing = await prisma.brandStory.findUnique({ where: { id: storyId } });
  if (!existing) throw new BrandStoryError("Brand story not found", 404);

  const updateData: any = {};
  if (data.label !== undefined) updateData.label = data.label?.trim() || "Our Story";
  if (data.heading !== undefined) {
    if (!data.heading.trim()) throw new BrandStoryError("Heading cannot be empty.", 400);
    updateData.heading = data.heading.trim();
  }
  if (data.text !== undefined) {
    if (!data.text.trim()) throw new BrandStoryError("Text cannot be empty.", 400);
    updateData.text = data.text.trim();
  }
  if (data.ctaLabel !== undefined) updateData.ctaLabel = data.ctaLabel?.trim() || "Read More";
  if (data.ctaHref !== undefined) updateData.ctaHref = data.ctaHref?.trim() || "/about";
  if (data.active !== undefined) updateData.active = data.active;

  if (file) {
    updateData.imageUrl = await uploadToCloudinary(file);
  } else if (data.imageUrl !== undefined) {
    updateData.imageUrl = data.imageUrl?.trim() || null;
  }

  return prisma.brandStory.update({ where: { id: storyId }, data: updateData });
}

// Delete story
export async function deleteStory(storyId: string) {
  const existing = await prisma.brandStory.findUnique({ where: { id: storyId } });
  if (!existing) throw new BrandStoryError("Brand story not found", 404);

  // Best-effort Cloudinary cleanup
  if (existing.imageUrl) {
    const publicId = extractCloudinaryPublicId(existing.imageUrl);
    if (publicId) {
      try { await cloudinary.uploader.destroy(publicId); } catch {}
    }
  }

  await prisma.brandStory.delete({ where: { id: storyId } });
  return { deleted: true, storyId };
}

// Helpers
async function uploadToCloudinary(file: Express.Multer.File): Promise<string> {
  const ALLOWED = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
  if (!ALLOWED.includes(file.mimetype)) {
    throw new BrandStoryError(`Invalid file type: ${file.mimetype}. Allowed: JPEG, PNG, WebP, GIF.`, 400);
  }
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "trionda-wears/brand-story", public_id: `brand-${Date.now()}`, resource_type: "image" },
      (error, result) => { if (error) return reject(error); if (!result) return reject(new Error("Upload failed")); resolve(result.secure_url); }
    );
    uploadStream.end(file.buffer);
  });
}

function extractCloudinaryPublicId(url: string): string | null {
  try {
    const parts = url.split("/upload/");
    if (parts.length < 2) return null;
    let path = parts[1].replace(/^v\d+/, "").replace(/\.[^.]+$/, "").replace(/^\//, "");
    return path || null;
  } catch { return null; }
}
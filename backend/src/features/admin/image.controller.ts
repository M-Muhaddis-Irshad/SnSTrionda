// =============================================================================
// Admin Feature — Site Media Image Handlers (Controller)
// =============================================================================

import { Request, Response } from "express";
import {
  listImages,
  createImage,
  updateImage,
  getImageUsage,
  deleteImage,
  MediaError,
} from "./image.service";

function handleError(err: any, res: Response) {
  if (err instanceof MediaError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  console.error("Image admin error:", err?.message || err);
  res.status(500).json({ error: "Internal server error" });
}

// ---------------------------------------------------------------------------
// GET /api/admin/images — list (paginated, category + search filters)
// ---------------------------------------------------------------------------

export async function handleListImages(req: Request, res: Response) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const category = (req.query.category as string) || undefined;
    const search = (req.query.search as string) || undefined;

    const result = await listImages({ page, limit, category, search });
    res.json(result);
  } catch (err: any) {
    handleError(err, res);
  }
}

// ---------------------------------------------------------------------------
// POST /api/admin/images — create image (multipart file upload or url)
// ---------------------------------------------------------------------------

export async function handleCreateImage(req: Request, res: Response) {
  try {
    const { name, alt, category } = req.body;
    const active = req.body.active === undefined ? undefined : req.body.active === "true" || req.body.active === true;
    const url = typeof req.body.url === "string" ? req.body.url : undefined;
    const file = req.file;

    if (!name) {
      return res.status(400).json({ error: "Image name is required." });
    }

    const image = await createImage({ name, alt, url, file, category, active });
    res.status(201).json({ data: image, message: "Image created successfully" });
  } catch (err: any) {
    handleError(err, res);
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/admin/images/:id — update image metadata
// ---------------------------------------------------------------------------

export async function handleUpdateImage(req: Request, res: Response) {
  try {
    const imageId = req.params.id as string;
    const { name, url, alt, category } = req.body;
    const active = req.body.active === undefined ? undefined : req.body.active === "true" || req.body.active === true;

    const image = await updateImage(imageId, { name, url, alt, category, active });
    res.json({ data: image, message: "Image updated successfully" });
  } catch (err: any) {
    handleError(err, res);
  }
}

// ---------------------------------------------------------------------------
// GET /api/admin/images/:id/usage — where is this image used?
// ---------------------------------------------------------------------------

export async function handleGetImageUsage(req: Request, res: Response) {
  try {
    const imageId = req.params.id as string;
    const result = await getImageUsage(imageId);
    res.json({ data: result });
  } catch (err: any) {
    handleError(err, res);
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/admin/images/:id — delete image (blocked while in use)
// ---------------------------------------------------------------------------

export async function handleDeleteImage(req: Request, res: Response) {
  try {
    const imageId = req.params.id as string;
    const result = await deleteImage(imageId);
    res.json({ ...result, message: "Image deleted successfully" });
  } catch (err: any) {
    handleError(err, res);
  }
}

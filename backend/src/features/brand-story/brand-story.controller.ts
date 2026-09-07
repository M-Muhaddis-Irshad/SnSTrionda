// =============================================================================
// Brand Story — Request Handlers (Controller)
// =============================================================================

import { Request, Response } from "express";
import {
  getActiveStory,
  listStories,
  getStory,
  createStory,
  updateStory,
  deleteStory,
  BrandStoryError,
} from "./brand-story.service";
import { broadcastCatalogChange } from "../../services/socketService";

function handleError(err: any, res: Response) {
  if (err instanceof BrandStoryError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  console.error("BrandStory error:", err?.message || err);
  res.status(500).json({ error: "Internal server error" });
}

// Public — GET /api/brand-story
export async function handleGetActiveStory(_req: Request, res: Response) {
  try {
    const story = await getActiveStory();
    res.json({ data: story });
  } catch (err: any) {
    handleError(err, res);
  }
}

// Admin CRUD — mounted at /api/admin/brand-story
export async function handleListStories(_req: Request, res: Response) {
  try {
    const stories = await listStories();
    res.json({ data: stories });
  } catch (err: any) {
    handleError(err, res);
  }
}

export async function handleGetStory(req: Request, res: Response) {
  try {
    const story = await getStory(req.params.id as string);
    res.json({ data: story });
  } catch (err: any) {
    handleError(err, res);
  }
}

export async function handleCreateStory(req: Request, res: Response) {
  try {
    const body = req.body;
    const story = await createStory(
      {
        label: body.label,
        heading: body.heading,
        text: body.text,
        ctaLabel: body.ctaLabel,
        ctaHref: body.ctaHref,
        imageUrl: typeof body.imageUrl === "string" ? body.imageUrl : undefined,
        active: body.active === undefined ? undefined : body.active === "true" || body.active === true,
      },
      req.file
    );
    broadcastCatalogChange("created", "settings", { entity: "brand-story", id: story.id });
    res.status(201).json({ data: story, message: "Brand story created successfully" });
  } catch (err: any) {
    handleError(err, res);
  }
}

export async function handleUpdateStory(req: Request, res: Response) {
  try {
    const body = req.body;
    const story = await updateStory(
      req.params.id as string,
      {
        label: body.label,
        heading: body.heading,
        text: body.text,
        ctaLabel: body.ctaLabel,
        ctaHref: body.ctaHref,
        imageUrl: typeof body.imageUrl === "string" ? body.imageUrl : undefined,
        active: body.active === undefined ? undefined : body.active === "true" || body.active === true,
      },
      req.file
    );
    broadcastCatalogChange("updated", "settings", { entity: "brand-story", id: story.id });
    res.json({ data: story, message: "Brand story updated successfully" });
  } catch (err: any) {
    handleError(err, res);
  }
}

export async function handleDeleteStory(req: Request, res: Response) {
  try {
    const result = await deleteStory(req.params.id as string);
    broadcastCatalogChange("deleted", "settings", { entity: "brand-story", id: req.params.id as string });
    res.json({ ...result, message: "Brand story deleted successfully" });
  } catch (err: any) {
    handleError(err, res);
  }
}

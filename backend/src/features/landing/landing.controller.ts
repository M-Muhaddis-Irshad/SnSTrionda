// =============================================================================
// Landing Feature — Request Handlers (Controller)
// =============================================================================

import { Request, Response } from "express";
import {
  listActiveSlides,
  listSlides,
  getSlide,
  createSlide,
  updateSlide,
  deleteSlide,
  LandingError,
} from "./landing.service";
import { broadcastCatalogChange } from "../../services/socketService";

function handleError(err: any, res: Response) {
  if (err instanceof LandingError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  console.error("Landing error:", err?.message || err);
  res.status(500).json({ error: "Internal server error" });
}

// ---------------------------------------------------------------------------
// Public — GET /api/landing (active slides for the storefront hero)
// ---------------------------------------------------------------------------

export async function handleListActiveSlides(req: Request, res: Response) {
  try {
    const slides = await listActiveSlides();
    res.json({ data: slides });
  } catch (err: any) {
    handleError(err, res);
  }
}

// ---------------------------------------------------------------------------
// Admin CRUD — mounted behind /api/admin/landing
// ---------------------------------------------------------------------------

export async function handleListSlides(req: Request, res: Response) {
  try {
    const slides = await listSlides();
    res.json({ data: slides });
  } catch (err: any) {
    handleError(err, res);
  }
}

export async function handleGetSlide(req: Request, res: Response) {
  try {
    const slide = await getSlide(req.params.id as string);
    res.json({ data: slide });
  } catch (err: any) {
    handleError(err, res);
  }
}

export async function handleCreateSlide(req: Request, res: Response) {
  try {
    const body = req.body;
    const slide = await createSlide(
      {
        heading: body.heading,
        headingAccent: body.headingAccent,
        subheading: body.subheading,
        ctaLabel: body.ctaLabel,
        ctaHref: body.ctaHref,
        imageUrl: typeof body.imageUrl === "string" ? body.imageUrl : undefined,
        overlayGradient: body.overlayGradient,
        active: body.active === undefined ? undefined : body.active === "true" || body.active === true,
        sortOrder: body.sortOrder === undefined || body.sortOrder === "" ? undefined : Number(body.sortOrder),
      },
      req.file
    );
    broadcastCatalogChange("created", "settings", { entity: "landing", id: slide.id });
    res.status(201).json({ data: slide, message: "Slide created successfully" });
  } catch (err: any) {
    handleError(err, res);
  }
}

export async function handleUpdateSlide(req: Request, res: Response) {
  try {
    const body = req.body;
    const slide = await updateSlide(
      req.params.id as string,
      {
        heading: body.heading,
        headingAccent: body.headingAccent,
        subheading: body.subheading,
        ctaLabel: body.ctaLabel,
        ctaHref: body.ctaHref,
        imageUrl: typeof body.imageUrl === "string" ? body.imageUrl : undefined,
        overlayGradient: body.overlayGradient,
        active: body.active === undefined ? undefined : body.active === "true" || body.active === true,
        sortOrder: body.sortOrder === undefined || body.sortOrder === "" ? undefined : Number(body.sortOrder),
      },
      req.file
    );
    broadcastCatalogChange("updated", "settings", { entity: "landing", id: slide.id });
    res.json({ data: slide, message: "Slide updated successfully" });
  } catch (err: any) {
    handleError(err, res);
  }
}

export async function handleDeleteSlide(req: Request, res: Response) {
  try {
    const result = await deleteSlide(req.params.id as string);
    broadcastCatalogChange("deleted", "settings", { entity: "landing", id: req.params.id as string });
    res.json({ ...result, message: "Slide deleted successfully" });
  } catch (err: any) {
    handleError(err, res);
  }
}
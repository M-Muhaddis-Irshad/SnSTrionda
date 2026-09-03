// =============================================================================
// Products Feature — Request Handlers (Controller)
// =============================================================================

import { Request, Response } from "express";
import { listProducts, getProductBySlug, listCategories, type ListProductsParams } from "./products.service";
import { AppError } from "../auth/auth.service";

// ---------------------------------------------------------------------------
// GET /api/products
// ---------------------------------------------------------------------------

export async function handleListProducts(req: Request, res: Response) {
  try {
    // Parse pagination query params
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 12));
    const search = (req.query.search as string) || undefined;
    const category = (req.query.category as string) || undefined;
    const minPrice = req.query.minPrice ? Number(req.query.minPrice) : undefined;
    const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : undefined;
    const sizes = (req.query.sizes as string)?.split(",").map((s) => s.trim()).filter(Boolean) || undefined;
    const colors = (req.query.colors as string)?.split(",").map((s) => s.trim()).filter(Boolean) || undefined;
    const materials = (req.query.materials as string)?.split(",").map((s) => s.trim()).filter(Boolean) || undefined;
    const sort = (req.query.sort as string) as ListProductsParams["sort"] | undefined;

    const result = await listProducts({
      page,
      limit,
      search,
      category,
      minPrice,
      maxPrice,
      sizes,
      colors,
      materials,
      sort,
    });

    res.json({
      message: "Products retrieved successfully",
      ...result,
    });
  } catch (err: any) {
    console.error("List products error:", err?.message || err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// ---------------------------------------------------------------------------
// GET /api/products/categories
// ---------------------------------------------------------------------------

export async function handleListCategories(_req: Request, res: Response) {
  try {
    const categories = await listCategories();
    res.json({ data: categories });
  } catch (err: any) {
    console.error("List categories error:", err?.message || err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// ---------------------------------------------------------------------------
// GET /api/products/:slug
// ---------------------------------------------------------------------------

export async function handleGetProductBySlug(req: Request<{ slug: string }>, res: Response) {
  try {
    const { slug } = req.params;

    if (!slug) {
      return res.status(400).json({ error: "Product slug is required" });
    }

    const product = await getProductBySlug(slug);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({
      message: "Product retrieved successfully",
      data: product,
    });
  } catch (err: any) {
    console.error("Get product error:", err?.message || err);
    res.status(500).json({ error: "Internal server error" });
  }
}

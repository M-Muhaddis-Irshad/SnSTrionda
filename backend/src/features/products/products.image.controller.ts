// =============================================================================
// Products Feature — Image Upload/Delete Request Handlers
// =============================================================================

import { Request, Response } from "express";
import { uploadProductImage, deleteProductImage, ImageError } from "./products.image.service";

// ---------------------------------------------------------------------------
// POST /api/products/:productId/images
// ---------------------------------------------------------------------------

export async function handleUploadImage(req: Request, res: Response) {
  try {
    const productId = req.params.productId as string;

    if (!req.file) {
      return res.status(400).json({ error: "No image file provided. Send a multipart/form-data file with field name 'image'." });
    }

    const { altText, displayOrder } = req.body;

    const result = await uploadProductImage({
      productId,
      file: req.file,
      altText: altText || undefined,
      displayOrder: displayOrder ? parseInt(displayOrder) : undefined,
    });

    res.status(201).json({
      message: "Image uploaded successfully",
      data: result,
    });
  } catch (err: any) {
    if (err instanceof ImageError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error("Upload image error:", err?.message || err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/products/:productId/images/:imageId
// ---------------------------------------------------------------------------

export async function handleDeleteImage(req: Request, res: Response) {
  try {
    const productId = req.params.productId as string;
    const imageId = req.params.imageId as string;

    const result = await deleteProductImage(productId, imageId);

    res.json({
      message: "Image deleted successfully",
      data: result,
    });
  } catch (err: any) {
    if (err instanceof ImageError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error("Delete image error:", err?.message || err);
    res.status(500).json({ error: "Internal server error" });
  }
}

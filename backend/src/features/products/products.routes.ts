// =============================================================================
// Products Feature — Route Definitions
// =============================================================================

import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import { handleListProducts, handleGetProductBySlug, handleListCategories } from "./products.controller";
import { handleUploadImage, handleDeleteImage } from "./products.image.controller";
import { handleListProductReviews } from "../reviews/reviews.controller";
import { authenticate, requireRole } from "../auth/auth.middleware";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname));
    }
  },
});

// Multer error handler — returns 400 instead of 500
function handleMulterError(err: any, _req: Request, res: Response, next: NextFunction) {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message || "File upload error" });
  }
  if (err?.message?.includes("Only JPEG")) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
}

// ---------------------------------------------------------------------------
// Product image routes (must come before /:slug to avoid param conflict)
// ---------------------------------------------------------------------------

// POST /api/products/:productId/images — upload image (admin only)
router.post(
  "/:productId/images",
  authenticate,
  requireRole("ADMIN"),
  upload.single("image"),
  handleMulterError,
  handleUploadImage
);

// DELETE /api/products/:productId/images/:imageId — delete image (admin only)
router.delete(
  "/:productId/images/:imageId",
  authenticate,
  requireRole("ADMIN"),
  handleDeleteImage
);

// ---------------------------------------------------------------------------
// Public category list (for homepage/shop filtering)
// ---------------------------------------------------------------------------

router.get("/categories", handleListCategories);

// ---------------------------------------------------------------------------
// Public product reviews — APPROVED reviews only (must precede /:slug)
// ---------------------------------------------------------------------------

router.get("/:productId/reviews", handleListProductReviews);

// ---------------------------------------------------------------------------
// Product routes (/:slug must come after image routes)
// ---------------------------------------------------------------------------

router.get("/", handleListProducts);
router.get("/:slug", handleGetProductBySlug);

export default router;

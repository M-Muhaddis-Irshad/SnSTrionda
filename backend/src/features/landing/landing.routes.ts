// =============================================================================
// Landing Feature — Route Definitions
// =============================================================================

import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import {
  handleListActiveSlides,
  handleListSlides,
  handleGetSlide,
  handleCreateSlide,
  handleUpdateSlide,
  handleDeleteSlide,
} from "./landing.controller";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB — hero banners can be large
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname));
    }
  },
});

function handleMulterError(err: any, _req: Request, res: Response, next: NextFunction) {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message || "File upload error" });
  }
  next(err);
}

// Public — storefront hero
router.get("/", handleListActiveSlides);

// Admin CRUD — mounted at /api/admin/landing
export const landingAdminRoutes = Router();
landingAdminRoutes.get("/", handleListSlides);
landingAdminRoutes.get("/:id", handleGetSlide);
landingAdminRoutes.post("/", upload.single("image"), handleMulterError, handleCreateSlide);
landingAdminRoutes.patch("/:id", upload.single("image"), handleMulterError, handleUpdateSlide);
landingAdminRoutes.delete("/:id", handleDeleteSlide);

export default router;
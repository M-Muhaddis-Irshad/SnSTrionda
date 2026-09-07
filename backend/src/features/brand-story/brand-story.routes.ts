// =============================================================================
// Brand Story — Route Definitions
// =============================================================================

import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import {
  handleGetActiveStory,
  handleListStories,
  handleGetStory,
  handleCreateStory,
  handleUpdateStory,
  handleDeleteStory,
} from "./brand-story.controller";

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

function handleMulterError(err: any, _req: Request, res: Response, next: NextFunction) {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message || "File upload error" });
  }
  next(err);
}

// Public — active brand story for homepage
router.get("/", handleGetActiveStory);

// Admin CRUD — mounted at /api/admin/brand-story
export const brandStoryAdminRoutes = Router();
brandStoryAdminRoutes.get("/", handleListStories);
brandStoryAdminRoutes.get("/:id", handleGetStory);
brandStoryAdminRoutes.post("/", upload.single("image"), handleMulterError, handleCreateStory);
brandStoryAdminRoutes.patch("/:id", upload.single("image"), handleMulterError, handleUpdateStory);
brandStoryAdminRoutes.delete("/:id", handleDeleteStory);

export default router;

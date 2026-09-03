// =============================================================================
// Admin Feature — Site Media Image Routes
// =============================================================================
// NOTE: Mounted inside admin.routes.ts AFTER the authenticate + requireRole("ADMIN")
// middleware, so every route below is admin-protected automatically.

import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import {
  handleListImages,
  handleCreateImage,
  handleUpdateImage,
  handleGetImageUsage,
  handleDeleteImage,
} from "./image.controller";

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

router.get("/", handleListImages);
router.post("/", upload.single("image"), handleMulterError, handleCreateImage);
router.patch("/:id", handleUpdateImage);
router.delete("/:id", handleDeleteImage);
router.get("/:id/usage", handleGetImageUsage);

export default router;

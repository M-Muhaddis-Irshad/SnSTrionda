// =============================================================================
// Auth Feature — Route Definitions
// =============================================================================

import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import rateLimit from "express-rate-limit";
import {
  handleRegister,
  handleLogin,
  handleGoogleLogin,
  handleRefresh,
  handleLogout,
  handleMe,
  handleUpdateProfile,
  handleUploadAvatar,
  handleAdminCheck,
  handleGetAuthImage,
  handleForgotPassword,
  handleResetPassword,
} from "./auth.controller";
import { authenticate, requireRole } from "./auth.middleware";

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

// ---------------------------------------------------------------------------
// Stricter per-route limits for the reset flow (they run inside the broader
// /api/auth limiter, so whichever fires first wins).
// ---------------------------------------------------------------------------
const forgotPasswordLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many reset requests. Please try again in 10 minutes." },
});

const resetPasswordLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Please try again in 5 minutes." },
});

// Public routes
router.post("/register", handleRegister);
router.post("/login", handleLogin);
router.post("/google", handleGoogleLogin);
router.post("/forgot-password", forgotPasswordLimiter, handleForgotPassword);
router.post("/reset-password", resetPasswordLimiter, handleResetPassword);
router.post("/refresh", handleRefresh);
router.post("/logout", handleLogout);
router.get("/images/:pageType", handleGetAuthImage);

// Protected routes — require valid access token
router.get("/me", authenticate, handleMe);
router.patch("/me", authenticate, handleUpdateProfile);
router.post("/me/avatar", authenticate, upload.single("image"), handleMulterError, handleUploadAvatar);

// Admin-only routes — require authenticate + ADMIN role
router.get("/admin-check", authenticate, requireRole("ADMIN", "SUPER_ADMIN"), handleAdminCheck);

export default router;

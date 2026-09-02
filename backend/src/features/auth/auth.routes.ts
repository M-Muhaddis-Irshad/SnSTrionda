// =============================================================================
// Auth Feature — Route Definitions
// =============================================================================

import { Router } from "express";
import {
  handleRegister,
  handleLogin,
  handleGoogleLogin,
  handleRefresh,
  handleLogout,
  handleMe,
  handleAdminCheck,
  handleGetAuthImage,
} from "./auth.controller";
import { authenticate, requireRole } from "./auth.middleware";

const router = Router();

// Public routes
router.post("/register", handleRegister);
router.post("/login", handleLogin);
router.post("/google", handleGoogleLogin);
router.post("/refresh", handleRefresh);
router.post("/logout", handleLogout);
router.get("/images/:pageType", handleGetAuthImage);

// Protected routes — require valid access token
router.get("/me", authenticate, handleMe);

// Admin-only routes — require authenticate + ADMIN role
router.get("/admin-check", authenticate, requireRole("ADMIN"), handleAdminCheck);

export default router;

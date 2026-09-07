// =============================================================================
// Store Settings Feature — Route Definitions
// =============================================================================
// Public:  GET  /api/settings (storefront-facing configuration)
// Admin:   /api/admin/settings (mounted behind the admin auth middleware)
// =============================================================================

import { Router } from "express";
import {
  handleGetPublicSettings,
  handleGetAdminSettings,
  handleUpdateSettings,
} from "./setting.controller";

// Public routes
export const settingPublicRoutes = Router();
settingPublicRoutes.get("/", handleGetPublicSettings);

// Admin routes (auth handled by the admin router that mounts this)
export const settingAdminRoutes = Router();
settingAdminRoutes.get("/", handleGetAdminSettings);
settingAdminRoutes.put("/", handleUpdateSettings);

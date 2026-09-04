// =============================================================================
// Users Feature — Route Definitions (admin user management)
// =============================================================================
// Mounted at /api/admin/users. No DELETE endpoint by design — deleting users
// with real order history is a data-integrity risk; role changes only.
// =============================================================================

import { Router } from "express";
import { authenticate, requireRole } from "../auth/auth.middleware";
import {
  handleListUsers,
  handleGetUserProfile,
  handleChangeUserRole,
} from "./users.controller";

const router = Router();

// All routes require authentication + ADMIN role
router.use(authenticate, requireRole("ADMIN"));

// GET /api/admin/users?page&limit&role&search — paginated list
router.get("/", handleListUsers);

// GET /api/admin/users/:userId — full profile (no password, order summary)
router.get("/:userId", handleGetUserProfile);

// PATCH /api/admin/users/:userId/role — change CUSTOMER <-> ADMIN
router.patch("/:userId/role", handleChangeUserRole);

export default router;

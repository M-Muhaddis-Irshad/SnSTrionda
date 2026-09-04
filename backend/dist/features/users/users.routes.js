"use strict";
// =============================================================================
// Users Feature — Route Definitions (admin user management)
// =============================================================================
// Mounted at /api/admin/users. No DELETE endpoint by design — deleting users
// with real order history is a data-integrity risk; role changes only.
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../auth/auth.middleware");
const users_controller_1 = require("./users.controller");
const router = (0, express_1.Router)();
// All routes require authentication + ADMIN role
router.use(auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)("ADMIN"));
// GET /api/admin/users?page&limit&role&search — paginated list
router.get("/", users_controller_1.handleListUsers);
// GET /api/admin/users/:userId — full profile (no password, order summary)
router.get("/:userId", users_controller_1.handleGetUserProfile);
// PATCH /api/admin/users/:userId/role — change CUSTOMER <-> ADMIN
router.patch("/:userId/role", users_controller_1.handleChangeUserRole);
exports.default = router;
//# sourceMappingURL=users.routes.js.map
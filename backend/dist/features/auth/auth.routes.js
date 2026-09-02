"use strict";
// =============================================================================
// Auth Feature — Route Definitions
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("./auth.controller");
const auth_middleware_1 = require("./auth.middleware");
const router = (0, express_1.Router)();
// Public routes
router.post("/register", auth_controller_1.handleRegister);
router.post("/login", auth_controller_1.handleLogin);
router.post("/refresh", auth_controller_1.handleRefresh);
router.post("/logout", auth_controller_1.handleLogout);
router.get("/images/:pageType", auth_controller_1.handleGetAuthImage);
// Protected routes — require valid access token
router.get("/me", auth_middleware_1.authenticate, auth_controller_1.handleMe);
// Admin-only routes — require authenticate + ADMIN role
router.get("/admin-check", auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)("ADMIN"), auth_controller_1.handleAdminCheck);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map
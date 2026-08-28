"use strict";
// =============================================================================
// Auth Feature — Route Definitions
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("./auth.controller");
const router = (0, express_1.Router)();
router.post("/register", auth_controller_1.handleRegister);
router.post("/login", auth_controller_1.handleLogin);
router.post("/refresh", auth_controller_1.handleRefresh);
router.post("/logout", auth_controller_1.handleLogout);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map
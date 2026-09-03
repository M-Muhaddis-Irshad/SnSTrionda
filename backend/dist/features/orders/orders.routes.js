"use strict";
// =============================================================================
// Orders Feature — Route Definitions
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const orders_controller_1 = require("./orders.controller");
const auth_optional_1 = require("../auth/auth.optional");
const auth_middleware_1 = require("../auth/auth.middleware");
const router = (0, express_1.Router)();
// GET /api/orders/promo/validate?code=... — public promo code validation
// Must come before /:orderNumber to avoid route collision
router.get("/promo/validate", orders_controller_1.handleValidatePromo);
// GET /api/orders/mine — customer's own orders list (authenticated)
// Must come before /:orderNumber to avoid route collision
router.get("/mine", auth_middleware_1.authenticate, orders_controller_1.handleGetMyOrders);
// GET /api/orders/mine/:orderNumber — customer's own single order (authenticated)
router.get("/mine/:orderNumber", auth_middleware_1.authenticate, orders_controller_1.handleGetMyOrder);
// GET /api/orders/:orderNumber — public, requires email verification
router.get("/:orderNumber", orders_controller_1.handleGetOrder);
// POST /api/orders — create order (optional auth for guest checkout)
router.post("/", auth_optional_1.optionalAuth, orders_controller_1.handleCreateOrder);
exports.default = router;
//# sourceMappingURL=orders.routes.js.map
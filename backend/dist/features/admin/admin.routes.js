"use strict";
// =============================================================================
// Admin Feature — Route Definitions
// =============================================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../auth/auth.middleware");
const admin_controller_1 = require("./admin.controller");
const image_routes_1 = __importDefault(require("./image.routes"));
const campaign_routes_1 = __importDefault(require("./campaign.routes"));
const router = (0, express_1.Router)();
// ---------------------------------------------------------------------------
// All admin routes require authentication + ADMIN role
// ---------------------------------------------------------------------------
router.use(auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)("ADMIN"));
// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
router.get("/dashboard/stats", admin_controller_1.handleGetDashboardStats);
// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------
router.get("/orders", admin_controller_1.handleListOrders);
router.get("/orders/:orderId", admin_controller_1.handleGetOrder);
router.patch("/orders/:orderId/status", admin_controller_1.handleUpdateOrderStatus);
// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------
router.get("/products", admin_controller_1.handleAdminListProducts);
router.get("/products/:productId", admin_controller_1.handleGetProduct);
router.post("/products", admin_controller_1.handleCreateProduct);
router.put("/products/:productId", admin_controller_1.handleUpdateProduct);
router.delete("/products/:productId", admin_controller_1.handleDeleteProduct);
// ---------------------------------------------------------------------------
// Site media — images & campaigns
// ---------------------------------------------------------------------------
router.use("/images", image_routes_1.default);
router.use("/campaigns", campaign_routes_1.default);
// ---------------------------------------------------------------------------
// Categories (read-only for admin forms)
// ---------------------------------------------------------------------------
router.get("/categories", admin_controller_1.handleListCategories);
// ---------------------------------------------------------------------------
// Variants (nested under product)
// ---------------------------------------------------------------------------
router.post("/products/:productId/variants", admin_controller_1.handleCreateVariant);
router.put("/variants/:variantId", admin_controller_1.handleUpdateVariant);
router.delete("/variants/:variantId", admin_controller_1.handleDeleteVariant);
exports.default = router;
//# sourceMappingURL=admin.routes.js.map
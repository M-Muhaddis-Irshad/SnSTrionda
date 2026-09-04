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
const delivery_controller_1 = require("../delivery/delivery.controller");
const reviews_controller_1 = require("../reviews/reviews.controller");
const activity_controller_1 = require("../activity/activity.controller");
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
// Categories — full CRUD (write routes added for the admin Categories page)
// ---------------------------------------------------------------------------
router.get("/categories", admin_controller_1.handleListCategories);
router.post("/categories", admin_controller_1.handleCreateCategory);
router.put("/categories/:categoryId", admin_controller_1.handleUpdateCategory);
router.delete("/categories/:categoryId", admin_controller_1.handleDeleteCategory);
// ---------------------------------------------------------------------------
// Delivery zones — full CRUD
// ---------------------------------------------------------------------------
router.get("/delivery-zones", delivery_controller_1.handleAdminListDeliveryZones);
router.get("/delivery-zones/:id", delivery_controller_1.handleAdminGetDeliveryZone);
router.post("/delivery-zones", delivery_controller_1.handleAdminCreateDeliveryZone);
router.patch("/delivery-zones/:id", delivery_controller_1.handleAdminUpdateDeliveryZone);
router.delete("/delivery-zones/:id", delivery_controller_1.handleAdminDeleteDeliveryZone);
// ---------------------------------------------------------------------------
// Reviews — moderation workflow (approve / reject / unapprove / delete)
// ---------------------------------------------------------------------------
router.get("/reviews", reviews_controller_1.handleAdminListReviews);
router.get("/reviews/:id", reviews_controller_1.handleAdminGetReview);
router.patch("/reviews/:id/approve", reviews_controller_1.handleAdminApproveReview);
router.patch("/reviews/:id/reject", reviews_controller_1.handleAdminRejectReview);
router.patch("/reviews/:id/unapprove", reviews_controller_1.handleAdminUnapproveReview);
router.delete("/reviews/:id", reviews_controller_1.handleAdminDeleteReview);
// ---------------------------------------------------------------------------
// Activity feed (audit trail)
// ---------------------------------------------------------------------------
router.get("/activity", activity_controller_1.handleListActivity);
// ---------------------------------------------------------------------------
// Variants (nested under product)
// ---------------------------------------------------------------------------
router.post("/products/:productId/variants", admin_controller_1.handleCreateVariant);
router.put("/variants/:variantId", admin_controller_1.handleUpdateVariant);
router.delete("/variants/:variantId", admin_controller_1.handleDeleteVariant);
exports.default = router;
//# sourceMappingURL=admin.routes.js.map
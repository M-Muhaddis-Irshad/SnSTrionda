// =============================================================================
// Admin Feature — Route Definitions
// =============================================================================

import { Router } from "express";
import { authenticate, requireRole } from "../auth/auth.middleware";
import {
  handleGetDashboardStats,
  handleListOrders,
  handleGetOrder,
  handleUpdateOrderStatus,
  handleAdminListProducts,
  handleGetProduct,
  handleCreateProduct,
  handleUpdateProduct,
  handleDeleteProduct,
  handleListCategories,
  handleCreateCategory,
  handleUpdateCategory,
  handleDeleteCategory,
  handleCreateVariant,
  handleUpdateVariant,
  handleDeleteVariant,
} from "./admin.controller";
import imageRouter from "./image.routes";
import campaignRouter from "./campaign.routes";
import {
  handleAdminListDeliveryZones,
  handleAdminGetDeliveryZone,
  handleAdminCreateDeliveryZone,
  handleAdminUpdateDeliveryZone,
  handleAdminDeleteDeliveryZone,
} from "../delivery/delivery.controller";
import {
  handleAdminListReviews,
  handleAdminGetReview,
  handleAdminApproveReview,
  handleAdminRejectReview,
  handleAdminUnapproveReview,
  handleAdminDeleteReview,
} from "../reviews/reviews.controller";
import { handleListActivity } from "../activity/activity.controller";

const router = Router();

// ---------------------------------------------------------------------------
// All admin routes require authentication + ADMIN role
// ---------------------------------------------------------------------------

router.use(authenticate, requireRole("ADMIN"));

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

router.get("/dashboard/stats", handleGetDashboardStats);

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

router.get("/orders", handleListOrders);
router.get("/orders/:orderId", handleGetOrder);
router.patch("/orders/:orderId/status", handleUpdateOrderStatus);

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

router.get("/products", handleAdminListProducts);
router.get("/products/:productId", handleGetProduct);
router.post("/products", handleCreateProduct);
router.put("/products/:productId", handleUpdateProduct);
router.delete("/products/:productId", handleDeleteProduct);

// ---------------------------------------------------------------------------
// Site media — images & campaigns
// ---------------------------------------------------------------------------

router.use("/images", imageRouter);
router.use("/campaigns", campaignRouter);

// ---------------------------------------------------------------------------
// Categories — full CRUD (write routes added for the admin Categories page)
// ---------------------------------------------------------------------------

router.get("/categories", handleListCategories);
router.post("/categories", handleCreateCategory);
router.put("/categories/:categoryId", handleUpdateCategory);
router.delete("/categories/:categoryId", handleDeleteCategory);

// ---------------------------------------------------------------------------
// Delivery zones — full CRUD
// ---------------------------------------------------------------------------

router.get("/delivery-zones", handleAdminListDeliveryZones);
router.get("/delivery-zones/:id", handleAdminGetDeliveryZone);
router.post("/delivery-zones", handleAdminCreateDeliveryZone);
router.patch("/delivery-zones/:id", handleAdminUpdateDeliveryZone);
router.delete("/delivery-zones/:id", handleAdminDeleteDeliveryZone);

// ---------------------------------------------------------------------------
// Reviews — moderation workflow (approve / reject / unapprove / delete)
// ---------------------------------------------------------------------------

router.get("/reviews", handleAdminListReviews);
router.get("/reviews/:id", handleAdminGetReview);
router.patch("/reviews/:id/approve", handleAdminApproveReview);
router.patch("/reviews/:id/reject", handleAdminRejectReview);
router.patch("/reviews/:id/unapprove", handleAdminUnapproveReview);
router.delete("/reviews/:id", handleAdminDeleteReview);

// ---------------------------------------------------------------------------
// Activity feed (audit trail)
// ---------------------------------------------------------------------------

router.get("/activity", handleListActivity);

// ---------------------------------------------------------------------------
// Variants (nested under product)
// ---------------------------------------------------------------------------

router.post("/products/:productId/variants", handleCreateVariant);
router.put("/variants/:variantId", handleUpdateVariant);
router.delete("/variants/:variantId", handleDeleteVariant);

export default router;

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
  handleCreateVariant,
  handleUpdateVariant,
  handleDeleteVariant,
} from "./admin.controller";
import imageRouter from "./image.routes";
import campaignRouter from "./campaign.routes";

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
// Categories (read-only for admin forms)
// ---------------------------------------------------------------------------

router.get("/categories", handleListCategories);

// ---------------------------------------------------------------------------
// Variants (nested under product)
// ---------------------------------------------------------------------------

router.post("/products/:productId/variants", handleCreateVariant);
router.put("/variants/:variantId", handleUpdateVariant);
router.delete("/variants/:variantId", handleDeleteVariant);

export default router;

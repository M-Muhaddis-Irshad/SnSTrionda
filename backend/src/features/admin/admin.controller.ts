// =============================================================================
// Admin Feature — Request Handlers (Controller)
// =============================================================================

import { Request, Response } from "express";
import {
  getDashboardStats,
  listOrders,
  getOrderById,
  updateOrderStatus,
  adminListProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  listCategories,
  updateVariant,
  deleteVariant,
  createVariant,
  AdminError,
} from "./admin.service";

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function handleAdminError(err: any, res: Response) {
  if (err instanceof AdminError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  console.error("Admin error:", err?.message || err);
  res.status(500).json({ error: "Internal server error" });
}

// ===========================================================================
// DASHBOARD
// ===========================================================================

export async function handleGetDashboardStats(_req: Request, res: Response) {
  try {
    const stats = await getDashboardStats();
    res.json({ data: stats });
  } catch (err: any) {
    handleAdminError(err, res);
  }
}

// ===========================================================================
// ORDERS
// ===========================================================================

export async function handleListOrders(req: Request, res: Response) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const status = (req.query.status as string) || undefined;
    const search = (req.query.search as string) || undefined;

    const result = await listOrders({ page, limit, status, search });
    res.json(result);
  } catch (err: any) {
    handleAdminError(err, res);
  }
}

export async function handleGetOrder(req: Request, res: Response) {
  try {
    const orderId = req.params.orderId as string;
    const order = await getOrderById(orderId);
    res.json({ data: order });
  } catch (err: any) {
    handleAdminError(err, res);
  }
}

export async function handleUpdateOrderStatus(req: Request, res: Response) {
  try {
    const orderId = req.params.orderId as string;
    const { status, paymentStatus } = req.body;

    if (!status && !paymentStatus) {
      return res.status(400).json({ error: "Provide at least one of: status, paymentStatus" });
    }

    const order = await updateOrderStatus(orderId, { status, paymentStatus });
    res.json({ data: order, message: "Order updated successfully" });
  } catch (err: any) {
    handleAdminError(err, res);
  }
}

// ===========================================================================
// PRODUCTS
// ===========================================================================

export async function handleAdminListProducts(req: Request, res: Response) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const search = (req.query.search as string) || undefined;
    const includeInactive = req.query.includeInactive === "true";

    const result = await adminListProducts({ page, limit, search, includeInactive });
    res.json(result);
  } catch (err: any) {
    handleAdminError(err, res);
  }
}

export async function handleGetProduct(req: Request, res: Response) {
  try {
    const productId = req.params.productId as string;
    const product = await getProductById(productId);
    res.json({ data: product });
  } catch (err: any) {
    handleAdminError(err, res);
  }
}

export async function handleCreateProduct(req: Request, res: Response) {
  try {
    const { name, slug, description, basePrice, isCustomizable, categoryId, variants } = req.body;

    if (!name || basePrice === undefined || !categoryId) {
      return res.status(400).json({
        error: "Missing required fields: name, basePrice, categoryId",
      });
    }

    const product = await createProduct({
      name,
      slug,
      description,
      basePrice: Number(basePrice),
      isCustomizable,
      categoryId,
      variants,
    });

    res.status(201).json({ data: product, message: "Product created successfully" });
  } catch (err: any) {
    handleAdminError(err, res);
  }
}

export async function handleUpdateProduct(req: Request, res: Response) {
  try {
    const productId = req.params.productId as string;
    const { name, description, basePrice, isCustomizable, isActive, categoryId } = req.body;

    const product = await updateProduct(productId, {
      name,
      description,
      basePrice: basePrice !== undefined ? Number(basePrice) : undefined,
      isCustomizable,
      isActive,
      categoryId,
    });

    res.json({ data: product, message: "Product updated successfully" });
  } catch (err: any) {
    handleAdminError(err, res);
  }
}

export async function handleDeleteProduct(req: Request, res: Response) {
  try {
    const productId = req.params.productId as string;
    const result = await deleteProduct(productId);
    res.json({ ...result, message: "Product deactivated successfully" });
  } catch (err: any) {
    handleAdminError(err, res);
  }
}

export async function handleListCategories(_req: Request, res: Response) {
  try {
    const categories = await listCategories();
    res.json({ data: categories });
  } catch (err: any) {
    handleAdminError(err, res);
  }
}

// ===========================================================================
// VARIANTS
// ===========================================================================

export async function handleCreateVariant(req: Request, res: Response) {
  try {
    const productId = req.params.productId as string;
    const { size, color, fabricType, sku, price, stockQuantity } = req.body;

    if (!sku) {
      return res.status(400).json({ error: "SKU is required" });
    }

    const variant = await createVariant(productId, {
      size,
      color,
      fabricType,
      sku,
      price: price !== undefined ? Number(price) : undefined,
      stockQuantity: stockQuantity !== undefined ? Number(stockQuantity) : undefined,
    });

    res.status(201).json({ data: variant, message: "Variant created successfully" });
  } catch (err: any) {
    handleAdminError(err, res);
  }
}

export async function handleUpdateVariant(req: Request, res: Response) {
  try {
    const variantId = req.params.variantId as string;
    const { size, color, fabricType, sku, price, stockQuantity } = req.body;

    const variant = await updateVariant(variantId, {
      size,
      color,
      fabricType,
      sku,
      price: price !== undefined ? Number(price) : undefined,
      stockQuantity: stockQuantity !== undefined ? Number(stockQuantity) : undefined,
    });

    res.json({ data: variant, message: "Variant updated successfully" });
  } catch (err: any) {
    handleAdminError(err, res);
  }
}

export async function handleDeleteVariant(req: Request, res: Response) {
  try {
    const variantId = req.params.variantId as string;
    const result = await deleteVariant(variantId);
    res.json({ ...result, message: "Variant deleted successfully" });
  } catch (err: any) {
    handleAdminError(err, res);
  }
}

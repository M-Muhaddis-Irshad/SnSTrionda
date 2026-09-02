"use strict";
// =============================================================================
// Admin Feature — Request Handlers (Controller)
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGetDashboardStats = handleGetDashboardStats;
exports.handleListOrders = handleListOrders;
exports.handleGetOrder = handleGetOrder;
exports.handleUpdateOrderStatus = handleUpdateOrderStatus;
exports.handleAdminListProducts = handleAdminListProducts;
exports.handleGetProduct = handleGetProduct;
exports.handleCreateProduct = handleCreateProduct;
exports.handleUpdateProduct = handleUpdateProduct;
exports.handleDeleteProduct = handleDeleteProduct;
exports.handleListCategories = handleListCategories;
exports.handleCreateVariant = handleCreateVariant;
exports.handleUpdateVariant = handleUpdateVariant;
exports.handleDeleteVariant = handleDeleteVariant;
const admin_service_1 = require("./admin.service");
// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
function handleAdminError(err, res) {
    if (err instanceof admin_service_1.AdminError) {
        return res.status(err.statusCode).json({ error: err.message });
    }
    console.error("Admin error:", err?.message || err);
    res.status(500).json({ error: "Internal server error" });
}
// ===========================================================================
// DASHBOARD
// ===========================================================================
async function handleGetDashboardStats(_req, res) {
    try {
        const stats = await (0, admin_service_1.getDashboardStats)();
        res.json({ data: stats });
    }
    catch (err) {
        handleAdminError(err, res);
    }
}
// ===========================================================================
// ORDERS
// ===========================================================================
async function handleListOrders(req, res) {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
        const status = req.query.status || undefined;
        const search = req.query.search || undefined;
        const result = await (0, admin_service_1.listOrders)({ page, limit, status, search });
        res.json(result);
    }
    catch (err) {
        handleAdminError(err, res);
    }
}
async function handleGetOrder(req, res) {
    try {
        const orderId = req.params.orderId;
        const order = await (0, admin_service_1.getOrderById)(orderId);
        res.json({ data: order });
    }
    catch (err) {
        handleAdminError(err, res);
    }
}
async function handleUpdateOrderStatus(req, res) {
    try {
        const orderId = req.params.orderId;
        const { status, paymentStatus } = req.body;
        if (!status && !paymentStatus) {
            return res.status(400).json({ error: "Provide at least one of: status, paymentStatus" });
        }
        const order = await (0, admin_service_1.updateOrderStatus)(orderId, { status, paymentStatus });
        res.json({ data: order, message: "Order updated successfully" });
    }
    catch (err) {
        handleAdminError(err, res);
    }
}
// ===========================================================================
// PRODUCTS
// ===========================================================================
async function handleAdminListProducts(req, res) {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
        const search = req.query.search || undefined;
        const includeInactive = req.query.includeInactive === "true";
        const result = await (0, admin_service_1.adminListProducts)({ page, limit, search, includeInactive });
        res.json(result);
    }
    catch (err) {
        handleAdminError(err, res);
    }
}
async function handleGetProduct(req, res) {
    try {
        const productId = req.params.productId;
        const product = await (0, admin_service_1.getProductById)(productId);
        res.json({ data: product });
    }
    catch (err) {
        handleAdminError(err, res);
    }
}
async function handleCreateProduct(req, res) {
    try {
        const { name, slug, description, basePrice, isCustomizable, categoryId, variants } = req.body;
        if (!name || basePrice === undefined || !categoryId) {
            return res.status(400).json({
                error: "Missing required fields: name, basePrice, categoryId",
            });
        }
        const product = await (0, admin_service_1.createProduct)({
            name,
            slug,
            description,
            basePrice: Number(basePrice),
            isCustomizable,
            categoryId,
            variants,
        });
        res.status(201).json({ data: product, message: "Product created successfully" });
    }
    catch (err) {
        handleAdminError(err, res);
    }
}
async function handleUpdateProduct(req, res) {
    try {
        const productId = req.params.productId;
        const { name, description, basePrice, isCustomizable, isActive, categoryId } = req.body;
        const product = await (0, admin_service_1.updateProduct)(productId, {
            name,
            description,
            basePrice: basePrice !== undefined ? Number(basePrice) : undefined,
            isCustomizable,
            isActive,
            categoryId,
        });
        res.json({ data: product, message: "Product updated successfully" });
    }
    catch (err) {
        handleAdminError(err, res);
    }
}
async function handleDeleteProduct(req, res) {
    try {
        const productId = req.params.productId;
        const result = await (0, admin_service_1.deleteProduct)(productId);
        res.json({ ...result, message: "Product deactivated successfully" });
    }
    catch (err) {
        handleAdminError(err, res);
    }
}
async function handleListCategories(_req, res) {
    try {
        const categories = await (0, admin_service_1.listCategories)();
        res.json({ data: categories });
    }
    catch (err) {
        handleAdminError(err, res);
    }
}
// ===========================================================================
// VARIANTS
// ===========================================================================
async function handleCreateVariant(req, res) {
    try {
        const productId = req.params.productId;
        const { size, color, fabricType, sku, price, stockQuantity } = req.body;
        if (!sku) {
            return res.status(400).json({ error: "SKU is required" });
        }
        const variant = await (0, admin_service_1.createVariant)(productId, {
            size,
            color,
            fabricType,
            sku,
            price: price !== undefined ? Number(price) : undefined,
            stockQuantity: stockQuantity !== undefined ? Number(stockQuantity) : undefined,
        });
        res.status(201).json({ data: variant, message: "Variant created successfully" });
    }
    catch (err) {
        handleAdminError(err, res);
    }
}
async function handleUpdateVariant(req, res) {
    try {
        const variantId = req.params.variantId;
        const { size, color, fabricType, sku, price, stockQuantity } = req.body;
        const variant = await (0, admin_service_1.updateVariant)(variantId, {
            size,
            color,
            fabricType,
            sku,
            price: price !== undefined ? Number(price) : undefined,
            stockQuantity: stockQuantity !== undefined ? Number(stockQuantity) : undefined,
        });
        res.json({ data: variant, message: "Variant updated successfully" });
    }
    catch (err) {
        handleAdminError(err, res);
    }
}
async function handleDeleteVariant(req, res) {
    try {
        const variantId = req.params.variantId;
        const result = await (0, admin_service_1.deleteVariant)(variantId);
        res.json({ ...result, message: "Variant deleted successfully" });
    }
    catch (err) {
        handleAdminError(err, res);
    }
}
//# sourceMappingURL=admin.controller.js.map
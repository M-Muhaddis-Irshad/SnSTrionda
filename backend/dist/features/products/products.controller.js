"use strict";
// =============================================================================
// Products Feature — Request Handlers (Controller)
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleListProducts = handleListProducts;
exports.handleListCategories = handleListCategories;
exports.handleGetProductBySlug = handleGetProductBySlug;
const products_service_1 = require("./products.service");
// ---------------------------------------------------------------------------
// GET /api/products
// ---------------------------------------------------------------------------
async function handleListProducts(req, res) {
    try {
        // Parse pagination query params
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12));
        const result = await (0, products_service_1.listProducts)({ page, limit });
        res.json({
            message: "Products retrieved successfully",
            ...result,
        });
    }
    catch (err) {
        console.error("List products error:", err?.message || err);
        res.status(500).json({ error: "Internal server error" });
    }
}
// ---------------------------------------------------------------------------
// GET /api/products/categories
// ---------------------------------------------------------------------------
async function handleListCategories(_req, res) {
    try {
        const categories = await (0, products_service_1.listCategories)();
        res.json({ data: categories });
    }
    catch (err) {
        console.error("List categories error:", err?.message || err);
        res.status(500).json({ error: "Internal server error" });
    }
}
// ---------------------------------------------------------------------------
// GET /api/products/:slug
// ---------------------------------------------------------------------------
async function handleGetProductBySlug(req, res) {
    try {
        const { slug } = req.params;
        if (!slug) {
            return res.status(400).json({ error: "Product slug is required" });
        }
        const product = await (0, products_service_1.getProductBySlug)(slug);
        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }
        res.json({
            message: "Product retrieved successfully",
            data: product,
        });
    }
    catch (err) {
        console.error("Get product error:", err?.message || err);
        res.status(500).json({ error: "Internal server error" });
    }
}
//# sourceMappingURL=products.controller.js.map
"use strict";
// =============================================================================
// Products Feature — Image Upload/Delete Request Handlers
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleUploadImage = handleUploadImage;
exports.handleDeleteImage = handleDeleteImage;
const products_image_service_1 = require("./products.image.service");
// ---------------------------------------------------------------------------
// POST /api/products/:productId/images
// ---------------------------------------------------------------------------
async function handleUploadImage(req, res) {
    try {
        const productId = req.params.productId;
        if (!req.file) {
            return res.status(400).json({ error: "No image file provided. Send a multipart/form-data file with field name 'image'." });
        }
        const { altText, displayOrder } = req.body;
        const result = await (0, products_image_service_1.uploadProductImage)({
            productId,
            file: req.file,
            altText: altText || undefined,
            displayOrder: displayOrder ? parseInt(displayOrder) : undefined,
        });
        res.status(201).json({
            message: "Image uploaded successfully",
            data: result,
        });
    }
    catch (err) {
        if (err instanceof products_image_service_1.ImageError) {
            return res.status(err.statusCode).json({ error: err.message });
        }
        console.error("Upload image error:", err?.message || err);
        res.status(500).json({ error: "Internal server error" });
    }
}
// ---------------------------------------------------------------------------
// DELETE /api/products/:productId/images/:imageId
// ---------------------------------------------------------------------------
async function handleDeleteImage(req, res) {
    try {
        const productId = req.params.productId;
        const imageId = req.params.imageId;
        const result = await (0, products_image_service_1.deleteProductImage)(productId, imageId);
        res.json({
            message: "Image deleted successfully",
            data: result,
        });
    }
    catch (err) {
        if (err instanceof products_image_service_1.ImageError) {
            return res.status(err.statusCode).json({ error: err.message });
        }
        console.error("Delete image error:", err?.message || err);
        res.status(500).json({ error: "Internal server error" });
    }
}
//# sourceMappingURL=products.image.controller.js.map
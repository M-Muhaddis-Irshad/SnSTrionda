"use strict";
// =============================================================================
// Products Feature — Route Definitions
// =============================================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const products_controller_1 = require("./products.controller");
const products_image_controller_1 = require("./products.image.controller");
const reviews_controller_1 = require("../reviews/reviews.controller");
const auth_middleware_1 = require("../auth/auth.middleware");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (_req, file, cb) => {
        const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new multer_1.default.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname));
        }
    },
});
// Multer error handler — returns 400 instead of 500
function handleMulterError(err, _req, res, next) {
    if (err instanceof multer_1.default.MulterError) {
        return res.status(400).json({ error: err.message || "File upload error" });
    }
    if (err?.message?.includes("Only JPEG")) {
        return res.status(400).json({ error: err.message });
    }
    next(err);
}
// ---------------------------------------------------------------------------
// Product image routes (must come before /:slug to avoid param conflict)
// ---------------------------------------------------------------------------
// POST /api/products/:productId/images — upload image (admin only)
router.post("/:productId/images", auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)("ADMIN"), upload.single("image"), handleMulterError, products_image_controller_1.handleUploadImage);
// DELETE /api/products/:productId/images/:imageId — delete image (admin only)
router.delete("/:productId/images/:imageId", auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)("ADMIN"), products_image_controller_1.handleDeleteImage);
// ---------------------------------------------------------------------------
// Public category list (for homepage/shop filtering)
// ---------------------------------------------------------------------------
router.get("/categories", products_controller_1.handleListCategories);
// ---------------------------------------------------------------------------
// Public product reviews — APPROVED reviews only (must precede /:slug)
// ---------------------------------------------------------------------------
router.get("/:productId/reviews", reviews_controller_1.handleListProductReviews);
// ---------------------------------------------------------------------------
// Product routes (/:slug must come after image routes)
// ---------------------------------------------------------------------------
router.get("/", products_controller_1.handleListProducts);
router.get("/:slug", products_controller_1.handleGetProductBySlug);
exports.default = router;
//# sourceMappingURL=products.routes.js.map
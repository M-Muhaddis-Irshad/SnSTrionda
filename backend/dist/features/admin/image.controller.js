"use strict";
// =============================================================================
// Admin Feature — Site Media Image Handlers (Controller)
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleListImages = handleListImages;
exports.handleCreateImage = handleCreateImage;
exports.handleUpdateImage = handleUpdateImage;
exports.handleGetImageUsage = handleGetImageUsage;
exports.handleDeleteImage = handleDeleteImage;
const image_service_1 = require("./image.service");
function handleError(err, res) {
    if (err instanceof image_service_1.MediaError) {
        return res.status(err.statusCode).json({ error: err.message });
    }
    console.error("Image admin error:", err?.message || err);
    res.status(500).json({ error: "Internal server error" });
}
// ---------------------------------------------------------------------------
// GET /api/admin/images — list (paginated, category + search filters)
// ---------------------------------------------------------------------------
async function handleListImages(req, res) {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
        const category = req.query.category || undefined;
        const search = req.query.search || undefined;
        const result = await (0, image_service_1.listImages)({ page, limit, category, search });
        res.json(result);
    }
    catch (err) {
        handleError(err, res);
    }
}
// ---------------------------------------------------------------------------
// POST /api/admin/images — create image (multipart file upload or url)
// ---------------------------------------------------------------------------
async function handleCreateImage(req, res) {
    try {
        const { name, alt, category } = req.body;
        const active = req.body.active === undefined ? undefined : req.body.active === "true" || req.body.active === true;
        const url = typeof req.body.url === "string" ? req.body.url : undefined;
        const file = req.file;
        if (!name) {
            return res.status(400).json({ error: "Image name is required." });
        }
        const image = await (0, image_service_1.createImage)({ name, alt, url, file, category, active });
        res.status(201).json({ data: image, message: "Image created successfully" });
    }
    catch (err) {
        handleError(err, res);
    }
}
// ---------------------------------------------------------------------------
// PATCH /api/admin/images/:id — update image metadata
// ---------------------------------------------------------------------------
async function handleUpdateImage(req, res) {
    try {
        const imageId = req.params.id;
        const { name, url, alt, category } = req.body;
        const active = req.body.active === undefined ? undefined : req.body.active === "true" || req.body.active === true;
        const image = await (0, image_service_1.updateImage)(imageId, { name, url, alt, category, active });
        res.json({ data: image, message: "Image updated successfully" });
    }
    catch (err) {
        handleError(err, res);
    }
}
// ---------------------------------------------------------------------------
// GET /api/admin/images/:id/usage — where is this image used?
// ---------------------------------------------------------------------------
async function handleGetImageUsage(req, res) {
    try {
        const imageId = req.params.id;
        const result = await (0, image_service_1.getImageUsage)(imageId);
        res.json({ data: result });
    }
    catch (err) {
        handleError(err, res);
    }
}
// ---------------------------------------------------------------------------
// DELETE /api/admin/images/:id — delete image (blocked while in use)
// ---------------------------------------------------------------------------
async function handleDeleteImage(req, res) {
    try {
        const imageId = req.params.id;
        const result = await (0, image_service_1.deleteImage)(imageId);
        res.json({ ...result, message: "Image deleted successfully" });
    }
    catch (err) {
        handleError(err, res);
    }
}
//# sourceMappingURL=image.controller.js.map
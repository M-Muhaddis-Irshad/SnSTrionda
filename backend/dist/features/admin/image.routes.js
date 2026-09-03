"use strict";
// =============================================================================
// Admin Feature — Site Media Image Routes
// =============================================================================
// NOTE: Mounted inside admin.routes.ts AFTER the authenticate + requireRole("ADMIN")
// middleware, so every route below is admin-protected automatically.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const image_controller_1 = require("./image.controller");
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
function handleMulterError(err, _req, res, next) {
    if (err instanceof multer_1.default.MulterError) {
        return res.status(400).json({ error: err.message || "File upload error" });
    }
    next(err);
}
router.get("/", image_controller_1.handleListImages);
router.post("/", upload.single("image"), handleMulterError, image_controller_1.handleCreateImage);
router.patch("/:id", image_controller_1.handleUpdateImage);
router.delete("/:id", image_controller_1.handleDeleteImage);
router.get("/:id/usage", image_controller_1.handleGetImageUsage);
exports.default = router;
//# sourceMappingURL=image.routes.js.map
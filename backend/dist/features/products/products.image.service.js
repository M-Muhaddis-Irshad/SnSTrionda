"use strict";
// =============================================================================
// Products Feature — Image Upload Service (Cloudinary + ProductImage CRUD)
// =============================================================================
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageError = void 0;
exports.uploadProductImage = uploadProductImage;
exports.deleteProductImage = deleteProductImage;
const cloudinary_1 = __importStar(require("../../config/cloudinary"));
const db_1 = require("../../db");
// ---------------------------------------------------------------------------
// Allowed MIME types
// ---------------------------------------------------------------------------
const ALLOWED_MIME_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
];
// ---------------------------------------------------------------------------
// Custom Error
// ---------------------------------------------------------------------------
class ImageError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.name = "ImageError";
    }
}
exports.ImageError = ImageError;
// ---------------------------------------------------------------------------
// Upload image to Cloudinary + create ProductImage record
// ---------------------------------------------------------------------------
async function uploadProductImage(input) {
    const { productId, file, altText, displayOrder } = input;
    // Validate product exists
    const product = await db_1.prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
        throw new ImageError("Product not found", 404);
    }
    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        throw new ImageError(`Invalid file type: ${file.mimetype}. Allowed: JPEG, PNG, WebP, GIF.`, 400);
    }
    // Upload to Cloudinary using the buffer (memory storage)
    const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary_1.default.uploader.upload_stream({
            folder: cloudinary_1.CLOUDINARY_FOLDER,
            public_id: `${productId}-${Date.now()}`,
            resource_type: "image",
        }, (error, result) => {
            if (error)
                return reject(error);
            if (!result)
                return reject(new Error("Upload failed — no result returned"));
            resolve(result);
        });
        uploadStream.end(file.buffer);
    });
    // Create ProductImage record in database
    const image = await db_1.prisma.productImage.create({
        data: {
            url: result.secure_url,
            altText: altText || null,
            displayOrder: displayOrder ?? 0,
            productId,
        },
    });
    return {
        ...image,
        cloudinaryPublicId: result.public_id,
    };
}
// ---------------------------------------------------------------------------
// Delete image from Cloudinary + remove ProductImage record
// ---------------------------------------------------------------------------
async function deleteProductImage(productId, imageId) {
    // Validate product exists
    const product = await db_1.prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
        throw new ImageError("Product not found", 404);
    }
    // Find the image record
    const image = await db_1.prisma.productImage.findFirst({
        where: { id: imageId, productId },
    });
    if (!image) {
        throw new ImageError("Image not found for this product", 404);
    }
    // Extract Cloudinary public_id from the URL
    // URL format: https://res.cloudinary.com/<cloud>/image/upload/<folder>/<public_id>.<ext>
    const publicId = extractCloudinaryPublicId(image.url);
    // Delete from Cloudinary (if we could extract the public_id)
    if (publicId) {
        try {
            await cloudinary_1.default.uploader.destroy(publicId);
        }
        catch (err) {
            // Log but don't fail — the Cloudinary asset might already be gone
            console.error("Cloudinary delete warning:", err?.message || err);
        }
    }
    // Delete from database
    await db_1.prisma.productImage.delete({ where: { id: imageId } });
    return { deleted: true, imageId, cloudinaryPublicId: publicId };
}
// ---------------------------------------------------------------------------
// Helper: extract public_id from Cloudinary URL
// ---------------------------------------------------------------------------
function extractCloudinaryPublicId(url) {
    try {
        // URL: https://res.cloudinary.com/<cloud>/image/upload/v1234/folder/file.ext
        // or: https://res.cloudinary.com/<cloud>/image/upload/folder/file.ext
        const parts = url.split("/upload/");
        if (parts.length < 2)
            return null;
        let path = parts[1];
        // Remove version prefix if present (e.g., v1234567890/)
        path = path.replace(/^v\d+/, "");
        // Remove file extension
        path = path.replace(/\.[^.]+$/, "");
        // Remove leading slash
        path = path.replace(/^\//, "");
        return path || null;
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=products.image.service.js.map
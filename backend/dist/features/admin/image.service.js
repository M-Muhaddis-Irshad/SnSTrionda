"use strict";
// =============================================================================
// Admin Feature — Site Media Image Service (Image CRUD + Cloudinary upload)
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
exports.MediaError = void 0;
exports.listImages = listImages;
exports.createImage = createImage;
exports.updateImage = updateImage;
exports.getImageUsage = getImageUsage;
exports.deleteImage = deleteImage;
const cloudinary_1 = __importStar(require("../../config/cloudinary"));
const db_1 = require("../../db");
// ---------------------------------------------------------------------------
// Custom Error
// ---------------------------------------------------------------------------
class MediaError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.name = "MediaError";
    }
}
exports.MediaError = MediaError;
// ---------------------------------------------------------------------------
// Types / constants
// ---------------------------------------------------------------------------
const IMAGE_CATEGORIES = ["HERO", "BANNER", "COLLECTION", "CAROUSEL", "CAMPAIGN"];
const ALLOWED_MIME_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
];
// ---------------------------------------------------------------------------
// List images (paginated, filterable)
// ---------------------------------------------------------------------------
async function listImages(params) {
    const { page, limit, category, search } = params;
    const skip = (page - 1) * limit;
    const where = {};
    if (category) {
        where.category = category;
    }
    if (search) {
        where.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { alt: { contains: search, mode: "insensitive" } },
        ];
    }
    const [images, total] = await Promise.all([
        db_1.prisma.image.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: { _count: { select: { campaigns: true } } },
        }),
        db_1.prisma.image.count({ where }),
    ]);
    const totalPages = Math.ceil(total / limit);
    return {
        data: images,
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        },
    };
}
// ---------------------------------------------------------------------------
// Create image — uploads a file to Cloudinary (or accepts a valid https url)
// ---------------------------------------------------------------------------
async function createImage(input) {
    const category = normalizeCategory(input.category);
    if (!input.name || !input.name.trim()) {
        throw new MediaError("Image name is required.", 400);
    }
    let url = (input.url || "").trim();
    // File upload path
    if (input.file) {
        if (!ALLOWED_MIME_TYPES.includes(input.file.mimetype)) {
            throw new MediaError(`Invalid file type: ${input.file.mimetype}. Allowed: JPEG, PNG, WebP, GIF.`, 400);
        }
        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary_1.default.uploader.upload_stream({
                folder: cloudinary_1.CLOUDINARY_SITE_FOLDER,
                public_id: `site-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
                resource_type: "image",
            }, (error, result) => {
                if (error)
                    return reject(error);
                if (!result)
                    return reject(new Error("Upload failed — no result returned"));
                resolve(result);
            });
            uploadStream.end(input.file.buffer);
        });
        url = result.secure_url;
    }
    if (!url) {
        throw new MediaError("Image URL is required when no file is uploaded.", 400);
    }
    if (!isHttpsUrl(url)) {
        throw new MediaError("Image URL must be a valid https:// URL.", 400);
    }
    return db_1.prisma.image.create({
        data: {
            name: input.name.trim(),
            url,
            alt: input.alt?.trim() || null,
            category,
            active: input.active ?? true,
        },
    });
}
// ---------------------------------------------------------------------------
// Update image metadata
// ---------------------------------------------------------------------------
async function updateImage(imageId, input) {
    const existing = await db_1.prisma.image.findUnique({ where: { id: imageId } });
    if (!existing) {
        throw new MediaError("Image not found", 404);
    }
    const data = {};
    if (input.name !== undefined) {
        if (!input.name.trim())
            throw new MediaError("Image name cannot be empty.", 400);
        data.name = input.name.trim();
    }
    if (input.alt !== undefined)
        data.alt = input.alt?.trim() || null;
    if (input.url !== undefined) {
        const url = input.url.trim();
        if (!isHttpsUrl(url)) {
            throw new MediaError("Image URL must be a valid https:// URL.", 400);
        }
        data.url = url;
    }
    if (input.category !== undefined) {
        data.category = normalizeCategory(input.category);
    }
    if (input.active !== undefined) {
        // Block deactivating the last active image in a category
        if (input.active === false && existing.active === true) {
            const activeCount = await db_1.prisma.image.count({
                where: { category: existing.category, active: true, id: { not: imageId } },
            });
            if (activeCount === 0) {
                throw new MediaError(`Cannot deactivate: this is the only active image in the ${existing.category} category. Activate another image first.`, 400);
            }
        }
        data.active = input.active;
    }
    return db_1.prisma.image.update({
        where: { id: imageId },
        data,
        include: { _count: { select: { campaigns: true } } },
    });
}
// ---------------------------------------------------------------------------
// Usage — where is this image referenced?
// ---------------------------------------------------------------------------
async function getImageUsage(imageId) {
    const image = await db_1.prisma.image.findUnique({ where: { id: imageId } });
    if (!image) {
        throw new MediaError("Image not found", 404);
    }
    const campaigns = await db_1.prisma.campaign.findMany({
        where: { imageId },
        select: { id: true, title: true, active: true },
    });
    return {
        image,
        usage: {
            campaigns,
            usedByCampaigns: campaigns.length,
        },
    };
}
// ---------------------------------------------------------------------------
// Delete image — blocked while referenced by an active campaign (or any campaign)
// ---------------------------------------------------------------------------
async function deleteImage(imageId) {
    const image = await db_1.prisma.image.findUnique({ where: { id: imageId } });
    if (!image) {
        throw new MediaError("Image not found", 404);
    }
    const usage = await getImageUsage(imageId);
    if (usage.usage.campaigns.length > 0) {
        throw new MediaError(`Cannot delete this image — it is used by ${usage.usage.campaigns.length} campaign(s): ${usage.usage.campaigns
            .map((c) => c.title)
            .join(", ")}. Remove the campaign link first.`, 409);
    }
    // Best-effort Cloudinary cleanup
    const publicId = extractCloudinaryPublicId(image.url);
    if (publicId) {
        try {
            await cloudinary_1.default.uploader.destroy(publicId);
        }
        catch (err) {
            console.error("Cloudinary delete warning:", err?.message || err);
        }
    }
    await db_1.prisma.image.delete({ where: { id: imageId } });
    return { deleted: true, imageId };
}
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function normalizeCategory(category) {
    const normalized = String(category || "BANNER").trim().toUpperCase();
    if (!IMAGE_CATEGORIES.includes(normalized)) {
        throw new MediaError(`Invalid category: ${category}. Must be one of: ${IMAGE_CATEGORIES.join(", ")}.`, 400);
    }
    return normalized;
}
function isHttpsUrl(value) {
    try {
        const parsed = new URL(value);
        return parsed.protocol === "https:";
    }
    catch {
        return false;
    }
}
function extractCloudinaryPublicId(url) {
    try {
        const parts = url.split("/upload/");
        if (parts.length < 2)
            return null;
        let path = parts[1];
        path = path.replace(/^v\d+/, "");
        path = path.replace(/\.[^.]+$/, "");
        path = path.replace(/^\//, "");
        return path || null;
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=image.service.js.map
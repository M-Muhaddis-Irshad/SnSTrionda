// =============================================================================
// Products Feature — Image Upload Service (Cloudinary + ProductImage CRUD)
// =============================================================================

import cloudinary, { CLOUDINARY_FOLDER } from "../../config/cloudinary";
import { prisma } from "../../db";

type UploadResult = { secure_url: string; public_id: string } & Record<string, any>;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UploadImageInput {
  productId: string;
  file: Express.Multer.File;
  altText?: string;
  displayOrder?: number;
}

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

export class ImageError extends Error {
  public statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = "ImageError";
  }
}

// ---------------------------------------------------------------------------
// Upload image to Cloudinary + create ProductImage record
// ---------------------------------------------------------------------------

export async function uploadProductImage(input: UploadImageInput) {
  const { productId, file, altText, displayOrder } = input;

  // Validate product exists
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    throw new ImageError("Product not found", 404);
  }

  // Validate file type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    throw new ImageError(
      `Invalid file type: ${file.mimetype}. Allowed: JPEG, PNG, WebP, GIF.`,
      400
    );
  }

  // Upload to Cloudinary using the buffer (memory storage)
  const result = await new Promise<UploadResult>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: CLOUDINARY_FOLDER,
        public_id: `${productId}-${Date.now()}`,
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error("Upload failed — no result returned"));
        resolve(result);
      }
    );
    uploadStream.end(file.buffer);
  });

  // Create ProductImage record in database
  const image = await prisma.productImage.create({
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

export async function deleteProductImage(productId: string, imageId: string) {
  // Validate product exists
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    throw new ImageError("Product not found", 404);
  }

  // Find the image record
  const image = await prisma.productImage.findFirst({
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
      await cloudinary.uploader.destroy(publicId);
    } catch (err: any) {
      // Log but don't fail — the Cloudinary asset might already be gone
      console.error("Cloudinary delete warning:", err?.message || err);
    }
  }

  // Delete from database
  await prisma.productImage.delete({ where: { id: imageId } });

  return { deleted: true, imageId, cloudinaryPublicId: publicId };
}

// ---------------------------------------------------------------------------
// Helper: extract public_id from Cloudinary URL
// ---------------------------------------------------------------------------

function extractCloudinaryPublicId(url: string): string | null {
  try {
    // URL: https://res.cloudinary.com/<cloud>/image/upload/v1234/folder/file.ext
    // or: https://res.cloudinary.com/<cloud>/image/upload/folder/file.ext
    const parts = url.split("/upload/");
    if (parts.length < 2) return null;

    let path = parts[1];
    // Remove version prefix if present (e.g., v1234567890/)
    path = path.replace(/^v\d+/, "");
    // Remove file extension
    path = path.replace(/\.[^.]+$/, "");
    // Remove leading slash
    path = path.replace(/^\//, "");

    return path || null;
  } catch {
    return null;
  }
}

// =============================================================================
// Cloudinary Configuration
// =============================================================================

// Load .env BEFORE reading process.env here — this module is imported before
// server.ts gets to call dotenv.config(), and Cloudinary rejects uploads with
// "Must supply api_key" when the keys are undefined at import time. Same
// pattern as db.ts ("dotenv/config").
import "dotenv/config";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const CLOUDINARY_FOLDER = "trionda-wears/products";
export const CLOUDINARY_SITE_FOLDER = "trionda-wears/site";

export default cloudinary;

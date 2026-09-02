/**
 * Upload aesthetic women fashion images + logo to Cloudinary for auth pages.
 * Run: cd backend && npx tsx upload-auth-images.ts
 */
import "dotenv/config";
import cloudinary from "./src/config/cloudinary";
import https from "https";
import http from "http";
import fs from "fs";
import path from "path";

const AUTH_FOLDER = "trionda-wears/auth";

const IMAGES = [
  {
    name: "auth-login",
    url: "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=800&q=80&fit=crop",
    description: "Elegant woman - login background",
  },
  {
    name: "auth-signup",
    url: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&q=80&fit=crop",
    description: "Stylish woman fashion - signup background",
  },
];

function downloadFile(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith("https") ? https : http;
    proto
      .get(url, (res) => {
        // Follow redirects
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          downloadFile(res.headers.location).then(resolve).catch(reject);
          return;
        }
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => resolve(Buffer.concat(chunks)));
        res.on("error", reject);
      })
      .on("error", reject);
  });
}

function uploadToCloudinary(
  buffer: Buffer,
  publicId: string,
  folder: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: "image",
        overwrite: true,
        transformation: [{ width: 800, height: 1000, crop: "fill", quality: "auto" }],
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error("No result from Cloudinary"));
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

async function uploadLogo(): Promise<string> {
  const logoPath = path.join(__dirname, "../frontend/public/logo/trionda-icon-mark.png");
  if (!fs.existsSync(logoPath)) {
    console.log("⚠️  Logo file not found, skipping logo upload");
    return "";
  }
  const buffer = fs.readFileSync(logoPath);
  const url = await uploadToCloudinary(buffer, "trionda-logo", AUTH_FOLDER);
  return url;
}

async function main() {
  console.log("📤 Uploading auth images to Cloudinary...\n");

  const results: Record<string, string> = {};

  for (const img of IMAGES) {
    console.log(`⬇️  Downloading: ${img.description}...`);
    const buffer = await downloadFile(img.url);
    console.log(`☁️  Uploading ${img.name}...`);
    const cloudUrl = await uploadToCloudinary(buffer, img.name, AUTH_FOLDER);
    results[img.name] = cloudUrl;
    console.log(`✅ ${img.name}: ${cloudUrl}\n`);
  }

  // Upload logo
  console.log("⬇️  Uploading logo...");
  const logoUrl = await uploadLogo();
  if (logoUrl) {
    results["trionda-logo"] = logoUrl;
    console.log(`✅ Logo: ${logoUrl}\n`);
  }

  console.log("═══════════════════════════════════════════════");
  console.log("📋 CLOUDINARY URLs (use these in auth pages):");
  console.log("═══════════════════════════════════════════════");
  for (const [key, url] of Object.entries(results)) {
    console.log(`   ${key}: ${url}`);
  }
  console.log("═══════════════════════════════════════════════");

  // Save to a JSON file for easy reference
  const outputPath = path.join(__dirname, "auth-image-urls.json");
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\n💾 URLs saved to: ${outputPath}`);
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});

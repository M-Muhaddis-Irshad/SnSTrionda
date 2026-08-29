// =============================================================================
// Generate styled product images as SVGs and upload to Cloudinary
// Run with: npx tsx upload-real-images.ts
//
// Creates professional-looking product cards as SVGs with brand colors,
// product names, and category labels — then uploads to Cloudinary.
// =============================================================================

import "dotenv/config";
import { prisma } from "./src/db";
import cloudinary, { CLOUDINARY_FOLDER } from "./src/config/cloudinary";

interface ProductImageDef {
  name: string;
  slug: string;
  bgColor: string;
  accentColor: string;
  icon: string; // Simple emoji icon
  category: string;
}

const PRODUCTS: ProductImageDef[] = [
  { name: "Classic Oxford Shirt", slug: "classic-oxford-shirt", bgColor: "#2C3E50", accentColor: "#ECF0F1", icon: "👔", category: "SHIRTS" },
  { name: "Linen Kurta", slug: "linen-kurta", bgColor: "#D4A574", accentColor: "#FFF8F0", icon: "🪡", category: "SHIRTS" },
  { name: "Silk Formal Shirt", slug: "silk-formal-shirt", bgColor: "#1B2838", accentColor: "#C0C0C0", icon: "✨", category: "SHIRTS" },
  { name: "Slim Fit Chinos", slug: "slim-fit-chinos", bgColor: "#8B7355", accentColor: "#F5F0EB", icon: "👖", category: "TROUSERS" },
  { name: "Classic Shalwar", slug: "classic-shalwar", bgColor: "#ECF0F1", accentColor: "#2C3E50", icon: "🧵", category: "TROUSERS" },
  { name: "Premium Cotton Fabric", slug: "premium-cotton-fabric", bgColor: "#BDC3C7", accentColor: "#2C3E50", icon: "🪢", category: "FABRIC" },
  { name: "Raw Silk Fabric", slug: "raw-silk-fabric", bgColor: "#C9B037", accentColor: "#1a1a1a", icon: "✨", category: "FABRIC" },
  { name: "Wedding Sherwani", slug: "wedding-sherwani", bgColor: "#8B6914", accentColor: "#FFD700", icon: "👑", category: "SHERWANIS" },
];

function generateSVG(product: ProductImageDef): string {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${product.bgColor};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${product.accentColor};stop-opacity:0.3" />
    </linearGradient>
    <linearGradient id="shine" x1="0%" y1="0%" x2="50%" y2="50%">
      <stop offset="0%" style="stop-color:white;stop-opacity:0.1" />
      <stop offset="100%" style="stop-color:white;stop-opacity:0" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="800" height="1000" fill="url(#bg)" />
  
  <!-- Subtle pattern overlay -->
  <rect width="800" height="1000" fill="url(#shine)" opacity="0.3" />
  
  <!-- Decorative circle -->
  <circle cx="650" cy="200" r="120" fill="${product.accentColor}" opacity="0.08" />
  <circle cx="150" cy="800" r="180" fill="${product.accentColor}" opacity="0.05" />
  
  <!-- Brand name at top -->
  <text x="400" y="80" font-family="Georgia, serif" font-size="28" fill="${product.accentColor}" text-anchor="middle" opacity="0.6" letter-spacing="8">TRIONDA WEARS</text>
  
  <!-- Category label -->
  <rect x="300" y="120" width="200" height="30" rx="15" fill="${product.accentColor}" opacity="0.15" />
  <text x="400" y="141" font-family="Arial, sans-serif" font-size="14" fill="${product.accentColor}" text-anchor="middle" opacity="0.7" letter-spacing="3">${product.category}</text>
  
  <!-- Icon -->
  <text x="400" y="450" font-size="120" text-anchor="middle" opacity="0.4">${product.icon}</text>
  
  <!-- Product name -->
  <text x="400" y="620" font-family="Georgia, serif" font-size="42" fill="${product.accentColor}" text-anchor="middle" font-weight="bold">
    ${product.name.split(' ').slice(0, 2).join(' ')}
  </text>
  ${product.name.split(' ').length > 2 ? `
  <text x="400" y="670" font-family="Georgia, serif" font-size="42" fill="${product.accentColor}" text-anchor="middle" font-weight="bold">
    ${product.name.split(' ').slice(2).join(' ')}
  </text>` : ''}
  
  <!-- Divider line -->
  <line x1="300" y1="720" x2="500" y2="720" stroke="${product.accentColor}" stroke-width="1" opacity="0.3" />
  
  <!-- Tagline -->
  <text x="400" y="760" font-family="Arial, sans-serif" font-size="16" fill="${product.accentColor}" text-anchor="middle" opacity="0.5" letter-spacing="2">PREMIUM QUALITY</text>
  
  <!-- Bottom decorative bar -->
  <rect x="0" y="960" width="800" height="40" fill="${product.accentColor}" opacity="0.08" />
</svg>`.trim();

  return svg;
}

function svgToDataUri(svg: string): string {
  const encoded = Buffer.from(svg).toString("base64");
  return `data:image/svg+xml;base64,${encoded}`;
}

function uploadBuffer(buffer: Buffer, publicId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: CLOUDINARY_FOLDER,
        public_id: publicId,
        resource_type: "image",
        format: "svg",
        overwrite: true,
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

async function main() {
  console.log("🎨 Generating and uploading branded product images...\n");

  let uploaded = 0;
  let failed = 0;

  for (const product of PRODUCTS) {
    try {
      // Generate SVG
      const svg = generateSVG(product);
      const buffer = Buffer.from(svg, "utf-8");
      console.log(`📤 ${product.name}: ${(buffer.length / 1024).toFixed(1)} KB SVG`);

      // Upload to Cloudinary
      const cloudinaryUrl = await uploadBuffer(buffer, product.slug);
      console.log(`   ✅ ${cloudinaryUrl}`);

      // Update DB
      const dbProduct = await prisma.product.findUnique({ where: { slug: product.slug } });
      if (!dbProduct) {
        console.log(`   ⚠️ Product not found in DB: ${product.slug}`);
        continue;
      }

      const result = await prisma.productImage.updateMany({
        where: { productId: dbProduct.id },
        data: {
          url: cloudinaryUrl,
          altText: `${product.name} — Trionda Wears`,
        },
      });
      console.log(`   📝 Updated ${result.count} DB record(s)\n`);
      uploaded++;
    } catch (err: any) {
      console.error(`   ❌ Failed: ${err.message || err}\n`);
      failed++;
    }
  }

  console.log(`\n📊 Results: ${uploaded} uploaded, ${failed} failed`);

  // Final verification
  const allImages = await prisma.productImage.findMany({
    select: { url: true, altText: true },
    orderBy: { createdAt: "asc" },
  });
  
  console.log("\n🔍 Final image URLs in database:");
  for (const img of allImages) {
    const isCloudinary = img.url.includes("cloudinary");
    console.log(`   [${isCloudinary ? "☁️ CLOUDINARY" : "⚠️ OTHER"}] ${img.url}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error("❌ Script failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });

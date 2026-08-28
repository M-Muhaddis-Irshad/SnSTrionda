// =============================================================================
// Trionda Wears — Seed Data
// =============================================================================
// Run with: npx tsx prisma/seed.ts
// Uses DATABASE_URL from .env for the Neon connection
// =============================================================================

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

// ---------------------------------------------------------------------------
// Placeholder image URL pattern (using placehold.co — reliable, active service)
// ---------------------------------------------------------------------------

function placeholderImage(productName: string, color: string = "1a1a1a"): string {
  // placehold.co: actively maintained, returns PNG with custom colors/text
  // In production these would be Cloudinary URLs
  return `https://placehold.co/800x1000/${color}/F2F2F2.png?text=${encodeURIComponent(productName)}`;
}

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

async function main() {
  console.log("🌱 Seeding Trionda Wears database...\n");

  // =========================================================================
  // 1. Categories
  // =========================================================================

  const shirts = await prisma.category.upsert({
    where: { slug: "shirts" },
    update: {},
    create: {
      name: "Shirts",
      slug: "shirts",
      description: "Premium dress shirts, casual shirts, and kurtas crafted from fine fabrics.",
    },
  });

  const trousers = await prisma.category.upsert({
    where: { slug: "trousers" },
    update: {},
    create: {
      name: "Trousers",
      slug: "trousers",
      description: "Tailored trousers and shalwars for every occasion.",
    },
  });

  const fabric = await prisma.category.upsert({
    where: { slug: "fabric" },
    update: {},
    create: {
      name: "Fabric",
      slug: "fabric",
      description: "Premium unstitched fabrics — cotton, linen, silk, and wool blends.",
    },
  });

  const sherwanis = await prisma.category.upsert({
    where: { slug: "sherwanis" },
    update: {},
    create: {
      name: "Sherwanis",
      slug: "sherwanis",
      description: "Made-to-order sherwanis and formal wear for weddings and special occasions.",
    },
  });

  console.log("✅ Categories created:", shirts.name, trousers.name, fabric.name, sherwanis.name);

  // =========================================================================
  // 2. Products
  // =========================================================================

  // --- Shirts ---

  const classicOxford = await prisma.product.upsert({
    where: { slug: "classic-oxford-shirt" },
    update: {},
    create: {
      name: "Classic Oxford Shirt",
      slug: "classic-oxford-shirt",
      description: "A timeless oxford cotton shirt with a tailored fit. Perfect for the office or a polished weekend look.",
      basePrice: 4500,
      isCustomizable: false,
      categoryId: shirts.id,
    },
  });

  const linenKurta = await prisma.product.upsert({
    where: { slug: "linen-kurta" },
    update: {},
    create: {
      name: "Linen Kurta",
      slug: "linen-kurta",
      description: "Breathable linen kurta with minimalist stitching. Ideal for summer gatherings.",
      basePrice: 5200,
      isCustomizable: false,
      categoryId: shirts.id,
    },
  });

  const silkFormalShirt = await prisma.product.upsert({
    where: { slug: "silk-formal-shirt" },
    update: {},
    create: {
      name: "Silk Formal Shirt",
      slug: "silk-formal-shirt",
      description: "Luxurious silk-blend formal shirt with mother-of-pearl buttons.",
      basePrice: 7800,
      isCustomizable: false,
      categoryId: shirts.id,
    },
  });

  // --- Trousers ---

  const slimChinos = await prisma.product.upsert({
    where: { slug: "slim-fit-chinos" },
    update: {},
    create: {
      name: "Slim Fit Chinos",
      slug: "slim-fit-chinos",
      description: "Modern slim-fit chinos in premium cotton twill. A wardrobe essential.",
      basePrice: 3800,
      isCustomizable: false,
      categoryId: trousers.id,
    },
  });

  const classicShalwar = await prisma.product.upsert({
    where: { slug: "classic-shalwar" },
    update: {},
    create: {
      name: "Classic Shalwar",
      slug: "classic-shalwar",
      description: "Traditional tapered shalwar in soft cotton. Comfortable and versatile.",
      basePrice: 2200,
      isCustomizable: false,
      categoryId: trousers.id,
    },
  });

  // --- Fabric ---

  const cottonFabric = await prisma.product.upsert({
    where: { slug: "premium-cotton-fabric" },
    update: {},
    create: {
      name: "Premium Cotton Fabric (3 meters)",
      slug: "premium-cotton-fabric",
      description: "High-thread-count Egyptian cotton fabric. Sold per 3-meter cut — perfect for a custom shirt or kurta.",
      basePrice: 3200,
      isCustomizable: false,
      categoryId: fabric.id,
    },
  });

  const silkFabric = await prisma.product.upsert({
    where: { slug: "raw-silk-fabric" },
    update: {},
    create: {
      name: "Raw Silk Fabric (3 meters)",
      slug: "raw-silk-fabric",
      description: "Natural raw silk with a subtle sheen. Ideal for formal kurtas and waistcoats.",
      basePrice: 6500,
      isCustomizable: false,
      categoryId: fabric.id,
    },
  });

  // --- Sherwani (customizable / made-to-order) ---

  const weddingSherwani = await prisma.product.upsert({
    where: { slug: "wedding-sherwani" },
    update: {},
    create: {
      name: "Wedding Sherwani",
      slug: "wedding-sherwani",
      description: "Hand-embroidered wedding sherwani in raw silk with zardozi detailing. Made-to-order with custom measurements.",
      basePrice: 45000,
      isCustomizable: true,
      categoryId: sherwanis.id,
    },
  });

  console.log("✅ Products created: 8 products across 4 categories");

  // =========================================================================
  // 3. Product Variants (1-2 per product)
  // =========================================================================

  const variants = await Promise.all([
    // Classic Oxford Shirt — White, S/M/L
    prisma.productVariant.create({ data: { productId: classicOxford.id, color: "White", size: "S", sku: "COX-WHT-S", price: 4500, stockQuantity: 15 } }),
    prisma.productVariant.create({ data: { productId: classicOxford.id, color: "White", size: "M", sku: "COX-WHT-M", price: 4500, stockQuantity: 20 } }),
    prisma.productVariant.create({ data: { productId: classicOxford.id, color: "White", size: "L", sku: "COX-WHT-L", price: 4500, stockQuantity: 18 } }),

    // Linen Kurta — Beige, M/L/XL
    prisma.productVariant.create({ data: { productId: linenKurta.id, color: "Beige", size: "M", sku: "LNK-BEG-M", price: 5200, stockQuantity: 12 } }),
    prisma.productVariant.create({ data: { productId: linenKurta.id, color: "Beige", size: "L", sku: "LNK-BEG-L", price: 5200, stockQuantity: 10 } }),
    prisma.productVariant.create({ data: { productId: linenKurta.id, color: "Beige", size: "XL", sku: "LNK-BEG-XL", price: 5200, stockQuantity: 8 } }),

    // Silk Formal Shirt — Navy, M/L
    prisma.productVariant.create({ data: { productId: silkFormalShirt.id, color: "Navy", size: "M", sku: "SFS-NVY-M", price: 7800, stockQuantity: 6 } }),
    prisma.productVariant.create({ data: { productId: silkFormalShirt.id, color: "Navy", size: "L", sku: "SFS-NVY-L", price: 7800, stockQuantity: 8 } }),

    // Slim Fit Chinos — Khaki, 30/32/34
    prisma.productVariant.create({ data: { productId: slimChinos.id, color: "Khaki", size: "30", sku: "SFC-KHK-30", price: 3800, stockQuantity: 14 } }),
    prisma.productVariant.create({ data: { productId: slimChinos.id, color: "Khaki", size: "32", sku: "SFC-KHK-32", price: 3800, stockQuantity: 18 } }),
    prisma.productVariant.create({ data: { productId: slimChinos.id, color: "Khaki", size: "34", sku: "SFC-KHK-34", price: 3800, stockQuantity: 10 } }),

    // Classic Shalwar — White, Free Size
    prisma.productVariant.create({ data: { productId: classicShalwar.id, color: "White", size: "Free", sku: "CLS-WHT-F", price: 2200, stockQuantity: 25 } }),

    // Premium Cotton Fabric — White, 3m
    prisma.productVariant.create({ data: { productId: cottonFabric.id, color: "White", size: "3m", sku: "PCF-WHT-3M", price: 3200, stockQuantity: 30 } }),

    // Raw Silk Fabric — Ivory, 3m
    prisma.productVariant.create({ data: { productId: silkFabric.id, color: "Ivory", size: "3m", sku: "RSF-IVR-3M", price: 6500, stockQuantity: 12 } }),

    // Wedding Sherwani — One size (made-to-order)
    prisma.productVariant.create({ data: { productId: weddingSherwani.id, color: "Gold", size: "Custom", sku: "WSD-GLD-C", price: 45000, stockQuantity: 0 } }),
  ]);

  console.log("✅ Variants created:", variants.length, "variants");

  // =========================================================================
  // 4. Product Images (1 per product)
  // =========================================================================

  const images = await Promise.all([
    prisma.productImage.create({ data: { productId: classicOxford.id, url: placeholderImage("Oxford Shirt", "2C3E50"), altText: "Classic Oxford Shirt in White", displayOrder: 0 } }),
    prisma.productImage.create({ data: { productId: linenKurta.id, url: placeholderImage("Linen Kurta", "D4A574"), altText: "Linen Kurta in Beige", displayOrder: 0 } }),
    prisma.productImage.create({ data: { productId: silkFormalShirt.id, url: placeholderImage("Silk Shirt", "1B2838"), altText: "Silk Formal Shirt in Navy", displayOrder: 0 } }),
    prisma.productImage.create({ data: { productId: slimChinos.id, url: placeholderImage("Slim Chinos", "8B7355"), altText: "Slim Fit Chinos in Khaki", displayOrder: 0 } }),
    prisma.productImage.create({ data: { productId: classicShalwar.id, url: placeholderImage("Classic Shalwar", "ECF0F1"), altText: "Classic Shalwar in White", displayOrder: 0 } }),
    prisma.productImage.create({ data: { productId: cottonFabric.id, url: placeholderImage("Cotton Fabric", "BDC3C7"), altText: "Premium Cotton Fabric roll", displayOrder: 0 } }),
    prisma.productImage.create({ data: { productId: silkFabric.id, url: placeholderImage("Silk Fabric", "C9B037"), altText: "Raw Silk Fabric roll in Ivory", displayOrder: 0 } }),
    prisma.productImage.create({ data: { productId: weddingSherwani.id, url: placeholderImage("Wedding Sherwani", "8B6914"), altText: "Wedding Sherwani with zardozi embroidery", displayOrder: 0 } }),
  ]);

  console.log("✅ Images created:", images.length, "images");

  // =========================================================================
  // Summary
  // =========================================================================

  const productCount = await prisma.product.count();
  const variantCount = await prisma.productVariant.count();
  const imageCount = await prisma.productImage.count();
  const categoryCount = await prisma.category.count();

  console.log("\n📊 Seed complete:");
  console.log(`   Categories: ${categoryCount}`);
  console.log(`   Products:   ${productCount}`);
  console.log(`   Variants:   ${variantCount}`);
  console.log(`   Images:     ${imageCount}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error("❌ Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });

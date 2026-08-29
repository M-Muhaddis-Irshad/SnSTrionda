import "dotenv/config";
import { prisma } from "./src/db";

async function main() {
  try {
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        images: {
          select: { id: true, url: true, altText: true, displayOrder: true },
          orderBy: { displayOrder: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });
    
    console.log(`Total products: ${products.length}\n`);
    for (const p of products) {
      console.log(`--- ${p.name} (active: ${p.isActive}) ---`);
      for (const img of p.images) {
        const isPlaceholder = img.url.includes("placehold.co");
        const isCloudinary = img.url.includes("cloudinary.com") || img.url.includes("res.cloudinary");
        console.log(`  [${img.displayOrder}] ${isPlaceholder ? "PLACEHOLDER" : isCloudinary ? "CLOUDINARY" : "UNKNOWN"}: ${img.url}`);
      }
    }

    // Also check if there are any Cloudinary uploads anywhere
    const cloudinaryCount = await prisma.productImage.count({
      where: { url: { contains: "cloudinary" } },
    });
    console.log(`\nTotal Cloudinary images: ${cloudinaryCount}`);
    
    const placeholderCount = await prisma.productImage.count({
      where: { url: { contains: "placehold.co" } },
    });
    console.log(`Total placeholder images: ${placeholderCount}`);

  } catch (e: any) {
    console.error("Error:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();

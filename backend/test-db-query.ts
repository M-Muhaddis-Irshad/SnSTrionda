import "dotenv/config";
import { prisma } from "./src/db";

async function main() {
  try {
    const products = await prisma.product.findMany({
      select: { id: true, name: true, slug: true, images: true },
      take: 3,
    });
    console.log(JSON.stringify(products, null, 2));
  } catch (e: any) {
    console.error("Error:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();

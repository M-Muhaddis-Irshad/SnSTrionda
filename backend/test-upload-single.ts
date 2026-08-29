import "dotenv/config";
import { prisma } from "./src/db";
import cloudinary, { CLOUDINARY_FOLDER } from "./src/config/cloudinary";
import https from "https";

function downloadImage(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Download timeout")), 15000);
    https
      .get(url, { headers: { "User-Agent": "TriondaWears/1.0" } }, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          clearTimeout(timeout);
          return downloadImage(res.headers.location).then(resolve, reject);
        }
        if (res.statusCode !== 200) {
          clearTimeout(timeout);
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => { clearTimeout(timeout); resolve(Buffer.concat(chunks)); });
        res.on("error", (e) => { clearTimeout(timeout); reject(e); });
      })
      .on("error", (e) => { clearTimeout(timeout); reject(e); });
  });
}

function uploadBuffer(buffer: Buffer, publicId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: CLOUDINARY_FOLDER, public_id: publicId, resource_type: "image", overwrite: true },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error("No result"));
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

async function main() {
  try {
    // Step 1: Download from picsum
    const url = "https://picsum.photos/id/9762/800/1000";
    console.log("1. Downloading image...");
    const buffer = await downloadImage(url);
    console.log(`   ✅ Downloaded ${(buffer.length / 1024).toFixed(1)} KB`);

    // Step 2: Upload to Cloudinary
    console.log("2. Uploading to Cloudinary...");
    const cloudinaryUrl = await uploadBuffer(buffer, "classic-oxford-shirt");
    console.log(`   ✅ ${cloudinaryUrl}`);

    // Step 3: Update DB
    console.log("3. Updating database...");
    const product = await prisma.product.findUnique({ where: { slug: "classic-oxford-shirt" } });
    if (!product) throw new Error("Product not found");
    
    const result = await prisma.productImage.updateMany({
      where: { productId: product.id },
      data: { url: cloudinaryUrl, altText: "Classic Oxford Shirt in White" },
    });
    console.log(`   ✅ Updated ${result.count} record(s)`);

    // Step 4: Verify
    console.log("4. Verifying...");
    const img = await prisma.productImage.findFirst({ where: { productId: product.id } });
    console.log(`   ✅ DB URL: ${img?.url}`);

    console.log("\n🎉 All steps passed!");
  } catch (err: any) {
    console.error("❌ Error:", err.message || err);
  } finally {
    await prisma.$disconnect();
  }
}

main();

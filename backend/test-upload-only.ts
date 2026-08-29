import "dotenv/config";
import cloudinary, { CLOUDINARY_FOLDER } from "./src/config/cloudinary";
import https from "https";

function downloadImage(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Download timeout after 10s")), 10000);
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
    console.log("1. Downloading from picsum.photos...");
    const buffer = await downloadImage("https://picsum.photos/id/9762/800/1000");
    console.log(`   ✅ ${(buffer.length / 1024).toFixed(1)} KB`);

    console.log("2. Uploading to Cloudinary...");
    const url = await uploadBuffer(buffer, "test-single-upload");
    console.log(`   ✅ ${url}`);
    console.log("\n🎉 Upload succeeded!");
  } catch (err: any) {
    console.error("❌ Error:", err.message || err);
    if (err.code) console.error("   Code:", err.code);
  }
}

main();

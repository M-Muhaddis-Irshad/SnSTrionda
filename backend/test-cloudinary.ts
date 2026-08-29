// Quick test: can we upload to Cloudinary at all?
import "dotenv/config";
import cloudinary from "./src/config/cloudinary";

async function main() {
  try {
    // Test with a simple data URI (1x1 red pixel PNG)
    const dataUri = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
    
    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload(
        dataUri,
        {
          folder: "trionda-wears/test",
          public_id: "test-connectivity",
          resource_type: "image",
          overwrite: true,
        },
        (error, result) => {
          if (error) return reject(error);
          if (!result) return reject(new Error("No result"));
          resolve(result);
        }
      );
    });
    
    console.log("✅ Cloudinary upload works!");
    console.log("   URL:", result.secure_url);
    console.log("   Public ID:", result.public_id);
  } catch (err: any) {
    console.error("❌ Cloudinary upload failed:", err.message || err);
    console.error("   Full error:", JSON.stringify(err, null, 2));
  }
}

main();

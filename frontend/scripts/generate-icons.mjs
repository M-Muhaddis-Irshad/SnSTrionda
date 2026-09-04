// =============================================================================
// Generate PWA icons from frontend/public/logo/trionda-icon-mark.png
// (1536x1024 — non-square source). Composes onto a square #000000 canvas
// with "contain" fit (no stretching), centered, then exports:
//
//   icon-512.png          512x512, purpose "any"
//   icon-192.png          192x192, purpose "any"   (downscale of the 512 result)
//   icon-512-maskable.png 512x512, purpose "maskable" (content within ~80% safe zone)
//
// Run: node scripts/generate-icons.mjs
// =============================================================================

import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dirname, "../public/logo/trionda-icon-mark.png");
const OUT = join(__dirname, "../public/logo/");

const SIZE = 512;
const MASKABLE_CONTENT_RATIO = 0.8; // content fills 80% of the canvas (safe zone)
const BLACK = { r: 0, g: 0, b: 0, alpha: 1 };

async function compose(contentSizePx) {
  // 1) Contain-fit the (non-square) source onto a contentSizePx x contentSizePx
  //    transparent canvas — preserves aspect ratio, no stretching.
  const fitted = await sharp(SRC)
    .resize(contentSizePx, contentSizePx, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  // 2) Composite that square buffer centered onto the final square black canvas.
  return sharp({
    create: {
      width: SIZE,
      height: SIZE,
      channels: 4,
      background: BLACK,
    },
  })
    .composite([
      {
        input: fitted,
        top: Math.round((SIZE - contentSizePx) / 2),
        left: Math.round((SIZE - contentSizePx) / 2),
      },
    ])
    .png();
}

async function main() {
  const sourceMeta = await sharp(SRC).metadata();
  console.log(
    `source: ${SRC} -> ${sourceMeta.width}x${sourceMeta.height} (${sourceMeta.format})`
  );

  // 512 "any"
  const big512 = await (await compose(SIZE)).png().toBuffer();
  await sharp(big512).toFile(join(OUT, "icon-512.png"));

  // 192 "any" — downscale of the same composed 512 result (resize the buffer
  // separately; chaining resize after composite trips sharp's dimension check)
  await sharp(big512).resize(192, 192).png().toFile(join(OUT, "icon-192.png"));

  // 512 maskable — content within the ~80% safe zone (maskable icons get
  // circle-cropped by some launchers, so content must stay inside the middle)
  const maskableContent = Math.round(SIZE * MASKABLE_CONTENT_RATIO);
  await (await compose(maskableContent)).png().toFile(join(OUT, "icon-512-maskable.png"));

  // Verify — don't assume, read back the actual files.
  for (const f of ["icon-512.png", "icon-192.png", "icon-512-maskable.png"]) {
    const m = await sharp(join(OUT, f)).metadata();
    console.log(
      `output: ${f} -> ${m.width}x${m.height} (${m.format}, ${Math.round(m.size / 1024)}KB)`
    );
  }

}

main().catch((err) => {
  console.error("icon generation failed:", err);
  process.exit(1);
});
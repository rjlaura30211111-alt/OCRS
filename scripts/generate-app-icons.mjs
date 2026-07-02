/**
 * Generate PWA icon sizes from public/app-icons/OCRS.png
 *
 * Usage: npm run generate-app-icons
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.join(__dirname, "..", "public", "app-icons");
const sourcePath = path.join(iconsDir, "OCRS.png");

const outputs = [
  { file: "icon-512.png", size: 512 },
  { file: "icon-192.png", size: 192 },
  { file: "icon-180.png", size: 180 },
  { file: "favicon-32.png", size: 32 },
];

if (!fs.existsSync(sourcePath)) {
  console.error(`Source icon not found: ${sourcePath}`);
  console.error("Place OCRS.png in public/app-icons/ first.");
  process.exit(1);
}

const metadata = await sharp(sourcePath).metadata();
console.log(
  `Source: OCRS.png (${metadata.width}x${metadata.height}, ${metadata.format})`
);

for (const { file, size } of outputs) {
  const outputPath = path.join(iconsDir, file);

  await sharp(sourcePath)
    .resize(size, size, {
      fit: "contain",
      background: { r: 248, g: 250, b: 252, alpha: 1 },
    })
    .png()
    .toFile(outputPath);

  console.log(`Created ${file} (${size}x${size})`);
}

console.log("Done. Icons ready in public/app-icons/");

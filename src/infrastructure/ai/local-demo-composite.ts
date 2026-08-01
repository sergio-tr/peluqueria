import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const OUTPUT_SIZE = 768;
const HALF = Math.floor(OUTPUT_SIZE / 2);

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function loadReferenceImageBuffer(
  referenceImageUrl: string,
  referenceImagePath?: string,
): Promise<Buffer> {
  const relative = (referenceImagePath ?? "")
    .replace(/^\//, "")
    .replace(/^public\//, "");
  if (relative.startsWith("hairstyles/")) {
    const candidates = [
      path.join(process.cwd(), "public", relative),
      path.join(process.cwd(), "peluqueria", "public", relative),
      // Prefer catalog portrait for the demo collage (clearer than ai-reference).
      path.join(
        process.cwd(),
        "public",
        relative.replace("/ai-reference.png", "/catalog.png"),
      ),
    ];
    for (const filePath of candidates) {
      try {
        return await readFile(filePath);
      } catch {
        // try next
      }
    }
  }

  const response = await fetch(referenceImageUrl, { redirect: "follow" });
  if (!response.ok) {
    throw new Error(`reference_fetch_${response.status}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

async function panel(
  image: Buffer,
  width: number,
  height: number,
): Promise<Buffer> {
  return sharp(image)
    .rotate()
    .resize(width, height, { fit: "cover", position: "attention" })
    .jpeg({ quality: 90 })
    .toBuffer();
}

/**
 * Local demo "result": clear before/after collage for video recording.
 * Left = user photo, right = selected cut catalog. Not generative AI.
 */
export async function composeLocalDemoTryOn(options: {
  sourceImage: Buffer;
  referenceImage: Buffer;
  hairstyleSlug: string;
}): Promise<Buffer> {
  const { sourceImage, referenceImage, hairstyleSlug } = options;
  const label = hairstyleSlug.replace(/-/g, " ");

  // Prefer catalog portrait when reference is the hair-only overlay.
  let styleImage = referenceImage;
  const catalogPath = path.join(
    process.cwd(),
    "public",
    "hairstyles",
    hairstyleSlug,
    "catalog.png",
  );
  try {
    styleImage = await readFile(catalogPath);
  } catch {
    // keep referenceImage
  }

  const left = await panel(sourceImage, HALF, OUTPUT_SIZE);
  const right = await panel(styleImage, OUTPUT_SIZE - HALF, OUTPUT_SIZE);

  const chrome = Buffer.from(`<svg width="${OUTPUT_SIZE}" height="${OUTPUT_SIZE}" xmlns="http://www.w3.org/2000/svg">
  <rect x="${HALF - 2}" y="0" width="4" height="${OUTPUT_SIZE}" fill="rgba(20,16,12,0.85)"/>
  <rect x="0" y="0" width="${HALF}" height="48" fill="rgba(20,16,12,0.72)"/>
  <rect x="${HALF}" y="0" width="${OUTPUT_SIZE - HALF}" height="48" fill="rgba(20,16,12,0.72)"/>
  <text x="20" y="32" fill="#f2efe8" font-family="Georgia, serif" font-size="20">Tu foto</text>
  <text x="${HALF + 20}" y="32" fill="#f2efe8" font-family="Georgia, serif" font-size="20">${escapeXml(label)}</text>
  <rect x="0" y="${OUTPUT_SIZE - 52}" width="${OUTPUT_SIZE}" height="52" fill="rgba(20,16,12,0.82)"/>
  <text x="20" y="${OUTPUT_SIZE - 18}" fill="#f2efe8" font-family="Georgia, serif" font-size="18">Demostración local · sin Replicate</text>
</svg>`);

  return sharp({
    create: {
      width: OUTPUT_SIZE,
      height: OUTPUT_SIZE,
      channels: 3,
      background: { r: 24, g: 20, b: 16 },
    },
  })
    .composite([
      { input: left, left: 0, top: 0 },
      { input: right, left: HALF, top: 0 },
      { input: chrome, left: 0, top: 0 },
    ])
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer();
}

/** HairCLIP returns inverted|edited side-by-side; keep the edited half. */
export async function cropHairclipEditedHalf(image: Buffer): Promise<Buffer> {
  const meta = await sharp(image).metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (width < 2 || height < 2) {
    return image;
  }
  const half = Math.floor(width / 2);
  return sharp(image)
    .extract({ left: half, top: 0, width: width - half, height })
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer();
}

import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const OUTPUT_SIZE = 768;

/** Stable per-slug tint so each cut looks visually distinct in the demo video. */
function tintForSlug(slug: string): { r: number; g: number; b: number } {
  let hash = 0;
  for (let i = 0; i < slug.length; i += 1) {
    hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  }
  return {
    r: 40 + (hash % 80),
    g: 30 + ((hash >>> 8) % 70),
    b: 25 + ((hash >>> 16) % 60),
  };
}

export async function loadReferenceImageBuffer(
  referenceImageUrl: string,
  referenceImagePath?: string,
): Promise<Buffer> {
  const relative = (referenceImagePath ?? "")
    .replace(/^\//, "")
    .replace(/^public\//, "");
  if (relative.startsWith("hairstyles/")) {
    const filePath = path.join(process.cwd(), "public", relative);
    try {
      return await readFile(filePath);
    } catch {
      // Fall through to HTTP fetch (e.g. Netlify without public files on disk).
    }
  }

  const response = await fetch(referenceImageUrl, { redirect: "follow" });
  if (!response.ok) {
    throw new Error(`reference_fetch_${response.status}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

/**
 * Local demo try-on: blends the catalog hair reference onto the upper head
 * region of the source photo. Not a real generative model — labeled Demostración.
 */
export async function composeLocalDemoTryOn(options: {
  sourceImage: Buffer;
  referenceImage: Buffer;
  hairstyleSlug: string;
}): Promise<Buffer> {
  const { sourceImage, referenceImage, hairstyleSlug } = options;
  const tint = tintForSlug(hairstyleSlug);

  const base = await sharp(sourceImage)
    .rotate()
    .resize(OUTPUT_SIZE, OUTPUT_SIZE, { fit: "cover", position: "attention" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const hair = await sharp(referenceImage)
    .resize(OUTPUT_SIZE, Math.round(OUTPUT_SIZE * 0.55), {
      fit: "cover",
      position: "top",
    })
    .ensureAlpha()
    .modulate({ brightness: 0.92, saturation: 1.15 })
    .tint(tint)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const out = Buffer.from(base.data);
  const hairH = hair.info.height;
  const hairW = hair.info.width;
  const hairTop = Math.round(OUTPUT_SIZE * 0.02);

  for (let y = 0; y < hairH; y += 1) {
    const destY = hairTop + y;
    if (destY < 0 || destY >= OUTPUT_SIZE) continue;
    // Fade: stronger at crown, soft at face boundary.
    const fade = 1 - y / hairH;
    const strength = Math.pow(fade, 1.35) * 0.72;

    for (let x = 0; x < hairW; x += 1) {
      const hi = (y * hairW + x) * 4;
      const hairA = hair.data[hi + 3]! / 255;
      if (hairA < 0.08) continue;

      // Prefer darker / more saturated pixels from the reference (hair mass).
      const hr = hair.data[hi]!;
      const hg = hair.data[hi + 1]!;
      const hb = hair.data[hi + 2]!;
      const lum = (hr + hg + hb) / (3 * 255);
      const hairWeight = hairA * strength * (0.35 + (1 - lum) * 0.65);
      if (hairWeight < 0.04) continue;

      const di = (destY * OUTPUT_SIZE + x) * 4;
      const mix = Math.min(0.85, hairWeight);
      out[di] = Math.round(out[di]! * (1 - mix) + hr * mix);
      out[di + 1] = Math.round(out[di + 1]! * (1 - mix) + hg * mix);
      out[di + 2] = Math.round(out[di + 2]! * (1 - mix) + hb * mix);
    }
  }

  return sharp(out, {
    raw: {
      width: OUTPUT_SIZE,
      height: OUTPUT_SIZE,
      channels: 4,
    },
  })
    .jpeg({ quality: 88, mozjpeg: true })
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

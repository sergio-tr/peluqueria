/**
 * Generates synthetic demo PNG assets for catalog hairstyles (Phase 2D / D-05).
 * Run: node scripts/generate-hairstyle-assets.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const PUBLIC = path.join(ROOT, "public");

const ASSET_VERSION = "1.0.0-synthetic-mvp";

const STYLES = [
  { slug: "low-fade", name: "Low fade", hue: 210 },
  { slug: "mid-fade", name: "Mid fade", hue: 195 },
  { slug: "high-fade", name: "High fade", hue: 180 },
  { slug: "french-crop", name: "French crop", hue: 150 },
  { slug: "buzz-cut", name: "Buzz cut", hue: 240 },
  { slug: "pompadour", name: "Pompadour", hue: 30 },
  { slug: "slick-back", name: "Slick back", hue: 260 },
  { slug: "curly-crop", name: "Curly crop", hue: 320 },
];

const ROLES = [
  { key: "catalog", label: "Catalog", width: 800, height: 1000 },
  { key: "ai-reference", label: "AI reference", width: 512, height: 512 },
  { key: "thumbnail", label: "Thumbnail", width: 200, height: 250 },
];

function svgForStyle({ name, hue }, { label, width, height }) {
  const bg = `hsl(${hue} 35% 22%)`;
  const accent = `hsl(${hue} 55% 55%)`;
  const muted = `hsl(${hue} 15% 65%)`;
  const titleSize = width >= 512 ? 44 : 22;
  const subSize = width >= 512 ? 22 : 11;
  const metaSize = width >= 512 ? 16 : 9;

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${bg}"/>
  <rect x="8" y="8" width="${width - 16}" height="${height - 16}" fill="none" stroke="${accent}" stroke-width="3" rx="12"/>
  <text x="50%" y="38%" text-anchor="middle" fill="white" font-family="Arial,sans-serif" font-size="${titleSize}" font-weight="700">${escapeXml(name)}</text>
  <text x="50%" y="48%" text-anchor="middle" fill="${accent}" font-family="Arial,sans-serif" font-size="${subSize}" font-weight="600">${escapeXml(label)}</text>
  <text x="50%" y="58%" text-anchor="middle" fill="${muted}" font-family="Arial,sans-serif" font-size="${metaSize}">SYNTHETIC DEMO ASSET</text>
  <text x="50%" y="66%" text-anchor="middle" fill="${muted}" font-family="Arial,sans-serif" font-size="${metaSize}">v${ASSET_VERSION}</text>
</svg>`;
}

function escapeXml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function generateStyle(style) {
  const dir = path.join(PUBLIC, "hairstyles", style.slug);
  await mkdir(dir, { recursive: true });

  for (const role of ROLES) {
    const svg = svgForStyle(style, role);
    const outPath = path.join(dir, `${role.key}.png`);
    await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(outPath);
  }
}

async function main() {
  for (const style of STYLES) {
    await generateStyle(style);
    console.log(`Generated assets for ${style.slug}`);
  }

  const manifest = {
    assetVersion: ASSET_VERSION,
    provenance: "synthetic-generated-mvp",
    usageRights: "demo-internal-only",
    generatedAt: new Date().toISOString(),
    styles: STYLES.map((s) => s.slug),
  };
  await writeFile(
    path.join(PUBLIC, "hairstyles", "asset-manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

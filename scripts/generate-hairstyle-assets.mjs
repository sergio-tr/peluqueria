/**
 * Generates synthetic demo PNG assets for catalog hairstyles (Phase 2D / D-05).
 * Distinct silhouette portraits so the picker shows real visual differences.
 * Run: node scripts/generate-hairstyle-assets.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const PUBLIC = path.join(ROOT, "public");

const ASSET_VERSION = "1.2.0-hair-overlay";

/**
 * Hair recipes as layered SVG snippets (viewBox 0 0 200 260).
 * Each style must read as a different cut at thumbnail size.
 */
const STYLES = [
  {
    slug: "low-fade",
    name: "Low fade",
    layers: `
      <ellipse cx="100" cy="118" rx="48" ry="40" fill="#1a1410"/>
      <path d="M52 130 Q100 105 148 130 L145 155 Q100 135 55 155 Z" fill="#2c241e"/>
      <path d="M58 95 Q100 55 142 95 L138 125 Q100 95 62 125 Z" fill="#0f0c0a"/>
    `,
  },
  {
    slug: "mid-fade",
    name: "Mid fade",
    layers: `
      <ellipse cx="100" cy="110" rx="46" ry="42" fill="#1a1410"/>
      <path d="M54 115 Q100 85 146 115 L142 145 Q100 120 58 145 Z" fill="#2c241e"/>
      <path d="M62 78 Q100 42 138 78 L134 112 Q100 82 66 112 Z" fill="#0f0c0a"/>
    `,
  },
  {
    slug: "high-fade",
    name: "High fade",
    layers: `
      <ellipse cx="100" cy="100" rx="40" ry="36" fill="#1a1410"/>
      <path d="M62 95 Q100 70 138 95 L132 125 Q100 100 68 125 Z" fill="#2c241e"/>
      <ellipse cx="100" cy="78" rx="34" ry="28" fill="#0f0c0a"/>
    `,
  },
  {
    slug: "french-crop",
    name: "French crop",
    layers: `
      <path d="M55 100 Q100 45 145 100 L140 118 Q100 95 60 118 Z" fill="#0f0c0a"/>
      <rect x="58" y="100" width="84" height="28" rx="6" fill="#1a1410"/>
      <path d="M58 118 Q100 128 142 118" fill="#2c241e"/>
    `,
  },
  {
    slug: "buzz-cut",
    name: "Buzz cut",
    layers: `
      <ellipse cx="100" cy="105" rx="44" ry="38" fill="#2a221c"/>
      <ellipse cx="100" cy="100" rx="40" ry="34" fill="#3a322c"/>
    `,
  },
  {
    slug: "pompadour",
    name: "Pompadour",
    layers: `
      <path d="M55 125 Q48 70 100 28 Q155 55 148 125 L140 135 Q100 90 60 135 Z" fill="#0f0c0a"/>
      <path d="M70 70 Q100 35 135 75 Q120 95 100 85 Q80 95 70 70 Z" fill="#1a1410"/>
      <path d="M58 125 Q100 105 142 125 L140 145 Q100 125 60 145 Z" fill="#2c241e"/>
    `,
  },
  {
    slug: "slick-back",
    name: "Slick back",
    layers: `
      <path d="M52 110 Q55 55 100 40 Q150 55 150 120 L145 130 Q100 90 55 130 Z" fill="#0f0c0a"/>
      <path d="M60 90 Q100 55 142 95 L138 120 Q100 90 62 120 Z" fill="#1a1410"/>
      <path d="M55 125 Q100 110 145 125 L142 148 Q100 130 58 148 Z" fill="#2c241e"/>
    `,
  },
  {
    slug: "curly-crop",
    name: "Curly crop",
    layers: `
      <circle cx="70" cy="70" r="18" fill="#0f0c0a"/>
      <circle cx="100" cy="55" r="20" fill="#0f0c0a"/>
      <circle cx="130" cy="70" r="18" fill="#0f0c0a"/>
      <circle cx="60" cy="95" r="16" fill="#1a1410"/>
      <circle cx="140" cy="95" r="16" fill="#1a1410"/>
      <circle cx="85" cy="85" r="15" fill="#1a1410"/>
      <circle cx="115" cy="85" r="15" fill="#1a1410"/>
      <ellipse cx="100" cy="105" rx="42" ry="30" fill="#0f0c0a"/>
      <path d="M58 120 Q100 135 142 120" fill="#2c241e"/>
    `,
  },
];

const ROLES = [
  { key: "catalog", width: 800, height: 1000 },
  { key: "ai-reference", width: 768, height: 768 },
  { key: "thumbnail", width: 320, height: 400 },
];

function svgPortrait(style, width, height) {
  const skin = "#d4a574";
  const skinShadow = "#b8895c";
  const bg = "#243040";

  return `<svg width="${width}" height="${height}" viewBox="0 0 200 260" xmlns="http://www.w3.org/2000/svg">
  <rect width="200" height="260" fill="${bg}"/>
  <rect x="82" y="175" width="36" height="52" rx="10" fill="${skinShadow}"/>
  <ellipse cx="100" cy="148" rx="44" ry="54" fill="${skin}"/>
  <ellipse cx="54" cy="148" rx="9" ry="15" fill="${skinShadow}"/>
  <ellipse cx="146" cy="148" rx="9" ry="15" fill="${skinShadow}"/>
  ${style.layers}
  <ellipse cx="84" cy="145" rx="3.5" ry="2.2" fill="#2a221c" opacity="0.5"/>
  <ellipse cx="116" cy="145" rx="3.5" ry="2.2" fill="#2a221c" opacity="0.5"/>
  <path d="M88 168 Q100 176 112 168" fill="none" stroke="${skinShadow}" stroke-width="2" stroke-linecap="round"/>
  <text x="100" y="248" text-anchor="middle" fill="#f2efe8" font-family="Georgia,serif" font-size="11">${escapeXml(style.name)}</text>
</svg>`;
}

/** Transparent hair-only overlay used by local-demo try-on compositing. */
function svgHairOverlay(style, width, height) {
  // Crop the portrait viewBox to the hair band so the overlay sits on the crown.
  return `<svg width="${width}" height="${height}" viewBox="40 20 120 140" xmlns="http://www.w3.org/2000/svg">
  ${style.layers}
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
    const svg =
      role.key === "ai-reference"
        ? svgHairOverlay(style, role.width, role.height)
        : svgPortrait(style, role.width, role.height);
    const outPath = path.join(dir, `${role.key}.png`);
    await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(outPath);
  }
}

async function main() {
  for (const style of STYLES) {
    await generateStyle(style);
    console.log(`Generated silhouette assets for ${style.slug}`);
  }

  const manifest = {
    assetVersion: ASSET_VERSION,
    provenance: "synthetic-silhouette-mvp",
    usageRights: "demo-internal-only",
    generatedAt: new Date().toISOString(),
    styles: STYLES.map((s) => s.slug),
  };
  await writeFile(
    path.join(PUBLIC, "hairstyles", "asset-manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );
  console.log("Done.", ASSET_VERSION);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

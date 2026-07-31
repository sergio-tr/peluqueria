import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import {
  HAIRSTYLE_ASSET_VERSION,
  HAIRSTYLE_PROVENANCE,
  HAIRSTYLE_USAGE_RIGHTS,
  SEED_HAIRSTYLES,
  SEED_HAIRSTYLE_SLUGS,
  hairstyleAssetPaths,
} from "./seed-data";

const ROOT = path.join(import.meta.dirname, "..", "..", "..");
const PUBLIC = path.join(ROOT, "public");
const SEED_SQL = path.join(ROOT, "supabase", "seed", "seed.sql");

describe("seed hairstyle assets (D-05)", () => {
  it("defines eight canonical slugs", () => {
    expect(SEED_HAIRSTYLE_SLUGS).toHaveLength(8);
    expect(SEED_HAIRSTYLES.map((h) => h.slug)).toEqual([...SEED_HAIRSTYLE_SLUGS]);
  });

  it("each seed style has raster catalog, ai_reference, thumbnail and metadata", () => {
    for (const style of SEED_HAIRSTYLES) {
      expect(style.catalogImagePath).toMatch(/\.png$/);
      expect(style.aiReferenceImagePath).toMatch(/\.png$/);
      expect(style.thumbnailImagePath).toMatch(/\.png$/);
      expect(style.aiReferenceImagePath).not.toMatch(/\.svg$/i);
      expect(style.assetVersion).toBe(HAIRSTYLE_ASSET_VERSION);
      expect(style.provenance).toBe(HAIRSTYLE_PROVENANCE);
      expect(style.usageRights).toBe(HAIRSTYLE_USAGE_RIGHTS);
    }
  });

  it("maps asset paths under public/hairstyles/{slug}/", () => {
    for (const slug of SEED_HAIRSTYLE_SLUGS) {
      const paths = hairstyleAssetPaths(slug);
      expect(paths.catalog).toBe(`hairstyles/${slug}/catalog.png`);
      expect(paths.aiReference).toBe(`hairstyles/${slug}/ai-reference.png`);
      expect(paths.thumbnail).toBe(`hairstyles/${slug}/thumbnail.png`);
    }
  });

  it("seed SQL references raster paths only (no SVG ai_reference)", () => {
    const sql = readFileSync(SEED_SQL, "utf8");
    expect(sql).not.toMatch(/ai_reference_image_path.*\.svg/i);
    expect(sql).not.toMatch(/catalog_image_path.*\.svg/i);
    for (const slug of SEED_HAIRSTYLE_SLUGS) {
      expect(sql).toContain(`hairstyles/${slug}/ai-reference.png`);
      expect(sql).toContain(`hairstyles/${slug}/catalog.png`);
      expect(sql).toContain(`hairstyles/${slug}/thumbnail.png`);
    }
  });

  it("generated PNG files exist on disk for each slug and role", () => {
    for (const slug of SEED_HAIRSTYLE_SLUGS) {
      for (const role of ["catalog", "ai-reference", "thumbnail"] as const) {
        const filePath = path.join(PUBLIC, "hairstyles", slug, `${role}.png`);
        expect(existsSync(filePath), `missing ${filePath}`).toBe(true);
      }
    }
  });
});

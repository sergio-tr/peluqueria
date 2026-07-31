import fs from "node:fs/promises";
import path from "node:path";
import { FIXTURES_DIR, MANIFEST_PATH } from "./config.mjs";

export async function loadManifest() {
  const raw = await fs.readFile(MANIFEST_PATH, "utf8");
  return JSON.parse(raw);
}

export function expandMatrix48(manifest) {
  const pairs = [];
  for (const photo of manifest.photos) {
    for (const style of manifest.hairstyles) {
      pairs.push({
        photoId: photo.id,
        hairstyleSlug: style.slug,
      });
    }
  }
  if (pairs.length !== 48) {
    throw new Error(`matrix48 must have 48 pairs, got ${pairs.length}`);
  }
  return pairs;
}

export function resolvePhoto(manifest, photoId) {
  const photo = manifest.photos.find((p) => p.id === photoId);
  if (!photo) {
    throw new Error(`Unknown photoId: ${photoId}`);
  }
  return photo;
}

export function resolveHairstyle(manifest, slug) {
  const style = manifest.hairstyles.find((h) => h.slug === slug);
  if (!style) {
    throw new Error(`Unknown hairstyle slug: ${slug}`);
  }
  return style;
}

export function buildGenerationId(photoId, hairstyleSlug) {
  return `${photoId}__${hairstyleSlug}`;
}

export function defaultPrompt(modifier = "") {
  return [
    "Edit only the hair of the person in the first image.",
    "Preserve facial identity, expression, skin, clothing, and background exactly.",
    "Copy hair shape, length, texture, and silhouette from the reference image.",
    "Produce a realistic preview. Do not add accessories. Do not change age or facial features.",
    modifier,
  ]
    .filter(Boolean)
    .join(" ");
}

export async function loadGoldenAggregation() {
  const raw = await fs.readFile(
    path.join(FIXTURES_DIR, "golden-aggregation.json"),
    "utf8",
  );
  return JSON.parse(raw);
}

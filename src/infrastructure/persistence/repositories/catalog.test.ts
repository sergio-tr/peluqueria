import { describe, expect, it } from "vitest";
import { mapHairstyle, mapService } from "./catalog";

describe("catalog mappers", () => {
  it("maps service row to API shape", () => {
    expect(
      mapService({
        id: "1",
        slug: "corte-nowi",
        name: "Corte Nowi",
        price_cents: 2400,
        base_minutes: 45,
        requires_tryon: true,
        sort_order: 1,
      }),
    ).toEqual({
      id: "1",
      slug: "corte-nowi",
      name: "Corte Nowi",
      priceCents: 2400,
      baseMinutes: 45,
      requiresTryon: true,
      sortOrder: 1,
    });
  });

  it("maps hairstyle raster paths and asset metadata to API shape", () => {
    const mapped = mapHairstyle({
      id: "h1",
      slug: "low-fade",
      name: "Low fade",
      catalog_image_path: "hairstyles/low-fade/catalog.png",
      ai_reference_image_path: "hairstyles/low-fade/ai-reference.png",
      thumbnail_image_path: "hairstyles/low-fade/thumbnail.png",
      asset_version: "1.0.0-synthetic-mvp",
      provenance: "synthetic-generated-mvp",
      usage_rights: "demo-internal-only",
      complexity: "high",
      extra_minutes: 30,
      prompt_modifier: "x",
      sort_order: 1,
    });
    expect(mapped.catalogImageUrl).toBe("/hairstyles/low-fade/catalog.png");
    expect(mapped.thumbnailUrl).toBe("/hairstyles/low-fade/thumbnail.png");
    expect(mapped.assetVersion).toBe("1.0.0-synthetic-mvp");
    expect(mapped.provenance).toBe("synthetic-generated-mvp");
    expect(mapped.usageRights).toBe("demo-internal-only");
    expect(mapped.catalogImageUrl).not.toMatch(/\.svg$/i);
  });
});

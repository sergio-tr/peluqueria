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

  it("maps hairstyle catalog path to public url", () => {
    const mapped = mapHairstyle({
      id: "h1",
      slug: "low-fade",
      name: "Low fade",
      catalog_image_path: "hairstyles/catalog/low-fade.svg",
      ai_reference_image_path: "hairstyles/references/low-fade.svg",
      complexity: "high",
      extra_minutes: 30,
      prompt_modifier: "x",
      sort_order: 1,
    });
    expect(mapped.catalogImageUrl).toBe("/hairstyles/catalog/low-fade.svg");
  });
});

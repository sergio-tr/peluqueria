export const HAIRSTYLE_ASSET_VERSION = "1.0.0-synthetic-mvp";
export const HAIRSTYLE_PROVENANCE = "synthetic-generated-mvp";
export const HAIRSTYLE_USAGE_RIGHTS = "demo-internal-only";

/** Slugs seeded in supabase/seed/seed.sql — keep in sync. */
export const SEED_HAIRSTYLE_SLUGS = [
  "low-fade",
  "mid-fade",
  "high-fade",
  "french-crop",
  "buzz-cut",
  "pompadour",
  "slick-back",
  "curly-crop",
] as const;

export type SeedHairstyleSlug = (typeof SEED_HAIRSTYLE_SLUGS)[number];

export function hairstyleAssetPaths(slug: string) {
  return {
    catalog: `hairstyles/${slug}/catalog.png`,
    aiReference: `hairstyles/${slug}/ai-reference.png`,
    thumbnail: `hairstyles/${slug}/thumbnail.png`,
  };
}

export type SeedService = {
  id: string;
  slug: string;
  name: string;
  priceCents: number;
  baseMinutes: number;
  requiresTryon: boolean;
};

export type SeedHairstyle = {
  id: string;
  slug: string;
  name: string;
  catalogImagePath: string;
  aiReferenceImagePath: string;
  thumbnailImagePath: string;
  assetVersion: string;
  provenance: string;
  usageRights: string;
  complexity: "low" | "medium" | "high";
  extraMinutes: number;
  promptModifier: string;
};

export const SEED_SERVICES: SeedService[] = [
  {
    id: "s1",
    slug: "corte-nowi",
    name: "Corte Nowi",
    priceCents: 2400,
    baseMinutes: 45,
    requiresTryon: true,
  },
  {
    id: "s2",
    slug: "corte-barba",
    name: "Corte + barba",
    priceCents: 3400,
    baseMinutes: 60,
    requiresTryon: true,
  },
  {
    id: "s3",
    slug: "fade-premium",
    name: "Fade premium",
    priceCents: 2900,
    baseMinutes: 60,
    requiresTryon: true,
  },
  {
    id: "s4",
    slug: "cambio-look",
    name: "Cambio de look",
    priceCents: 3900,
    baseMinutes: 75,
    requiresTryon: true,
  },
  {
    id: "s5",
    slug: "arreglo-barba",
    name: "Arreglo de barba",
    priceCents: 1600,
    baseMinutes: 30,
    requiresTryon: false,
  },
];

const styles: Array<
  [SeedHairstyleSlug, string, SeedHairstyle["complexity"], number, string]
> = [
  [
    "low-fade",
    "Low fade",
    "high",
    30,
    "Clean low fade with gradual blend near the ears.",
  ],
  [
    "mid-fade",
    "Mid fade",
    "high",
    30,
    "Mid fade with balanced contrast and clean sides.",
  ],
  [
    "high-fade",
    "High fade",
    "high",
    30,
    "High fade with strong contrast and tight sides.",
  ],
  [
    "french-crop",
    "French crop",
    "medium",
    15,
    "French crop with textured fringe and short sides.",
  ],
  ["buzz-cut", "Buzz cut", "low", 0, "Even buzz cut, short and uniform length."],
  [
    "pompadour",
    "Pompadour",
    "high",
    30,
    "Classic pompadour volume on top with tapered sides.",
  ],
  [
    "slick-back",
    "Slick back",
    "medium",
    15,
    "Slick back with polished top and controlled sides.",
  ],
  [
    "curly-crop",
    "Curly crop",
    "medium",
    15,
    "Curly crop keeping natural curl pattern with shaped fringe.",
  ],
];

export const SEED_HAIRSTYLES: SeedHairstyle[] = styles.map(
  ([slug, name, complexity, extraMinutes, promptModifier], i) => {
    const paths = hairstyleAssetPaths(slug);
    return {
      id: `h${i + 1}`,
      slug,
      name,
      catalogImagePath: `/${paths.catalog}`,
      aiReferenceImagePath: `/${paths.aiReference}`,
      thumbnailImagePath: `/${paths.thumbnail}`,
      assetVersion: HAIRSTYLE_ASSET_VERSION,
      provenance: HAIRSTYLE_PROVENANCE,
      usageRights: HAIRSTYLE_USAGE_RIGHTS,
      complexity,
      extraMinutes,
      promptModifier,
    };
  },
);

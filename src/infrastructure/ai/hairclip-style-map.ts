/**
 * Map Nowi catalog slugs → HairCLIP enum prompts
 * (https://replicate.com/wty-ustc/hairclip).
 */
const HAIRCLIP_BY_SLUG: Record<string, string> = {
  "low-fade": "fade hairstyle",
  "mid-fade": "fade hairstyle",
  "high-fade": "hi-top fade hairstyle",
  "french-crop": "caesar cut hairstyle",
  "buzz-cut": "crew cut hairstyle",
  pompadour: "quiff hairstyle",
  "slick-back": "slicked-back hairstyle",
  "curly-crop": "short hair hairstyle",
};

export function hairclipDescriptionForSlug(slug: string): string {
  return HAIRCLIP_BY_SLUG[slug] ?? "short hair hairstyle";
}

export const HAIRCLIP_MODEL = "wty-ustc/hairclip";
/** Default version from Replicate model card (text hairstyle editing). */
export const HAIRCLIP_DEFAULT_VERSION =
  "b95cb2a16763bea87ed7ed851d5a3ab2f4655e94bcfb871edba029d4814fa587";

export type HairTryOnInput = {
  sourceImageUrl: string;
  referenceImageUrl: string;
  prompt: string;
  /** Catalog slug — used by HairCLIP text prompts / local demo tint. */
  hairstyleSlug?: string;
  webhookUrl?: string;
  webhookSecret?: string;
};

export type HairTryOnCreateResult = {
  externalId: string;
  reportedModelVersion?: string;
};

export interface HairTryOnProvider {
  readonly name: string;
  createPrediction(input: HairTryOnInput): Promise<HairTryOnCreateResult>;
}

export const PROMPT_VERSION = "v1-2026-07-30";

export function buildHairPrompt(modifier: string): string {
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

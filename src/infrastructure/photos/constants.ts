/** Max raw upload size (4 MB). */
export const MAX_UPLOAD_BYTES = 4_000_000;

/** Max width or height after normalization. */
export const MAX_IMAGE_DIMENSION = 4096;

/** Min width and height (reject tiny/spoof payloads). */
export const MIN_IMAGE_DIMENSION = 64;

/** JPEG quality for normalized output. */
export const OUTPUT_JPEG_QUALITY = 85;

/** Signed preview URL TTL (seconds). */
export const PREVIEW_URL_TTL_SECONDS = 60;

export const ALLOWED_IMAGE_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AllowedImageMime = (typeof ALLOWED_IMAGE_MIMES)[number];

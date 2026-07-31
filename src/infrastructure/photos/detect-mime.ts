import { AppError } from "@/domain/errors";
import {
  ALLOWED_IMAGE_MIMES,
  type AllowedImageMime,
} from "@/infrastructure/photos/constants";

type DetectedImage = {
  mime: AllowedImageMime;
  extension: "jpg" | "png" | "webp";
};

/**
 * Detect image type from magic bytes (content), not declared Content-Type.
 */
export function detectImageMime(buffer: Buffer): DetectedImage | null {
  if (buffer.length < 12) {
    return null;
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mime: "image/jpeg", extension: "jpg" };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { mime: "image/png", extension: "png" };
  }

  // WebP: RIFF....WEBP
  if (
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return { mime: "image/webp", extension: "webp" };
  }

  return null;
}

/**
 * Validate buffer content type and optionally reject declared MIME mismatches.
 */
export function validateImageContent(
  buffer: Buffer,
  declaredMime?: string | null,
): DetectedImage {
  const detected = detectImageMime(buffer);
  if (!detected) {
    throw new AppError(
      "INVALID_IMAGE",
      "Formato de imagen no soportado.",
      400,
    );
  }

  if (
    declaredMime &&
    declaredMime !== detected.mime &&
    !ALLOWED_IMAGE_MIMES.includes(declaredMime as AllowedImageMime)
  ) {
    throw new AppError(
      "MIME_MISMATCH",
      "El tipo declarado no coincide con el contenido.",
      400,
    );
  }

  if (
    declaredMime &&
    ALLOWED_IMAGE_MIMES.includes(declaredMime as AllowedImageMime) &&
    declaredMime !== detected.mime
  ) {
    throw new AppError(
      "MIME_MISMATCH",
      "El tipo declarado no coincide con el contenido.",
      400,
    );
  }

  return detected;
}

/** Returns true if buffer contains an EXIF APP1 segment (for tests). */
export function bufferHasExifMarker(buffer: Buffer): boolean {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    return false;
  }

  let offset = 2;
  while (offset + 4 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      return false;
    }
    const marker = buffer[offset + 1];
    if (marker === 0xd9) {
      break;
    }
    const segmentLength = buffer.readUInt16BE(offset + 2);
    if (segmentLength < 2) {
      return false;
    }
    if (marker === 0xe1) {
      const header = buffer.toString("ascii", offset + 4, offset + 10);
      if (header.startsWith("Exif")) {
        return true;
      }
    }
    offset += 2 + segmentLength;
  }

  return false;
}

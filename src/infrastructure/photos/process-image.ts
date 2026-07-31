import sharp from "sharp";
import { AppError } from "@/domain/errors";
import {
  MAX_IMAGE_DIMENSION,
  MAX_UPLOAD_BYTES,
  MIN_IMAGE_DIMENSION,
  OUTPUT_JPEG_QUALITY,
} from "@/infrastructure/photos/constants";
import { validateImageContent } from "@/infrastructure/photos/detect-mime";

export type ProcessedImage = {
  buffer: Buffer;
  width: number;
  height: number;
  mime: "image/jpeg";
};

/**
 * Validate size/dimensions, normalize to JPEG, strip EXIF/metadata.
 */
export async function processPhotoUpload(
  input: Buffer,
  declaredMime?: string | null,
): Promise<ProcessedImage> {
  if (input.byteLength === 0) {
    throw new AppError("INVALID_IMAGE", "Imagen vacía.", 400);
  }

  if (input.byteLength > MAX_UPLOAD_BYTES) {
    throw new AppError("IMAGE_TOO_LARGE", "La imagen es demasiado grande.", 400);
  }

  validateImageContent(input, declaredMime);

  let pipeline = sharp(input, { failOn: "error" }).rotate();

  const metadata = await pipeline.metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;

  if (width < MIN_IMAGE_DIMENSION || height < MIN_IMAGE_DIMENSION) {
    throw new AppError(
      "INVALID_DIMENSIONS",
      "Dimensiones de imagen no válidas.",
      400,
    );
  }

  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
    pipeline = pipeline.resize({
      width: MAX_IMAGE_DIMENSION,
      height: MAX_IMAGE_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  const buffer = await pipeline
    .jpeg({ quality: OUTPUT_JPEG_QUALITY, mozjpeg: true })
    .toBuffer();

  const outputMeta = await sharp(buffer).metadata();

  return {
    buffer,
    width: outputMeta.width ?? width,
    height: outputMeta.height ?? height,
    mime: "image/jpeg",
  };
}

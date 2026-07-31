import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { AppError } from "@/domain/errors";
import {
  bufferHasExifMarker,
  detectImageMime,
  validateImageContent,
} from "@/infrastructure/photos/detect-mime";

async function createPngBuffer(width = 128, height = 128): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 120, g: 80, b: 40 },
    },
  })
    .png()
    .toBuffer();
}

describe("validateImageContent", () => {
  it("rejects mime spoof when declared type does not match magic bytes", async () => {
    const png = await createPngBuffer();
    expect(detectImageMime(png)?.mime).toBe("image/png");

    expect(() => validateImageContent(png, "image/jpeg")).toThrow(AppError);
    try {
      validateImageContent(png, "image/jpeg");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe("MIME_MISMATCH");
    }
  });

  it("accepts matching declared mime", async () => {
    const png = await createPngBuffer();
    const detected = validateImageContent(png, "image/png");
    expect(detected.mime).toBe("image/png");
  });
});

describe("bufferHasExifMarker", () => {
  it("detects EXIF in JPEG with orientation metadata", async () => {
    const jpegWithExif = await sharp({
      create: {
        width: 120,
        height: 120,
        channels: 3,
        background: { r: 200, g: 100, b: 50 },
      },
    })
      .jpeg()
      .withMetadata({ orientation: 6 })
      .toBuffer();

    const meta = await sharp(jpegWithExif).metadata();
    expect(meta.orientation).toBe(6);
    expect(bufferHasExifMarker(jpegWithExif)).toBe(true);
  });
});

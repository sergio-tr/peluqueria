import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { AppError } from "@/domain/errors";
import { MAX_UPLOAD_BYTES } from "@/infrastructure/photos/constants";
import { bufferHasExifMarker } from "@/infrastructure/photos/detect-mime";
import { processPhotoUpload } from "@/infrastructure/photos/process-image";

async function createJpegWithExif(
  width = 200,
  height = 200,
): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 40, g: 120, b: 200 },
    },
  })
    .jpeg()
    .withMetadata({ orientation: 6 })
    .toBuffer();
}

describe("processPhotoUpload", () => {
  it("rejects oversize uploads", async () => {
    const oversized = Buffer.alloc(MAX_UPLOAD_BYTES + 1, 0xff);
    oversized[0] = 0xff;
    oversized[1] = 0xd8;
    oversized[2] = 0xff;

    await expect(processPhotoUpload(oversized)).rejects.toMatchObject({
      code: "IMAGE_TOO_LARGE",
    });
  });

  it("rejects images below minimum dimensions", async () => {
    const tiny = await sharp({
      create: {
        width: 32,
        height: 32,
        channels: 3,
        background: { r: 0, g: 0, b: 0 },
      },
    })
      .jpeg()
      .toBuffer();

    await expect(processPhotoUpload(tiny)).rejects.toMatchObject({
      code: "INVALID_DIMENSIONS",
    });
  });

  it("strips EXIF from fixture JPEG", async () => {
    const input = await createJpegWithExif();
    expect(bufferHasExifMarker(input)).toBe(true);

    const processed = await processPhotoUpload(input, "image/jpeg");
    expect(processed.mime).toBe("image/jpeg");
    expect(bufferHasExifMarker(processed.buffer)).toBe(false);

    const meta = await sharp(processed.buffer).metadata();
    expect(meta.exif).toBeUndefined();
    expect(meta.orientation).toBeUndefined();
  });

  it("normalizes PNG to JPEG", async () => {
    const png = await sharp({
      create: {
        width: 128,
        height: 128,
        channels: 3,
        background: { r: 255, g: 0, b: 0 },
      },
    })
      .png()
      .toBuffer();

    const processed = await processPhotoUpload(png, "image/png");
    expect(processed.mime).toBe("image/jpeg");
    expect(detectJpeg(processed.buffer)).toBe(true);
  });
});

function detectJpeg(buffer: Buffer): boolean {
  return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
}

describe("processPhotoUpload mime spoof", () => {
  it("rejects PNG declared as JPEG", async () => {
    const png = await sharp({
      create: {
        width: 128,
        height: 128,
        channels: 3,
        background: { r: 10, g: 10, b: 10 },
      },
    })
      .png()
      .toBuffer();

    await expect(processPhotoUpload(png, "image/jpeg")).rejects.toBeInstanceOf(
      AppError,
    );
  });
});

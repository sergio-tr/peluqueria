import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import sharp from "sharp";
import {
  composeLocalDemoTryOn,
  cropHairclipEditedHalf,
} from "./local-demo-composite";
import { hairclipDescriptionForSlug } from "./hairclip-style-map";

describe("local demo composite", () => {
  it("produces a side-by-side collage different per slug", async () => {
    const source = await sharp({
      create: {
        width: 400,
        height: 500,
        channels: 3,
        background: { r: 210, g: 180, b: 160 },
      },
    })
      .jpeg()
      .toBuffer();

    const referencePath = path.join(
      process.cwd(),
      "public",
      "hairstyles",
      "low-fade",
      "catalog.png",
    );
    const reference = await readFile(referencePath);

    const a = await composeLocalDemoTryOn({
      sourceImage: source,
      referenceImage: reference,
      hairstyleSlug: "low-fade",
    });
    const b = await composeLocalDemoTryOn({
      sourceImage: source,
      referenceImage: reference,
      hairstyleSlug: "pompadour",
    });

    const meta = await sharp(a).metadata();
    expect(meta.width).toBe(768);
    expect(meta.height).toBe(768);
    expect(a.byteLength).toBeGreaterThan(1000);
    expect(Buffer.compare(a, b)).not.toBe(0);
  });

  it("crops the edited half of a HairCLIP side-by-side output", async () => {
    const sideBySide = await sharp({
      create: {
        width: 200,
        height: 100,
        channels: 3,
        background: { r: 10, g: 10, b: 10 },
      },
    })
      .composite([
        {
          input: await sharp({
            create: {
              width: 100,
              height: 100,
              channels: 3,
              background: { r: 200, g: 50, b: 50 },
            },
          })
            .png()
            .toBuffer(),
          left: 100,
          top: 0,
        },
      ])
      .jpeg()
      .toBuffer();

    const cropped = await cropHairclipEditedHalf(sideBySide);
    const meta = await sharp(cropped).metadata();
    expect(meta.width).toBe(100);
    expect(meta.height).toBe(100);
  });
});

describe("hairclip style map", () => {
  it("maps catalog slugs to HairCLIP enums", () => {
    expect(hairclipDescriptionForSlug("slick-back")).toBe(
      "slicked-back hairstyle",
    );
    expect(hairclipDescriptionForSlug("unknown")).toBe("short hair hairstyle");
  });
});

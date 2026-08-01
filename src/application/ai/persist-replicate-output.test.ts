import { describe, expect, it, vi } from "vitest";
import {
  buildResultStoragePath,
  downloadReplicateOutput,
} from "@/application/ai/persist-replicate-output";

describe("persist-replicate-output", () => {
  it("builds deterministic storage paths", () => {
    expect(
      buildResultStoragePath("salon-1", "sess-1", "job-1", "png"),
    ).toBe("salon-1/sess-1/job-1-result.png");
  });

  it("rejects oversized downloads", async () => {
    const pngHeader = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]);
    const huge = Buffer.concat([pngHeader, Buffer.alloc(5_000_000)]);

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        headers: { get: () => null },
        arrayBuffer: async () => huge.buffer.slice(huge.byteOffset, huge.byteOffset + huge.byteLength),
      })),
    );

    await expect(
      downloadReplicateOutput("https://replicate.delivery/out.png"),
    ).rejects.toMatchObject({ code: "OUTPUT_TOO_LARGE" });

    vi.unstubAllGlobals();
  });
});

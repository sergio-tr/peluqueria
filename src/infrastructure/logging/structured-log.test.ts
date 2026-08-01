import { describe, expect, it, vi } from "vitest";
import {
  logStructured,
  redactSensitiveText,
  sanitizeLogValue,
} from "@/infrastructure/logging/structured-log";

describe("structured-log", () => {
  it("redacts signed URLs", () => {
    const input =
      "preview=https://example.supabase.co/storage/v1/object/sign/photos/x?token=abc123";
    expect(redactSensitiveText(input)).toBe(
      "preview=[redacted-url]",
    );
  });

  it("redacts email and phone", () => {
    const input = "user@example.com called +34 600 123 456";
    const out = redactSensitiveText(input);
    expect(out).not.toContain("user@example.com");
    expect(out).not.toContain("600 123 456");
  });

  it("sanitizes object keys that may hold PII", () => {
    const out = sanitizeLogValue({
      photoId: "p1",
      customerEmail: "a@b.com",
      previewUrl: "https://x?token=secret",
    }) as Record<string, unknown>;
    expect(out.photoId).toBe("p1");
    expect(out.customerEmail).toBe("[redacted]");
    expect(out.previewUrl).toBe("[redacted]");
  });

  it("emits JSON without raw signed URLs", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    logStructured({
      event: "purge-complete",
      removedPaths: 1,
      note: "https://host/sign/x?token=abc",
    });
    const payload = info.mock.calls[0]?.[0] as string;
    expect(payload).not.toContain("token=abc");
    expect(payload).toContain("[redacted-url]");
    info.mockRestore();
  });
});

import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  hasIdempotencyKey,
  recordIdempotencyKey,
} from "./idempotency-keys";

describe("idempotency-keys repository", () => {
  it("returns acquired on first insert", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const client = {
      from: vi.fn().mockReturnValue({ insert }),
    } as unknown as SupabaseClient;

    const result = await recordIdempotencyKey(client, {
      key: "booking-confirmed:b1",
      salonId: "s1",
      scope: "notification",
      resourceId: "b1",
    });

    expect(result).toBe("acquired");
  });

  it("returns duplicate on unique violation", async () => {
    const insert = vi.fn().mockResolvedValue({
      error: { code: "23505", message: "duplicate" },
    });
    const client = {
      from: vi.fn().mockReturnValue({ insert }),
    } as unknown as SupabaseClient;

    const result = await recordIdempotencyKey(client, {
      key: "booking-confirmed:b1",
      salonId: "s1",
      scope: "notification",
    });

    expect(result).toBe("duplicate");
  });

  it("hasIdempotencyKey returns true when row exists", async () => {
    const client = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { idempotency_key: "k1" },
              error: null,
            }),
          }),
        }),
      }),
    } as unknown as SupabaseClient;

    await expect(hasIdempotencyKey(client, "k1")).resolves.toBe(true);
  });
});

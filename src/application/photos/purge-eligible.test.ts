import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppConfig } from "@/infrastructure/config/env";
import { purgeEligibleImages } from "@/application/photos/purge-eligible";

const testConfig = {
  isProduction: false,
  dataStore: "supabase",
  supabaseUrl: "https://example.supabase.co",
  supabaseServiceRoleKey: "key",
  supabaseAnonKey: "anon",
  privacyPolicyVersion: "2026-07-30",
  photoUploadEnabled: true,
  photosBucket: "photos",
  resultsBucket: "results",
} satisfies AppConfig;

describe("purgeEligibleImages", () => {
  it("purges storage, soft-deletes photos, and clears references idempotently", async () => {
    const remove = vi.fn().mockResolvedValue({ error: null });
    const storage = { from: vi.fn(() => ({ remove })) };

    const bookingRows = [
      {
        id: "b-confirmed",
        status: "CONFIRMED",
        created_at: "2026-01-01T00:00:00.000Z",
        source_image_path: "salon/s1/old-source.jpg",
        result_image_path: "salon/s1/old-result.jpg",
        proposed_ends_at: "2026-06-01T10:00:00.000Z",
        requested_ends_at: null,
        proposed_starts_at: null,
        requested_starts_at: null,
        ai_job_id: "job-1",
      },
      {
        id: "b-recent-confirmed",
        status: "CONFIRMED",
        created_at: "2026-07-01T00:00:00.000Z",
        source_image_path: "salon/s1/recent-source.jpg",
        result_image_path: null,
        proposed_ends_at: "2026-08-01T10:00:00.000Z",
        requested_ends_at: null,
        proposed_starts_at: null,
        requested_starts_at: null,
        ai_job_id: null,
      },
      {
        id: "b-unconfirmed",
        status: "EXPIRED",
        created_at: "2026-07-01T00:00:00.000Z",
        source_image_path: "salon/s1/expired-source.jpg",
        result_image_path: null,
        proposed_ends_at: null,
        requested_ends_at: null,
        proposed_starts_at: null,
        requested_starts_at: null,
        ai_job_id: null,
      },
    ];

    const photoRows = [
      {
        id: "p-draft",
        storage_path: "salon/s1/draft.jpg",
        created_at: "2026-07-01T00:00:00.000Z",
      },
    ];

    const from = vi.fn((table: string) => {
      if (table === "photos") {
        return {
          select: vi.fn((cols: string) => {
            if (cols.includes("storage_path") && cols.includes("created_at")) {
              return {
                eq: vi.fn().mockReturnValue({
                  is: vi.fn().mockReturnValue({
                    lte: vi.fn().mockResolvedValue({ data: photoRows, error: null }),
                  }),
                }),
              };
            }
            return {
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockReturnValue({
                  is: vi.fn().mockResolvedValue({
                    data: [{ id: "p-linked" }],
                    error: null,
                  }),
                }),
              }),
            };
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  select: vi.fn().mockResolvedValue({
                    data: [{ id: "p-draft" }],
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        };
      }
      if (table === "booking_requests") {
        const bookingSelect = vi.fn().mockReturnValue({
          eq: vi.fn().mockImplementation(() => ({
            not: vi.fn().mockResolvedValue({
              data: bookingRows
                .filter((row) => row.source_image_path)
                .map((row) => ({ source_image_path: row.source_image_path })),
              error: null,
            }),
          })),
        });
        return {
          select: vi.fn((cols: string) => {
            if (cols.includes("status")) {
              return {
                eq: vi.fn().mockResolvedValue({ data: bookingRows, error: null }),
              };
            }
            return bookingSelect();
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                select: vi.fn().mockResolvedValue({
                  data: [{ id: "b-confirmed" }, { id: "b-unconfirmed" }],
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      if (table === "ai_jobs") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [
                {
                  id: "job-1",
                  source_image_path: "salon/s1/old-source.jpg",
                  result_image_path: "salon/s1/old-result.jpg",
                  created_at: "2026-01-01T00:00:00.000Z",
                },
              ],
              error: null,
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                select: vi.fn().mockResolvedValue({
                  data: [{ id: "job-1" }],
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    });

    const client = { from, storage } as unknown as SupabaseClient;
    const config = testConfig;

    const now = new Date("2026-08-15T12:00:00.000Z");
    const summary = await purgeEligibleImages(client, config, now);

    expect(summary.tiers).toContain("confirmed");
    expect(summary.tiers).toContain("unconfirmed");
    expect(summary.purgedPaths).toBeGreaterThan(0);
    expect(remove).toHaveBeenCalled();
    expect(summary.purgedPhotos).toBe(1);
  });

  it("returns zero counts when nothing is eligible", async () => {
    const remove = vi.fn().mockResolvedValue({ error: null });
    const storage = { from: vi.fn(() => ({ remove })) };

    const from = vi.fn((table: string) => {
      if (table === "photos") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              is: vi.fn().mockReturnValue({
                lte: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        };
      }
      if (table === "booking_requests") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              not: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        };
      }
      if (table === "ai_jobs") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    });

    const client = { from, storage } as unknown as SupabaseClient;
    const summary = await purgeEligibleImages(client, testConfig);
    expect(summary.purgedPhotos).toBe(0);
    expect(summary.purgedPaths).toBe(0);
    expect(remove).not.toHaveBeenCalled();
  });
});

import { describe, expect, it, vi } from "vitest";
import {
  extractReplicateOutput,
  isTerminalAiJobStatus,
} from "@/infrastructure/persistence/repositories/ai-jobs";

const mockConfig = {
  isProduction: false,
  dataStore: "supabase" as const,
  supabaseUrl: "https://example.supabase.co",
  supabaseServiceRoleKey: "key",
  supabaseAnonKey: "anon",
  privacyPolicyVersion: "2026-07-30",
  photoUploadEnabled: true,
  photosBucket: "photos",
  resultsBucket: "results",
};

describe("ai job webhook helpers", () => {
  it("detects terminal statuses", () => {
    expect(isTerminalAiJobStatus("SUCCEEDED")).toBe(true);
    expect(isTerminalAiJobStatus("FAILED")).toBe(true);
    expect(isTerminalAiJobStatus("RUNNING")).toBe(false);
    expect(isTerminalAiJobStatus("QUEUED")).toBe(false);
  });

  it("extracts string or array Replicate output", () => {
    expect(extractReplicateOutput("https://replicate.delivery/out.png")).toBe(
      "https://replicate.delivery/out.png",
    );
    expect(
      extractReplicateOutput(["https://replicate.delivery/out.png"]),
    ).toBe("https://replicate.delivery/out.png");
    expect(extractReplicateOutput(undefined)).toBeUndefined();
  });
});

describe("processReplicateWebhook", () => {
  it("ignores duplicate webhook delivery", async () => {
    const { processReplicateWebhook } = await import(
      "@/application/ai/process-replicate-webhook"
    );

    const client = {
      from(table: string) {
        if (table === "webhook_deliveries") {
          return {
            insert: async () => ({
              error: { code: "23505", message: "duplicate" },
            }),
          };
        }
        throw new Error(`unexpected table ${table}`);
      },
    };

    const result = await processReplicateWebhook(
      client as never,
      mockConfig,
      "salon-1",
      {
        webhookId: "wh_1",
        payload: { id: "pred_1", status: "succeeded" },
      },
    );

    expect(result).toEqual({ ok: true, duplicate: true });
  });

  it("ignores terminal jobs", async () => {
    const { processReplicateWebhook } = await import(
      "@/application/ai/process-replicate-webhook"
    );

    const client = {
      from(table: string) {
        if (table === "webhook_deliveries") {
          return {
            insert: async () => ({ error: null }),
          };
        }
        if (table === "ai_jobs") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({
                    data: {
                      id: "job-1",
                      salon_id: "salon-1",
                      session_id: "sess",
                      status: "SUCCEEDED",
                      provider: "replicate-qwen",
                      model: "qwen/qwen-image-edit-plus",
                      model_owner: "qwen",
                      model_name: "qwen-image-edit-plus",
                      requested_version: null,
                      asset_version: "1.0.0",
                      external_prediction_id: "pred_1",
                      reported_model_version: "v1",
                      prompt_version: "v1",
                      input_parameters_json: {},
                      estimated_cost_usd: 0.03,
                      latency_ms: null,
                      error_code: null,
                      source_image_path: "a.jpg",
                      reference_image_path: "b.png",
                      result_image_path: "c.png",
                      pending_result_url: null,
                      consent_policy_version: "2026-07-30",
                      ip_hash: null,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                      completed_at: new Date().toISOString(),
                    },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        throw new Error(`unexpected table ${table}`);
      },
    };

    const result = await processReplicateWebhook(
      client as never,
      mockConfig,
      "salon-1",
      {
        webhookId: "wh_2",
        payload: { id: "pred_1", status: "succeeded" },
      },
    );

    expect(result).toEqual({ ok: true, ignored: true });
  });

  it("persists output to storage and marks job SUCCEEDED (3C)", async () => {
    const { processReplicateWebhook } = await import(
      "@/application/ai/process-replicate-webhook"
    );

    const updates: Record<string, unknown>[] = [];
    const createdAt = new Date("2026-07-31T10:00:00.000Z").toISOString();
    const pngHeader = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    ]);

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        headers: { get: () => String(pngHeader.length) },
        arrayBuffer: async () =>
          pngHeader.buffer.slice(
            pngHeader.byteOffset,
            pngHeader.byteOffset + pngHeader.byteLength,
          ),
      })),
    );

    const client = {
      storage: {
        from: () => ({
          upload: async () => ({ error: null }),
        }),
      },
      from(table: string) {
        if (table === "webhook_deliveries") {
          return {
            insert: async () => ({ error: null }),
          };
        }
        if (table === "ai_jobs") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({
                    data: {
                      id: "job-1",
                      salon_id: "salon-1",
                      session_id: "sess",
                      status: "QUEUED",
                      provider: "replicate-qwen",
                      model: "qwen/qwen-image-edit-plus",
                      model_owner: "qwen",
                      model_name: "qwen-image-edit-plus",
                      requested_version: null,
                      asset_version: "1.0.0",
                      external_prediction_id: "pred_1",
                      reported_model_version: null,
                      prompt_version: "v1",
                      input_parameters_json: {},
                      estimated_cost_usd: 0.03,
                      latency_ms: null,
                      error_code: null,
                      source_image_path: "a.jpg",
                      reference_image_path: "b.png",
                      result_image_path: null,
                      pending_result_url: null,
                      consent_policy_version: "2026-07-30",
                      ip_hash: null,
                      created_at: createdAt,
                      updated_at: createdAt,
                      completed_at: null,
                    },
                    error: null,
                  }),
                }),
              }),
            }),
            update: (row: Record<string, unknown>) => ({
              eq: () => ({
                eq: () => ({
                  select: () => ({
                    single: async () => {
                      updates.push(row);
                      return { data: {}, error: null };
                    },
                  }),
                }),
              }),
            }),
          };
        }
        throw new Error(`unexpected table ${table}`);
      },
    };

    const result = await processReplicateWebhook(
      client as never,
      mockConfig,
      "salon-1",
      {
        webhookId: "wh_3",
        payload: {
          id: "pred_1",
          status: "succeeded",
          output: ["https://replicate.delivery/out.png"],
          version: "abc123",
          completed_at: "2026-07-31T10:00:05.000Z",
        },
      },
    );

    expect(result).toEqual({ ok: true });
    expect(updates[0]).toMatchObject({
      status: "SUCCEEDED",
      reported_model_version: "abc123",
      pending_result_url: null,
      latency_ms: 5000,
    });
    expect(updates[0]?.result_image_path).toBe(
      "salon-1/sess/job-1-result.png",
    );

    vi.unstubAllGlobals();
  });
});

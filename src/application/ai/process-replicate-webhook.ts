import type { SupabaseClient } from "@supabase/supabase-js";
import {
  extractReplicateOutput,
  getAiJobByExternalPredictionId,
  isTerminalAiJobStatus,
  updateAiJob,
} from "@/infrastructure/persistence/repositories/ai-jobs";
import { insertWebhookDelivery } from "@/infrastructure/persistence/repositories/webhook-deliveries";
import type { AppConfig } from "@/infrastructure/config/env";
import { persistReplicateOutput } from "@/application/ai/persist-replicate-output";

export type ReplicateWebhookPayload = {
  id?: string;
  status?: string;
  output?: string | string[];
  error?: string;
  version?: string;
  completed_at?: string;
};

export type ProcessReplicateWebhookInput = {
  webhookId: string;
  payload: ReplicateWebhookPayload;
};

export type ProcessReplicateWebhookResult = {
  ok: true;
  ignored?: boolean;
  duplicate?: boolean;
};

export async function processReplicateWebhook(
  client: SupabaseClient,
  config: AppConfig,
  salonId: string,
  input: ProcessReplicateWebhookInput,
): Promise<ProcessReplicateWebhookResult> {
  const predictionId = input.payload.id;
  if (!predictionId) {
    return { ok: true, ignored: true };
  }

  const delivery = await insertWebhookDelivery(client, {
    webhookId: input.webhookId,
    externalPredictionId: predictionId,
    eventStatus: input.payload.status,
  });
  if (delivery === "duplicate") {
    return { ok: true, duplicate: true };
  }

  const job = await getAiJobByExternalPredictionId(
    client,
    salonId,
    predictionId,
  );
  if (!job) {
    return { ok: true, ignored: true };
  }

  if (isTerminalAiJobStatus(job.status)) {
    return { ok: true, ignored: true };
  }

  const completedAt = input.payload.completed_at
    ? new Date(input.payload.completed_at)
    : new Date();
  const latencyMs = Math.max(
    0,
    completedAt.getTime() - job.createdAt.getTime(),
  );

  if (input.payload.status === "succeeded") {
    const outputUrl = extractReplicateOutput(input.payload.output);
    if (!outputUrl) {
      await updateAiJob(client, salonId, job.id, {
        status: "FAILED",
        errorCode: "OUTPUT_MISSING",
        completedAt,
        latencyMs,
        reportedModelVersion:
          input.payload.version ?? job.reportedModelVersion ?? null,
        pendingResultUrl: null,
      });
      return { ok: true };
    }

    try {
      const resultImagePath = await persistReplicateOutput(
        client,
        config,
        job,
        outputUrl,
      );
      await updateAiJob(client, salonId, job.id, {
        status: "SUCCEEDED",
        resultImagePath,
        pendingResultUrl: null,
        completedAt,
        latencyMs,
        reportedModelVersion:
          input.payload.version ?? job.reportedModelVersion ?? null,
      });
    } catch {
      await updateAiJob(client, salonId, job.id, {
        status: "FAILED",
        errorCode: "OUTPUT_PERSIST_FAILED",
        completedAt,
        latencyMs,
        pendingResultUrl: outputUrl,
        reportedModelVersion:
          input.payload.version ?? job.reportedModelVersion ?? null,
      });
    }
    return { ok: true };
  }

  if (
    input.payload.status === "failed" ||
    input.payload.status === "canceled"
  ) {
    await updateAiJob(client, salonId, job.id, {
      status: "FAILED",
      errorCode: "PROVIDER_FAILED",
      completedAt,
      latencyMs,
      reportedModelVersion:
        input.payload.version ?? job.reportedModelVersion ?? null,
    });
    return { ok: true };
  }

  return { ok: true, ignored: true };
}

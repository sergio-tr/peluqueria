import type { SupabaseClient } from "@supabase/supabase-js";
import {
  extractReplicateOutput,
  getAiJobByExternalPredictionId,
  isTerminalAiJobStatus,
  updateAiJob,
} from "@/infrastructure/persistence/repositories/ai-jobs";
import { insertWebhookDelivery } from "@/infrastructure/persistence/repositories/webhook-deliveries";

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
    await updateAiJob(client, salonId, job.id, {
      status: "RUNNING",
      reportedModelVersion:
        input.payload.version ?? job.reportedModelVersion ?? null,
      latencyMs,
      pendingResultUrl: outputUrl ?? null,
    });
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

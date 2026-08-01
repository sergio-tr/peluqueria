import type { SupabaseClient } from "@supabase/supabase-js";
import {
  PROMPT_VERSION,
  buildHairPrompt,
} from "@/domain/ai/hair-try-on-provider";
import { AppError } from "@/domain/errors";
import type { AppConfig } from "@/infrastructure/config/env";
import { enforceAiLimits } from "@/application/ai/ai-limits";
import { getHairTryOnProvider, isMockAiProvider } from "@/infrastructure/ai/get-provider";
import {
  parseReplicateModel,
  resolveWebhookBaseUrl,
} from "@/infrastructure/ai/runtime-env";
import {
  getAiJobById,
  insertAiJob,
  updateAiJob,
} from "@/infrastructure/persistence/repositories/ai-jobs";
import { getHairstyleById } from "@/infrastructure/persistence/repositories/catalog";
import { getPhotoById } from "@/infrastructure/persistence/repositories/photos";
import { createPhotoPreviewUrl } from "@/infrastructure/storage/photo-storage";
import { SALON_ID } from "@/infrastructure/supabase/client";

export type CreateAiJobInput = {
  sessionId: string;
  photoId: string;
  hairstyleId: string;
  ipHash: string;
};

export async function createAiJob(
  client: SupabaseClient,
  config: AppConfig,
  input: CreateAiJobInput,
) {
  await enforceAiLimits(client, SALON_ID, {
    sessionId: input.sessionId,
    ipHash: input.ipHash,
  });

  const photo = await getPhotoById(client, SALON_ID, input.photoId);
  if (!photo || photo.session_id !== input.sessionId) {
    throw new AppError("PHOTO_NOT_FOUND", "Fotografía no encontrada.", 404);
  }

  const hairstyle = await getHairstyleById(client, SALON_ID, input.hairstyleId);
  if (!hairstyle) {
    throw new AppError("HAIRSTYLE_NOT_FOUND", "Corte no encontrado.", 404);
  }

  const provider = getHairTryOnProvider();
  const isMock = isMockAiProvider();
  const model = isMock
    ? "mock"
    : (process.env.REPLICATE_MODEL ?? "qwen/qwen-image-edit-plus");
  const { modelOwner, modelName } = isMock
    ? { modelOwner: "mock", modelName: "mock" }
    : parseReplicateModel(model);
  const requestedVersion = isMock
    ? undefined
    : process.env.REPLICATE_MODEL_VERSION;
  const estimated = Number(process.env.AI_ESTIMATED_COST_PER_OUTPUT_USD ?? 0.03);
  const jobId = crypto.randomUUID();
  const webhookBase = resolveWebhookBaseUrl();
  const prompt = buildHairPrompt(hairstyle.promptModifier);

  const sourceUrl = await createPhotoPreviewUrl(
    client,
    config.photosBucket,
    photo.storage_path,
  );
  const referencePath = hairstyle.aiReferenceImagePath.startsWith("/")
    ? hairstyle.aiReferenceImagePath
    : `/${hairstyle.aiReferenceImagePath}`;
  const referenceUrl = `${webhookBase}${referencePath}`;

  let externalId: string | undefined;
  let reportedModelVersion: string | undefined;

  if (!isMock) {
    const created = await provider.createPrediction({
      sourceImageUrl: sourceUrl,
      referenceImageUrl: referenceUrl,
      prompt,
      webhookUrl: `${webhookBase}/api/webhooks/replicate`,
      webhookSecret: process.env.REPLICATE_WEBHOOK_SECRET,
    });
    externalId = created.externalId;
    reportedModelVersion = created.reportedModelVersion;
  } else {
    const created = await provider.createPrediction({
      sourceImageUrl: sourceUrl,
      referenceImageUrl: referenceUrl,
      prompt,
    });
    externalId = created.externalId;
    reportedModelVersion = created.reportedModelVersion;
  }

  const job = await insertAiJob(client, {
    id: jobId,
    salonId: SALON_ID,
    sessionId: input.sessionId,
    status: isMock ? "RUNNING" : "QUEUED",
    provider: provider.name,
    model,
    modelOwner,
    modelName,
    requestedVersion,
    assetVersion: hairstyle.assetVersion,
    externalPredictionId: externalId,
    reportedModelVersion,
    promptVersion: PROMPT_VERSION,
    inputParameters: {
      hairstyleId: hairstyle.id,
      prompt,
    },
    estimatedCostUsd: estimated,
    sourceImagePath: photo.storage_path,
    referenceImagePath: hairstyle.aiReferenceImagePath,
    consentPolicyVersion: photo.consent_policy_version,
    ipHash: input.ipHash,
  });

  if (isMock) {
    setTimeout(() => {
      void updateAiJob(client, SALON_ID, jobId, {
        status: "SUCCEEDED",
        completedAt: new Date(),
      });
    }, 1200);
  }

  return {
    jobId: job.id,
    provider: job.provider,
    isMock,
  };
}

export async function retryAiJob(
  client: SupabaseClient,
  config: AppConfig,
  jobId: string,
) {
  const job = await getAiJobById(client, SALON_ID, jobId);
  if (!job) {
    throw new AppError("JOB_NOT_FOUND", "Trabajo no encontrado.", 404);
  }
  if (job.status !== "FAILED") {
    throw new AppError(
      "RETRY_NOT_ALLOWED",
      "Solo se pueden reintentar fallos.",
      400,
    );
  }

  const ipHash = job.ipHash ?? "";
  await enforceAiLimits(client, SALON_ID, {
    sessionId: job.sessionId,
    ipHash,
    skipUsageBump: true,
  });

  const hairstyleId = job.inputParameters.hairstyleId;
  if (typeof hairstyleId !== "string") {
    throw new AppError("RETRY_NOT_ALLOWED", "Trabajo no reintentable.", 400);
  }

  const hairstyle = await getHairstyleById(client, SALON_ID, hairstyleId);
  if (!hairstyle) {
    throw new AppError("HAIRSTYLE_NOT_FOUND", "Corte no encontrado.", 404);
  }

  const provider = getHairTryOnProvider();
  const isMock = isMockAiProvider();
  const webhookBase = resolveWebhookBaseUrl();
  const prompt =
    typeof job.inputParameters.prompt === "string"
      ? job.inputParameters.prompt
      : buildHairPrompt(hairstyle.promptModifier);

  const sourceUrl = await createPhotoPreviewUrl(
    client,
    config.photosBucket,
    job.sourceImagePath,
  );
  const referencePath = hairstyle.aiReferenceImagePath.startsWith("/")
    ? hairstyle.aiReferenceImagePath
    : `/${hairstyle.aiReferenceImagePath}`;
  const referenceUrl = `${webhookBase}${referencePath}`;

  let externalId: string | undefined;
  let reportedModelVersion: string | undefined;

  if (!isMock) {
    const created = await provider.createPrediction({
      sourceImageUrl: sourceUrl,
      referenceImageUrl: referenceUrl,
      prompt,
      webhookUrl: `${webhookBase}/api/webhooks/replicate`,
      webhookSecret: process.env.REPLICATE_WEBHOOK_SECRET,
    });
    externalId = created.externalId;
    reportedModelVersion = created.reportedModelVersion;
  } else {
    const created = await provider.createPrediction({
      sourceImageUrl: sourceUrl,
      referenceImageUrl: referenceUrl,
      prompt,
    });
    externalId = created.externalId;
    reportedModelVersion = created.reportedModelVersion;
  }

  const updated = await updateAiJob(client, SALON_ID, jobId, {
    status: isMock ? "RUNNING" : "QUEUED",
    errorCode: null,
    resultImagePath: null,
    pendingResultUrl: null,
    externalPredictionId: externalId ?? null,
    reportedModelVersion: reportedModelVersion ?? null,
    completedAt: null,
  });

  if (isMock) {
    setTimeout(() => {
      void updateAiJob(client, SALON_ID, jobId, {
        status: "SUCCEEDED",
        completedAt: new Date(),
      });
    }, 1200);
  }

  return { jobId: updated.id, status: updated.status };
}

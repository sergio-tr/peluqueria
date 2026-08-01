import type { SupabaseClient } from "@supabase/supabase-js";
import {
  PROMPT_VERSION,
  buildHairPrompt,
} from "@/domain/ai/hair-try-on-provider";
import { AppError } from "@/domain/errors";
import type { AppConfig } from "@/infrastructure/config/env";
import { completeLocalDemoJob } from "@/application/ai/complete-local-demo-job";
import { completeLocalHairJob } from "@/application/ai/complete-local-hair-job";
import { enforceAiLimits } from "@/application/ai/ai-limits";
import {
  getHairTryOnProvider,
  isDemoAiProvider,
  isLocalHairProvider,
  resolveAiProviderKind,
} from "@/infrastructure/ai/get-provider";
import {
  parseReplicateModel,
  resolveWebhookBaseUrl,
} from "@/infrastructure/ai/runtime-env";
import { HAIRCLIP_MODEL } from "@/infrastructure/ai/hairclip-style-map";
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

function modelMetaForProvider(isDemo: boolean) {
  const kind = resolveAiProviderKind();
  if (isDemo) {
    return {
      model: kind,
      modelOwner: kind,
      modelName: kind,
      requestedVersion: undefined as string | undefined,
      estimated: 0,
    };
  }
  if (kind === "local-hair") {
    return {
      model: process.env.LOCAL_HAIR_MODEL ?? "stabilityai/stable-diffusion-2-inpainting",
      modelOwner: "local",
      modelName: "sd-inpaint",
      requestedVersion: undefined,
      estimated: 0,
    };
  }
  if (kind === "replicate-hairclip") {
    return {
      model: HAIRCLIP_MODEL,
      modelOwner: "wty-ustc",
      modelName: "hairclip",
      requestedVersion:
        process.env.REPLICATE_MODEL_VERSION ??
        undefined,
      estimated: Number(process.env.AI_ESTIMATED_COST_PER_OUTPUT_USD ?? 0.05),
    };
  }
  const model = process.env.REPLICATE_MODEL ?? "qwen/qwen-image-edit-plus";
  const { modelOwner, modelName } = parseReplicateModel(model);
  return {
    model,
    modelOwner,
    modelName,
    requestedVersion: process.env.REPLICATE_MODEL_VERSION,
    estimated: Number(process.env.AI_ESTIMATED_COST_PER_OUTPUT_USD ?? 0.03),
  };
}

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
  const isDemo = isDemoAiProvider();
  const isLocalHair = isLocalHairProvider();
  const meta = modelMetaForProvider(isDemo);
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

  const created = await provider.createPrediction({
    sourceImageUrl: sourceUrl,
    referenceImageUrl: referenceUrl,
    prompt,
    hairstyleSlug: hairstyle.slug,
    ...(isDemo || isLocalHair
      ? {}
      : {
          webhookUrl: `${webhookBase}/api/webhooks/replicate`,
          webhookSecret: process.env.REPLICATE_WEBHOOK_SECRET,
        }),
  });
  externalId = created.externalId;
  reportedModelVersion = created.reportedModelVersion;

  const job = await insertAiJob(client, {
    id: jobId,
    salonId: SALON_ID,
    sessionId: input.sessionId,
    status: isDemo || isLocalHair ? "RUNNING" : "QUEUED",
    provider: provider.name,
    model: meta.model,
    modelOwner: meta.modelOwner,
    modelName: meta.modelName,
    requestedVersion: meta.requestedVersion,
    assetVersion: hairstyle.assetVersion,
    externalPredictionId: externalId,
    reportedModelVersion,
    promptVersion: PROMPT_VERSION,
    inputParameters: {
      hairstyleId: hairstyle.id,
      hairstyleSlug: hairstyle.slug,
      prompt,
    },
    estimatedCostUsd: meta.estimated,
    sourceImagePath: photo.storage_path,
    referenceImagePath: hairstyle.aiReferenceImagePath,
    consentPolicyVersion: photo.consent_policy_version,
    ipHash: input.ipHash,
  });

  if (isDemo) {
    await completeLocalDemoJob(client, config, {
      salonId: SALON_ID,
      jobId,
      sessionId: input.sessionId,
      sourceImageUrl: sourceUrl,
      referenceImageUrl: referenceUrl,
      referenceImagePath: hairstyle.aiReferenceImagePath,
      hairstyleSlug: hairstyle.slug,
    });
  } else if (isLocalHair) {
    await completeLocalHairJob(client, config, {
      salonId: SALON_ID,
      jobId,
      sessionId: input.sessionId,
      sourceImageUrl: sourceUrl,
      hairstyleSlug: hairstyle.slug,
      prompt,
    });
  }

  return {
    jobId: job.id,
    provider: job.provider,
    isMock: isDemo,
    isDemo,
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
  const isDemo = isDemoAiProvider();
  const isLocalHair = isLocalHairProvider();
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

  const created = await provider.createPrediction({
    sourceImageUrl: sourceUrl,
    referenceImageUrl: referenceUrl,
    prompt,
    hairstyleSlug: hairstyle.slug,
    ...(isDemo || isLocalHair
      ? {}
      : {
          webhookUrl: `${webhookBase}/api/webhooks/replicate`,
          webhookSecret: process.env.REPLICATE_WEBHOOK_SECRET,
        }),
  });

  const updated = await updateAiJob(client, SALON_ID, jobId, {
    status: isDemo || isLocalHair ? "RUNNING" : "QUEUED",
    errorCode: null,
    resultImagePath: null,
    pendingResultUrl: null,
    externalPredictionId: created.externalId ?? null,
    reportedModelVersion: created.reportedModelVersion ?? null,
    completedAt: null,
  });

  if (isDemo) {
    await completeLocalDemoJob(client, config, {
      salonId: SALON_ID,
      jobId,
      sessionId: job.sessionId,
      sourceImageUrl: sourceUrl,
      referenceImageUrl: referenceUrl,
      referenceImagePath: hairstyle.aiReferenceImagePath,
      hairstyleSlug: hairstyle.slug,
    });
  } else if (isLocalHair) {
    await completeLocalHairJob(client, config, {
      salonId: SALON_ID,
      jobId,
      sessionId: job.sessionId,
      sourceImageUrl: sourceUrl,
      hairstyleSlug: hairstyle.slug,
      prompt,
    });
  }

  return { jobId: updated.id, status: updated.status };
}

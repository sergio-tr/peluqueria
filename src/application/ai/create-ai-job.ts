import type { SupabaseClient } from "@supabase/supabase-js";
import {
  PROMPT_VERSION,
  buildHairPrompt,
} from "@/domain/ai/hair-try-on-provider";
import { AppError } from "@/domain/errors";
import type { AppConfig } from "@/infrastructure/config/env";
import { getHairTryOnProvider, isMockAiProvider } from "@/infrastructure/ai/get-provider";
import {
  getAiJobById,
  hasActiveJobForSession,
  insertAiJob,
  updateAiJob,
} from "@/infrastructure/persistence/repositories/ai-jobs";
import {
  bumpUsage,
  dayKey,
  monthKey,
} from "@/infrastructure/persistence/repositories/ai-usage";
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
  if (process.env.AI_GENERATION_ENABLED === "false") {
    throw new AppError(
      "AI_DISABLED",
      "La generación está temporalmente desactivada.",
      503,
    );
  }

  const photo = await getPhotoById(client, SALON_ID, input.photoId);
  if (!photo || photo.session_id !== input.sessionId) {
    throw new AppError("PHOTO_NOT_FOUND", "Fotografía no encontrada.", 404);
  }

  const hairstyle = await getHairstyleById(client, SALON_ID, input.hairstyleId);
  if (!hairstyle) {
    throw new AppError("HAIRSTYLE_NOT_FOUND", "Corte no encontrado.", 404);
  }

  const maxSession = Number(process.env.AI_MAX_GENERATIONS_PER_SESSION ?? 3);
  const maxIpDay = Number(process.env.AI_MAX_GENERATIONS_PER_IP_DAY ?? 10);
  const maxMonth = Number(process.env.AI_MAX_GENERATIONS_PER_MONTH ?? 500);

  if (
    !(await bumpUsage(
      client,
      SALON_ID,
      "session",
      input.sessionId,
      maxSession,
      undefined,
      input.sessionId,
    ))
  ) {
    throw new AppError(
      "SESSION_LIMIT",
      "Has alcanzado el máximo de generaciones de esta sesión.",
      429,
    );
  }
  if (
    !(await bumpUsage(
      client,
      SALON_ID,
      "day",
      `${dayKey()}:${input.ipHash}`,
      maxIpDay,
      input.ipHash,
    ))
  ) {
    throw new AppError(
      "IP_DAY_LIMIT",
      "Se ha alcanzado el límite diario de generaciones.",
      429,
    );
  }
  if (
    !(await bumpUsage(client, SALON_ID, "month", monthKey(), maxMonth))
  ) {
    throw new AppError(
      "MONTH_LIMIT",
      "Se ha alcanzado el presupuesto mensual de generaciones.",
      429,
    );
  }

  if (await hasActiveJobForSession(client, SALON_ID, input.sessionId)) {
    throw new AppError(
      "CONCURRENT_LIMIT",
      "Ya hay una generación en curso en esta sesión.",
      429,
    );
  }

  const provider = getHairTryOnProvider();
  const isMock = isMockAiProvider();
  const model = isMock ? "mock" : (process.env.REPLICATE_MODEL ?? "qwen/qwen-image-edit-plus");
  const estimated = Number(process.env.AI_ESTIMATED_COST_PER_OUTPUT_USD ?? 0.03);
  const jobId = crypto.randomUUID();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const prompt = buildHairPrompt(hairstyle.promptModifier);

  const sourceUrl = await createPhotoPreviewUrl(
    client,
    config.photosBucket,
    photo.storage_path,
  );
  const referencePath = hairstyle.aiReferenceImagePath.startsWith("/")
    ? hairstyle.aiReferenceImagePath
    : `/${hairstyle.aiReferenceImagePath}`;
  const referenceUrl = `${siteUrl}${referencePath}`;

  let externalId: string | undefined;
  let reportedModelVersion: string | undefined;

  if (!isMock) {
    try {
      const created = await provider.createPrediction({
        sourceImageUrl: sourceUrl,
        referenceImageUrl: referenceUrl,
        prompt,
        webhookUrl: `${siteUrl}/api/webhooks/replicate`,
        webhookSecret: process.env.REPLICATE_WEBHOOK_SECRET,
      });
      externalId = created.externalId;
      reportedModelVersion = created.reportedModelVersion;
    } catch (error) {
      throw error;
    }
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
  const updated = await updateAiJob(client, SALON_ID, jobId, {
    status: "QUEUED",
    errorCode: null,
  });
  return { jobId: updated.id, status: updated.status };
}

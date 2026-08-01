import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildResultStoragePath,
  downloadReplicateOutput,
} from "@/application/ai/persist-replicate-output";
import {
  composeLocalDemoTryOn,
  loadReferenceImageBuffer,
} from "@/infrastructure/ai/local-demo-composite";
import type { AppConfig } from "@/infrastructure/config/env";
import { updateAiJob } from "@/infrastructure/persistence/repositories/ai-jobs";
import { uploadPhotoObject } from "@/infrastructure/storage/photo-storage";

export async function completeLocalDemoJob(
  client: SupabaseClient,
  config: AppConfig,
  options: {
    salonId: string;
    jobId: string;
    sessionId: string;
    sourceImageUrl: string;
    referenceImageUrl: string;
    referenceImagePath: string;
    hairstyleSlug: string;
  },
): Promise<void> {
  const started = Date.now();
  try {
    const [sourceImage, referenceImage] = await Promise.all([
      downloadReplicateOutput(options.sourceImageUrl),
      loadReferenceImageBuffer(
        options.referenceImageUrl,
        options.referenceImagePath,
      ),
    ]);

    const composed = await composeLocalDemoTryOn({
      sourceImage,
      referenceImage,
      hairstyleSlug: options.hairstyleSlug,
    });

    const storagePath = buildResultStoragePath(
      options.salonId,
      options.sessionId,
      options.jobId,
      "jpg",
    );

    await uploadPhotoObject(
      client,
      config.resultsBucket,
      storagePath,
      composed,
      "image/jpeg",
    );

    await updateAiJob(client, options.salonId, options.jobId, {
      status: "SUCCEEDED",
      resultImagePath: storagePath,
      completedAt: new Date(),
      latencyMs: Date.now() - started,
    });
  } catch (error) {
    console.error("[local-demo-complete-failed]", error);
    await updateAiJob(client, options.salonId, options.jobId, {
      status: "FAILED",
      errorCode: "LOCAL_DEMO_COMPOSE_FAILED",
      completedAt: new Date(),
      latencyMs: Date.now() - started,
    });
  }
}

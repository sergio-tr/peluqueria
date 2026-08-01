import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildResultStoragePath,
  downloadReplicateOutput,
} from "@/application/ai/persist-replicate-output";
import { resolveLocalHairBaseUrl } from "@/infrastructure/ai/local-hair-provider";
import type { AppConfig } from "@/infrastructure/config/env";
import { updateAiJob } from "@/infrastructure/persistence/repositories/ai-jobs";
import { uploadPhotoObject } from "@/infrastructure/storage/photo-storage";

export async function completeLocalHairJob(
  client: SupabaseClient,
  config: AppConfig,
  options: {
    salonId: string;
    jobId: string;
    sessionId: string;
    sourceImageUrl: string;
    hairstyleSlug: string;
    prompt: string;
  },
): Promise<void> {
  const started = Date.now();
  const baseUrl = resolveLocalHairBaseUrl();

  try {
    const source = await downloadReplicateOutput(options.sourceImageUrl);
    const form = new FormData();
    form.append(
      "image",
      new Blob([Uint8Array.from(source)], { type: "image/jpeg" }),
      "source.jpg",
    );
    form.append("hairstyle_slug", options.hairstyleSlug);
    form.append("prompt", options.prompt);

    const response = await fetch(`${baseUrl}/v1/edit`, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(180_000),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.error("[local-hair-edit-failed]", response.status, errText.slice(0, 400));
      throw new Error(`local_hair_${response.status}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength < 1000) {
      throw new Error("local_hair_empty");
    }

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
      buffer,
      "image/jpeg",
    );

    await updateAiJob(client, options.salonId, options.jobId, {
      status: "SUCCEEDED",
      resultImagePath: storagePath,
      completedAt: new Date(),
      latencyMs: Date.now() - started,
    });
  } catch (error) {
    console.error("[local-hair-complete-failed]", error);
    await updateAiJob(client, options.salonId, options.jobId, {
      status: "FAILED",
      errorCode: "LOCAL_HAIR_FAILED",
      completedAt: new Date(),
      latencyMs: Date.now() - started,
    });
  }
}

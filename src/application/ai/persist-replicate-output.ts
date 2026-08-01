import type { SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "@/domain/errors";
import type { AppConfig } from "@/infrastructure/config/env";
import { cropHairclipEditedHalf } from "@/infrastructure/ai/local-demo-composite";
import type { AiJob } from "@/infrastructure/persistence/repositories/ai-jobs";
import { validateImageContent } from "@/infrastructure/photos/detect-mime";
import { MAX_UPLOAD_BYTES } from "@/infrastructure/photos/constants";
import { uploadPhotoObject } from "@/infrastructure/storage/photo-storage";

export async function downloadReplicateOutput(url: string): Promise<Buffer> {
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) {
    throw new AppError(
      "OUTPUT_DOWNLOAD_FAILED",
      "No se pudo descargar el resultado.",
      502,
    );
  }

  const contentLength = Number(response.headers.get("content-length") ?? 0);
  if (contentLength > MAX_UPLOAD_BYTES) {
    throw new AppError(
      "OUTPUT_TOO_LARGE",
      "El resultado es demasiado grande.",
      502,
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  if (buffer.byteLength === 0) {
    throw new AppError(
      "OUTPUT_EMPTY",
      "El resultado está vacío.",
      502,
    );
  }
  if (buffer.byteLength > MAX_UPLOAD_BYTES) {
    throw new AppError(
      "OUTPUT_TOO_LARGE",
      "El resultado es demasiado grande.",
      502,
    );
  }

  return buffer;
}

export function buildResultStoragePath(
  salonId: string,
  sessionId: string,
  jobId: string,
  extension: "jpg" | "png" | "webp",
): string {
  return `${salonId}/${sessionId}/${jobId}-result.${extension}`;
}

export async function persistReplicateOutput(
  supabase: SupabaseClient,
  config: AppConfig,
  job: AiJob,
  outputUrl: string,
): Promise<string> {
  let buffer = await downloadReplicateOutput(outputUrl);
  if (job.provider === "replicate-hairclip") {
    buffer = await cropHairclipEditedHalf(buffer);
  }
  const detected = validateImageContent(
    buffer,
    undefined,
  );
  const storagePath = buildResultStoragePath(
    job.salonId,
    job.sessionId,
    job.id,
    detected.extension,
  );

  await uploadPhotoObject(
    supabase,
    config.resultsBucket,
    storagePath,
    buffer,
    detected.mime,
  );

  return storagePath;
}

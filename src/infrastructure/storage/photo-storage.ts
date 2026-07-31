import type { SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "@/domain/errors";
import { PREVIEW_URL_TTL_SECONDS } from "@/infrastructure/photos/constants";

export async function uploadPhotoObject(
  supabase: SupabaseClient,
  bucket: string,
  storagePath: string,
  body: Buffer,
  contentType: string,
): Promise<void> {
  const { error } = await supabase.storage.from(bucket).upload(storagePath, body, {
    contentType,
    upsert: false,
  });

  if (error) {
    throw new AppError(
      "STORAGE_UPLOAD_FAILED",
      "No se pudo guardar la imagen.",
      500,
    );
  }
}

export async function createPhotoPreviewUrl(
  supabase: SupabaseClient,
  bucket: string,
  storagePath: string,
  ttlSeconds: number = PREVIEW_URL_TTL_SECONDS,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(storagePath, ttlSeconds);

  if (error || !data?.signedUrl) {
    throw new AppError(
      "SIGNED_URL_FAILED",
      "No se pudo generar la vista previa.",
      500,
    );
  }

  return data.signedUrl;
}

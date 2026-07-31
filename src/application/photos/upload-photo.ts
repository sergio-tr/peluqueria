import type { SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "@/domain/errors";
import type { AppConfig } from "@/infrastructure/config/env";
import { processPhotoUpload } from "@/infrastructure/photos/process-image";
import {
  createPhotoPreviewUrl,
  uploadPhotoObject,
} from "@/infrastructure/storage/photo-storage";
import { SALON_ID } from "@/infrastructure/supabase/client";

export type UploadPhotoInput = {
  sessionId: string;
  consentPolicyVersion: string;
  isOwnImage: true;
  imageBuffer: Buffer;
  declaredMime?: string | null;
};

export type UploadPhotoResult = {
  photoId: string;
  path: string;
  previewUrl: string;
};

export async function uploadPhoto(
  supabase: SupabaseClient,
  config: AppConfig,
  input: UploadPhotoInput,
): Promise<UploadPhotoResult> {
  if (!config.photoUploadEnabled) {
    throw new AppError(
      "PHOTO_UPLOAD_DISABLED",
      "La subida de fotos no está disponible.",
      503,
    );
  }

  if (!config.privacyPolicyVersion) {
    throw new AppError(
      "CONFIG_ERROR",
      "PRIVACY_POLICY_VERSION no configurada.",
      503,
    );
  }

  if (input.consentPolicyVersion !== config.privacyPolicyVersion) {
    throw new AppError(
      "POLICY_VERSION_MISMATCH",
      "Debes aceptar la versión actual de la política.",
      400,
    );
  }

  if (!input.isOwnImage) {
    throw new AppError(
      "CONSENT_REQUIRED",
      "Debes confirmar que la imagen es tuya.",
      400,
    );
  }

  const processed = await processPhotoUpload(
    input.imageBuffer,
    input.declaredMime,
  );

  const photoId = crypto.randomUUID();
  const storagePath = `${SALON_ID}/${input.sessionId}/${photoId}.jpg`;

  await uploadPhotoObject(
    supabase,
    config.photosBucket,
    storagePath,
    processed.buffer,
    processed.mime,
  );

  const { error: insertError } = await supabase.from("photos").insert({
    id: photoId,
    salon_id: SALON_ID,
    session_id: input.sessionId,
    storage_path: storagePath,
    consent_policy_version: input.consentPolicyVersion,
    is_own_image: true,
  });

  if (insertError) {
    await supabase.storage.from(config.photosBucket).remove([storagePath]);
    throw new AppError(
      "PHOTO_PERSIST_FAILED",
      "No se pudo registrar la foto.",
      500,
    );
  }

  const previewUrl = await createPhotoPreviewUrl(
    supabase,
    config.photosBucket,
    storagePath,
  );

  return {
    photoId,
    path: storagePath,
    previewUrl,
  };
}

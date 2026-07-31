import type { SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "@/domain/errors";
import type { AppConfig } from "@/infrastructure/config/env";
import { logStructured } from "@/infrastructure/logging/structured-log";
import {
  clearReferencesForPhotoPath,
  getPhotoForAdminDelete,
  softDeletePhotos,
} from "@/infrastructure/persistence/repositories/image-purge";
import { deleteStorageObjects } from "@/infrastructure/storage/photo-storage";
import { SALON_ID } from "@/infrastructure/supabase/client";

export async function deletePhotoAsAdmin(
  client: SupabaseClient,
  config: AppConfig,
  photoId: string,
  now = new Date(),
): Promise<{ deleted: true; photoId: string }> {
  const photo = await getPhotoForAdminDelete(client, SALON_ID, photoId);
  if (!photo) {
    throw new AppError("PHOTO_NOT_FOUND", "Foto no encontrada.", 404);
  }

  await deleteStorageObjects(client, config.photosBucket, [photo.storage_path]);
  await clearReferencesForPhotoPath(client, SALON_ID, photo.storage_path);
  const count = await softDeletePhotos(client, SALON_ID, [photo.id], now);
  if (count === 0) {
    throw new AppError("PHOTO_NOT_FOUND", "Foto no encontrada.", 404);
  }

  logStructured({
    event: "admin-photo-delete",
    photoId: photo.id,
    actor: "admin",
  });

  return { deleted: true, photoId: photo.id };
}

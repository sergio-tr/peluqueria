import type { SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "@/domain/errors";
import type { AppConfig } from "@/infrastructure/config/env";
import { logStructured } from "@/infrastructure/logging/structured-log";
import {
  clearAiJobImageReferences,
  clearBookingImageReferences,
  listPurgeCandidates,
  softDeletePhotos,
} from "@/infrastructure/persistence/repositories/image-purge";
import { deleteStorageObjects } from "@/infrastructure/storage/photo-storage";
import { SALON_ID } from "@/infrastructure/supabase/client";

export type PurgeSummary = {
  purgedPhotos: number;
  purgedPaths: number;
  clearedBookings: number;
  clearedJobs: number;
  tiers: string[];
};

export function assertPurgeEnabled(): void {
  if (process.env.PURGE_ENABLED === "false") {
    throw new AppError(
      "PURGE_DISABLED",
      "La purga automática está desactivada.",
      503,
    );
  }
}

export async function purgeEligibleImages(
  client: SupabaseClient,
  config: AppConfig,
  now = new Date(),
): Promise<PurgeSummary> {
  assertPurgeEnabled();

  const candidates = await listPurgeCandidates(client, SALON_ID, now);
  const tiers: string[] = [];
  let purgedPhotos = 0;
  let purgedPaths = 0;
  let clearedBookings = 0;
  let clearedJobs = 0;

  const allPhotoPaths = new Set<string>();
  const allResultPaths = new Set<string>();
  const allPhotoIds = new Set<string>();
  const allBookingIds = new Set<string>();
  const allJobIds = new Set<string>();

  for (const batch of candidates) {
    tiers.push(batch.tier);
    for (const id of batch.photoIds) allPhotoIds.add(id);
    for (const path of batch.photoPaths) allPhotoPaths.add(path);
    for (const path of batch.resultPaths) allResultPaths.add(path);
    for (const id of batch.bookingIds) allBookingIds.add(id);
    for (const id of batch.aiJobIds) allJobIds.add(id);
  }

  if (allPhotoPaths.size > 0) {
    await deleteStorageObjects(
      client,
      config.photosBucket,
      [...allPhotoPaths],
    );
    purgedPaths += allPhotoPaths.size;
  }

  if (allResultPaths.size > 0) {
    await deleteStorageObjects(
      client,
      config.resultsBucket,
      [...allResultPaths],
    );
    purgedPaths += allResultPaths.size;
  }

  purgedPhotos += await softDeletePhotos(client, SALON_ID, [...allPhotoIds], now);
  clearedBookings += await clearBookingImageReferences(
    client,
    SALON_ID,
    [...allBookingIds],
  );
  clearedJobs += await clearAiJobImageReferences(
    client,
    SALON_ID,
    [...allJobIds],
  );

  logStructured({
    event: "image-purge-complete",
    purgedPhotos,
    removedObjects: purgedPaths,
    clearedBookings,
    clearedJobs,
    tiers,
  });

  return {
    purgedPhotos,
    purgedPaths,
    clearedBookings,
    clearedJobs,
    tiers,
  };
}

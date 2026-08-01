import type { SupabaseClient } from "@supabase/supabase-js";
import {
  draftCutoff,
  isConfirmedEligibleForPurge,
  isUnconfirmedEligibleForPurge,
  readRetentionWindows,
  type RetentionWindows,
} from "@/domain/image-retention";

export type PurgeCandidate = {
  tier: "draft" | "unconfirmed" | "confirmed";
  photoIds: string[];
  photoPaths: string[];
  resultPaths: string[];
  bookingIds: string[];
  aiJobIds: string[];
};

export async function listPurgeCandidates(
  client: SupabaseClient,
  salonId: string,
  now = new Date(),
  windows: RetentionWindows = readRetentionWindows(),
): Promise<PurgeCandidate[]> {
  const candidates: PurgeCandidate[] = [];

  const draft = await listDraftPhotoCandidates(
    client,
    salonId,
    draftCutoff(now, windows),
  );
  if (draft.photoIds.length > 0) {
    candidates.push({ tier: "draft", ...draft });
  }

  const unconfirmed = await listBookingImageCandidates(
    client,
    salonId,
    now,
    windows,
    "unconfirmed",
  );
  if (
    unconfirmed.photoPaths.length > 0 ||
    unconfirmed.resultPaths.length > 0
  ) {
    candidates.push({ tier: "unconfirmed", ...unconfirmed });
  }

  const confirmed = await listBookingImageCandidates(
    client,
    salonId,
    now,
    windows,
    "confirmed",
  );
  if (confirmed.photoPaths.length > 0 || confirmed.resultPaths.length > 0) {
    candidates.push({ tier: "confirmed", ...confirmed });
  }

  return candidates;
}

async function listDraftPhotoCandidates(
  client: SupabaseClient,
  salonId: string,
  cutoff: Date,
): Promise<Omit<PurgeCandidate, "tier">> {
  const { data: photos, error } = await client
    .from("photos")
    .select("id,storage_path,created_at")
    .eq("salon_id", salonId)
    .is("deleted_at", null)
    .lte("created_at", cutoff.toISOString());
  if (error) throw error;

  const referenced = await loadReferencedPhotoPaths(client, salonId);
  const eligible = (photos ?? []).filter(
    (row) => !referenced.has(row.storage_path as string),
  );

  return {
    photoIds: eligible.map((row) => row.id as string),
    photoPaths: eligible.map((row) => row.storage_path as string),
    resultPaths: [],
    bookingIds: [],
    aiJobIds: [],
  };
}

async function listBookingImageCandidates(
  client: SupabaseClient,
  salonId: string,
  now: Date,
  windows: RetentionWindows,
  mode: "unconfirmed" | "confirmed",
): Promise<Omit<PurgeCandidate, "tier">> {
  const { data, error } = await client
    .from("booking_requests")
    .select(
      "id,status,created_at,source_image_path,result_image_path,proposed_ends_at,requested_ends_at,proposed_starts_at,requested_starts_at,ai_job_id",
    )
    .eq("salon_id", salonId);
  if (error) throw error;

  const eligible = (data ?? []).filter((row) => {
    if (!row.source_image_path && !row.result_image_path) return false;
    if (mode === "confirmed") {
      return isConfirmedEligibleForPurge(row, now, windows);
    }
    return isUnconfirmedEligibleForPurge(row, now, windows);
  });

  const photoPaths: string[] = [];
  const resultPaths: string[] = [];
  const bookingIds: string[] = [];
  const aiJobIds: string[] = [];

  for (const row of eligible) {
    bookingIds.push(row.id as string);
    if (row.source_image_path) photoPaths.push(row.source_image_path as string);
    if (row.result_image_path) resultPaths.push(row.result_image_path as string);
    if (row.ai_job_id) aiJobIds.push(row.ai_job_id as string);
  }

  const photoIds = await photoIdsForPaths(client, salonId, photoPaths);

  const orphanJobs = await listOrphanAiJobPaths(
    client,
    salonId,
    mode,
    now,
    windows,
  );
  for (const job of orphanJobs) {
    if (job.source) photoPaths.push(job.source);
    if (job.result) resultPaths.push(job.result);
    aiJobIds.push(job.id);
  }

  return {
    photoIds,
    photoPaths: [...new Set(photoPaths)],
    resultPaths: [...new Set(resultPaths)],
    bookingIds,
    aiJobIds: [...new Set(aiJobIds)],
  };
}

async function loadReferencedPhotoPaths(
  client: SupabaseClient,
  salonId: string,
): Promise<Set<string>> {
  const paths = new Set<string>();

  const { data: bookings, error: bookingError } = await client
    .from("booking_requests")
    .select("source_image_path")
    .eq("salon_id", salonId)
    .not("source_image_path", "is", null);
  if (bookingError) throw bookingError;
  for (const row of bookings ?? []) {
    if (row.source_image_path) paths.add(row.source_image_path as string);
  }

  const { data: jobs, error: jobError } = await client
    .from("ai_jobs")
    .select("source_image_path")
    .eq("salon_id", salonId);
  if (jobError) throw jobError;
  for (const row of jobs ?? []) {
    if (row.source_image_path) paths.add(row.source_image_path as string);
  }

  return paths;
}

async function photoIdsForPaths(
  client: SupabaseClient,
  salonId: string,
  paths: string[],
): Promise<string[]> {
  if (paths.length === 0) return [];
  const { data, error } = await client
    .from("photos")
    .select("id")
    .eq("salon_id", salonId)
    .in("storage_path", paths)
    .is("deleted_at", null);
  if (error) throw error;
  return (data ?? []).map((row) => row.id as string);
}

async function listOrphanAiJobPaths(
  client: SupabaseClient,
  salonId: string,
  mode: "unconfirmed" | "confirmed",
  now: Date,
  windows: RetentionWindows,
): Promise<Array<{ id: string; source: string | null; result: string | null }>> {
  if (mode === "confirmed") return [];

  const { data, error } = await client
    .from("ai_jobs")
    .select("id,source_image_path,result_image_path,created_at")
    .eq("salon_id", salonId);
  if (error) throw error;

  const { data: bookings, error: bookingError } = await client
    .from("booking_requests")
    .select("ai_job_id")
    .eq("salon_id", salonId)
    .not("ai_job_id", "is", null);
  if (bookingError) throw bookingError;

  const linked = new Set(
    (bookings ?? [])
      .map((row) => row.ai_job_id as string | null)
      .filter(Boolean) as string[],
  );

  return (data ?? [])
    .filter((row) => !linked.has(row.id as string))
    .filter((row) =>
      isUnconfirmedEligibleForPurge(
        { status: "EXPIRED", created_at: row.created_at as string },
        now,
        windows,
      ),
    )
    .map((row) => ({
      id: row.id as string,
      source: (row.source_image_path as string | null) ?? null,
      result: (row.result_image_path as string | null) ?? null,
    }));
}

export async function softDeletePhotos(
  client: SupabaseClient,
  salonId: string,
  photoIds: string[],
  now = new Date(),
): Promise<number> {
  if (photoIds.length === 0) return 0;
  const { data, error } = await client
    .from("photos")
    .update({ deleted_at: now.toISOString() })
    .eq("salon_id", salonId)
    .in("id", photoIds)
    .is("deleted_at", null)
    .select("id");
  if (error) throw error;
  return (data ?? []).length;
}

export async function clearBookingImageReferences(
  client: SupabaseClient,
  salonId: string,
  bookingIds: string[],
): Promise<number> {
  if (bookingIds.length === 0) return 0;
  const { data, error } = await client
    .from("booking_requests")
    .update({ source_image_path: null, result_image_path: null })
    .eq("salon_id", salonId)
    .in("id", bookingIds)
    .select("id");
  if (error) throw error;
  return (data ?? []).length;
}

export async function clearAiJobImageReferences(
  client: SupabaseClient,
  salonId: string,
  aiJobIds: string[],
): Promise<number> {
  if (aiJobIds.length === 0) return 0;
  const { data, error } = await client
    .from("ai_jobs")
    .update({
      source_image_path: null,
      result_image_path: null,
      pending_result_url: null,
    })
    .eq("salon_id", salonId)
    .in("id", aiJobIds)
    .select("id");
  if (error) throw error;
  return (data ?? []).length;
}

export async function getPhotoForAdminDelete(
  client: SupabaseClient,
  salonId: string,
  photoId: string,
): Promise<{ id: string; storage_path: string } | null> {
  const { data, error } = await client
    .from("photos")
    .select("id,storage_path")
    .eq("salon_id", salonId)
    .eq("id", photoId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  return data as { id: string; storage_path: string } | null;
}

export async function clearReferencesForPhotoPath(
  client: SupabaseClient,
  salonId: string,
  storagePath: string,
): Promise<void> {
  const { error: bookingError } = await client
    .from("booking_requests")
    .update({ source_image_path: null })
    .eq("salon_id", salonId)
    .eq("source_image_path", storagePath);
  if (bookingError) throw bookingError;

  const { error: jobSourceError } = await client
    .from("ai_jobs")
    .update({ source_image_path: null })
    .eq("salon_id", salonId)
    .eq("source_image_path", storagePath);
  if (jobSourceError) throw jobSourceError;
}

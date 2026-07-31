import type { SupabaseClient } from "@supabase/supabase-js";

export type PhotoRow = {
  id: string;
  session_id: string;
  storage_path: string;
  consent_policy_version: string;
};

export async function getPhotoById(
  client: SupabaseClient,
  salonId: string,
  photoId: string,
): Promise<PhotoRow | null> {
  const { data, error } = await client
    .from("photos")
    .select("id,session_id,storage_path,consent_policy_version")
    .eq("salon_id", salonId)
    .eq("id", photoId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  return data as PhotoRow | null;
}

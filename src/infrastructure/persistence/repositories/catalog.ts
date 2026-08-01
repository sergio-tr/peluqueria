import type { SupabaseClient } from "@supabase/supabase-js";

export type ServiceRow = {
  id: string;
  slug: string;
  name: string;
  price_cents: number;
  base_minutes: number;
  requires_tryon: boolean;
  sort_order: number;
};

export type HairstyleRow = {
  id: string;
  slug: string;
  name: string;
  catalog_image_path: string;
  ai_reference_image_path: string;
  thumbnail_image_path: string;
  asset_version: string;
  provenance: string;
  usage_rights: string;
  complexity: "low" | "medium" | "high";
  extra_minutes: number;
  prompt_modifier: string;
  sort_order: number;
};

export type AvailabilityRuleRow = {
  weekday: number;
  start_local: string;
  end_local: string;
  staff_id: string;
};

function toPublicUrl(path: string): string {
  return path.startsWith("http") ? path : `/${path.replace(/^\//, "")}`;
}

export function mapService(row: ServiceRow) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    priceCents: row.price_cents,
    baseMinutes: row.base_minutes,
    requiresTryon: row.requires_tryon,
    sortOrder: row.sort_order,
  };
}

export function mapHairstyle(row: HairstyleRow) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    catalogImageUrl: toPublicUrl(row.catalog_image_path),
    thumbnailUrl: toPublicUrl(row.thumbnail_image_path),
    assetVersion: row.asset_version,
    provenance: row.provenance,
    usageRights: row.usage_rights,
    complexity: row.complexity,
    extraMinutes: row.extra_minutes,
    promptModifier: row.prompt_modifier,
  };
}

const HAIRSTYLE_SELECT =
  "id,slug,name,catalog_image_path,ai_reference_image_path,thumbnail_image_path,asset_version,provenance,usage_rights,complexity,extra_minutes,prompt_modifier,sort_order";

export async function listActiveHairstyles(
  client: SupabaseClient,
  salonId: string,
) {
  const { data, error } = await client
    .from("hairstyles")
    .select(HAIRSTYLE_SELECT)
    .eq("salon_id", salonId)
    .eq("active", true)
    .order("sort_order");
  if (error) throw error;
  return (data as HairstyleRow[]).map(mapHairstyle);
}

export async function getServiceById(
  client: SupabaseClient,
  salonId: string,
  serviceId: string,
) {
  const { data, error } = await client
    .from("services")
    .select(
      "id,slug,name,price_cents,base_minutes,requires_tryon,sort_order",
    )
    .eq("salon_id", salonId)
    .eq("id", serviceId)
    .eq("active", true)
    .maybeSingle();
  if (error) throw error;
  return data ? mapService(data as ServiceRow) : null;
}

export async function getHairstyleById(
  client: SupabaseClient,
  salonId: string,
  hairstyleId: string,
) {
  const { data, error } = await client
    .from("hairstyles")
    .select(HAIRSTYLE_SELECT)
    .eq("salon_id", salonId)
    .eq("id", hairstyleId)
    .eq("active", true)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as HairstyleRow;
  return {
    ...mapHairstyle(row),
    aiReferenceImagePath: row.ai_reference_image_path,
  };
}

export async function listActiveServices(
  client: SupabaseClient,
  salonId: string,
) {
  const { data, error } = await client
    .from("services")
    .select(
      "id,slug,name,price_cents,base_minutes,requires_tryon,sort_order",
    )
    .eq("salon_id", salonId)
    .eq("active", true)
    .order("sort_order");
  if (error) throw error;
  return (data as ServiceRow[]).map(mapService);
}

export async function listAvailabilityRules(
  client: SupabaseClient,
  salonId: string,
  staffId: string,
) {
  const { data, error } = await client
    .from("availability_rules")
    .select("weekday,start_local,end_local,staff_id")
    .eq("salon_id", salonId)
    .eq("staff_id", staffId)
    .eq("active", true);
  if (error) throw error;
  return (data as AvailabilityRuleRow[]).map((r) => ({
    weekday: r.weekday,
    startLocal: r.start_local.slice(0, 5),
    endLocal: r.end_local.slice(0, 5),
    staffId: r.staff_id,
  }));
}

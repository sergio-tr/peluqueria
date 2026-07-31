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
    catalogImageUrl: row.catalog_image_path.startsWith("http")
      ? row.catalog_image_path
      : `/${row.catalog_image_path.replace(/^\//, "")}`,
    complexity: row.complexity,
    extraMinutes: row.extra_minutes,
    promptModifier: row.prompt_modifier,
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

export async function listActiveHairstyles(
  client: SupabaseClient,
  salonId: string,
) {
  const { data, error } = await client
    .from("hairstyles")
    .select(
      "id,slug,name,catalog_image_path,ai_reference_image_path,complexity,extra_minutes,prompt_modifier,sort_order",
    )
    .eq("salon_id", salonId)
    .eq("active", true)
    .order("sort_order");
  if (error) throw error;
  return (data as HairstyleRow[]).map(mapHairstyle);
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

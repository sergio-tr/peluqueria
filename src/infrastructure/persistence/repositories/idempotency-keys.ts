import type { SupabaseClient } from "@supabase/supabase-js";

export type IdempotencyScope = "booking_confirm" | "notification";

export async function recordIdempotencyKey(
  client: SupabaseClient,
  input: {
    key: string;
    salonId: string;
    scope: IdempotencyScope;
    resourceId?: string;
  },
): Promise<"acquired" | "duplicate"> {
  const { error } = await client.from("idempotency_keys").insert({
    idempotency_key: input.key,
    salon_id: input.salonId,
    scope: input.scope,
    resource_id: input.resourceId ?? null,
  });

  if (error) {
    if (error.code === "23505") {
      return "duplicate";
    }
    throw error;
  }
  return "acquired";
}

export async function hasIdempotencyKey(
  client: SupabaseClient,
  key: string,
): Promise<boolean> {
  const { data, error } = await client
    .from("idempotency_keys")
    .select("idempotency_key")
    .eq("idempotency_key", key)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

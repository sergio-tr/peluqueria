import type { SupabaseClient } from "@supabase/supabase-js";

type PeriodType = "day" | "month" | "session";

function counterKey(
  salonId: string,
  periodType: PeriodType,
  periodKey: string,
  ipHash?: string,
  sessionId?: string,
) {
  return {
    salon_id: salonId,
    period_type: periodType,
    period_key: periodKey,
    ip_hash: ipHash ?? null,
    session_id: sessionId ?? null,
  };
}

export async function getUsageCount(
  client: SupabaseClient,
  salonId: string,
  periodType: PeriodType,
  periodKey: string,
  ipHash?: string,
  sessionId?: string,
): Promise<number> {
  const key = counterKey(salonId, periodType, periodKey, ipHash, sessionId);
  let query = client
    .from("ai_usage_counters")
    .select("count")
    .eq("salon_id", key.salon_id)
    .eq("period_type", key.period_type)
    .eq("period_key", key.period_key);

  if (key.ip_hash) {
    query = query.eq("ip_hash", key.ip_hash);
  } else {
    query = query.is("ip_hash", null);
  }
  if (key.session_id) {
    query = query.eq("session_id", key.session_id);
  } else {
    query = query.is("session_id", null);
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data?.count ?? 0;
}

export async function bumpUsage(
  client: SupabaseClient,
  salonId: string,
  periodType: PeriodType,
  periodKey: string,
  max: number,
  ipHash?: string,
  sessionId?: string,
): Promise<boolean> {
  const current = await getUsageCount(
    client,
    salonId,
    periodType,
    periodKey,
    ipHash,
    sessionId,
  );
  if (current >= max) return false;

  const key = counterKey(salonId, periodType, periodKey, ipHash, sessionId);

  if (current === 0) {
    const { error: insertError } = await client
      .from("ai_usage_counters")
      .insert({ ...key, count: 1 });
    if (!insertError) return true;
  }

  let updateQuery = client
    .from("ai_usage_counters")
    .update({ count: current + 1 })
    .eq("salon_id", key.salon_id)
    .eq("period_type", key.period_type)
    .eq("period_key", key.period_key);

  if (key.ip_hash) {
    updateQuery = updateQuery.eq("ip_hash", key.ip_hash);
  } else {
    updateQuery = updateQuery.is("ip_hash", null);
  }
  if (key.session_id) {
    updateQuery = updateQuery.eq("session_id", key.session_id);
  } else {
    updateQuery = updateQuery.is("session_id", null);
  }

  const { data, error } = await updateQuery.select("id").maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

export function monthKey(d = new Date()): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function dayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

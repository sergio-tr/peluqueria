import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { loadConfig, type AppConfig } from "@/infrastructure/config/env";
import { ConfigError } from "@/infrastructure/config/env";

/**
 * Server-only Supabase client using the service role key.
 * Never import this module from client components.
 */
export function createServiceClient(
  config: AppConfig = loadConfig(),
): SupabaseClient {
  if (config.dataStore !== "supabase") {
    throw new ConfigError(
      "createServiceClient requires DATA_STORE=supabase and credentials.",
    );
  }
  return createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function isSupabaseConfigured(
  config: AppConfig = loadConfig(),
): boolean {
  return (
    config.dataStore === "supabase" &&
    Boolean(config.supabaseUrl && config.supabaseServiceRoleKey)
  );
}

/** Canonical seed salon / staff IDs (see supabase/seed/seed.sql). */
export const SALON_ID = "a0000000-0000-4000-8000-000000000001";
export const STAFF_ID = "a0000000-0000-4000-8000-000000000010";

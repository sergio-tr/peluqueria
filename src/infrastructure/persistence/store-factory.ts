import { loadConfig, type AppConfig } from "@/infrastructure/config/env";
import { ConfigError } from "@/infrastructure/config/env";
import { createServiceClient } from "@/infrastructure/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

export type DataStoreKind = "memory" | "supabase";

export type PersistenceStore = {
  kind: DataStoreKind;
  /** Present when kind === "supabase" */
  supabase?: SupabaseClient;
};

/**
 * Selects the persistence backend.
 * Production always uses supabase (enforced by loadConfig).
 * Memory is only for explicit local/test use.
 */
export function createPersistenceStore(
  config: AppConfig = loadConfig(),
): PersistenceStore {
  if (config.dataStore === "memory") {
    if (config.isProduction) {
      throw new ConfigError("Memory store is forbidden in production.");
    }
    return { kind: "memory" };
  }

  return {
    kind: "supabase",
    supabase: createServiceClient(config),
  };
}

export function assertSupabaseStore(
  store: PersistenceStore,
): asserts store is PersistenceStore & { supabase: SupabaseClient } {
  if (store.kind !== "supabase" || !store.supabase) {
    throw new ConfigError("Expected supabase persistence store.");
  }
}

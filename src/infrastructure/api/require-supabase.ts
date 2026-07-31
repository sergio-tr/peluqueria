import type { SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "@/domain/errors";
import { loadConfig, type AppConfig } from "@/infrastructure/config/env";
import {
  assertSupabaseStore,
  createPersistenceStore,
} from "@/infrastructure/persistence/store-factory";

export type SupabaseContext = {
  config: AppConfig;
  supabase: SupabaseClient;
};

export function requireSupabase(
  config: AppConfig = loadConfig(),
): SupabaseContext {
  const store = createPersistenceStore(config);
  if (store.kind !== "supabase") {
    throw new AppError(
      "SUPABASE_REQUIRED",
      "Operational APIs require DATA_STORE=supabase.",
      503,
    );
  }
  assertSupabaseStore(store);
  return { config, supabase: store.supabase };
}

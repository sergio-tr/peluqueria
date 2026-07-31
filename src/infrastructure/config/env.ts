import { z } from "zod";

const dataStoreSchema = z.enum(["memory", "supabase"]);

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).optional(),
  APP_ENV: z.enum(["development", "test", "production"]).optional(),
  DATA_STORE: dataStoreSchema.optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional().or(z.literal("")),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().or(z.literal("")),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional().or(z.literal("")),
  PRIVACY_POLICY_VERSION: z.string().optional().or(z.literal("")),
  PHOTO_UPLOAD_ENABLED: z.string().optional(),
  SUPABASE_STORAGE_BUCKET_PHOTOS: z.string().optional(),
});

export type AppConfig = {
  isProduction: boolean;
  dataStore: "memory" | "supabase";
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  supabaseAnonKey: string;
  privacyPolicyVersion: string;
  photoUploadEnabled: boolean;
  photosBucket: string;
};

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

function resolveIsProduction(env: {
  NODE_ENV?: string;
  APP_ENV?: string;
}): boolean {
  return env.APP_ENV === "production" || env.NODE_ENV === "production";
}

/**
 * Load typed application config.
 * Production is fail-closed: requires Supabase and rejects memory store.
 */
export function loadConfig(
  env: NodeJS.ProcessEnv = process.env,
): AppConfig {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    throw new ConfigError(`Invalid environment: ${parsed.error.message}`);
  }

  const raw = parsed.data;
  const isProduction = resolveIsProduction(raw);
  const explicitStore = raw.DATA_STORE;

  let dataStore: "memory" | "supabase";
  if (isProduction) {
    if (explicitStore === "memory") {
      throw new ConfigError(
        "DATA_STORE=memory is not allowed in production.",
      );
    }
    dataStore = "supabase";
  } else if (explicitStore) {
    dataStore = explicitStore;
  } else if (
    raw.NEXT_PUBLIC_SUPABASE_URL &&
    raw.SUPABASE_SERVICE_ROLE_KEY
  ) {
    dataStore = "supabase";
  } else {
    dataStore = "memory";
  }

  const supabaseUrl = raw.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseServiceRoleKey = raw.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const supabaseAnonKey = raw.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  if (dataStore === "supabase") {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new ConfigError(
        "Supabase is required but NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing.",
      );
    }
  }

  if (isProduction && (!supabaseUrl || !supabaseServiceRoleKey)) {
    throw new ConfigError(
      "Production requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return {
    isProduction,
    dataStore,
    supabaseUrl,
    supabaseServiceRoleKey,
    supabaseAnonKey,
    privacyPolicyVersion: raw.PRIVACY_POLICY_VERSION ?? "",
    photoUploadEnabled: raw.PHOTO_UPLOAD_ENABLED !== "false",
    photosBucket: raw.SUPABASE_STORAGE_BUCKET_PHOTOS ?? "photos",
  };
}

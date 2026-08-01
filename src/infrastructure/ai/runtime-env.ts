/**
 * Remote = production Netlify deploy or Supabase-backed runtime.
 * Mock AI is only allowed outside remote runtimes (local dev / CI tests).
 */
export function isRemoteRuntime(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (env.NODE_ENV === "test") {
    return false;
  }
  if (env.APP_ENV === "production" || env.NODE_ENV === "production") {
    return true;
  }
  if (env.DATA_STORE === "supabase") {
    return true;
  }
  return Boolean(
    env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export function resolveWebhookBaseUrl(
  env: NodeJS.ProcessEnv = process.env,
): string {
  return (
    env.WEBHOOK_BASE_URL ??
    env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export function parseReplicateModel(model: string): {
  modelOwner: string;
  modelName: string;
} {
  const slash = model.indexOf("/");
  if (slash === -1) {
    return { modelOwner: "unknown", modelName: model };
  }
  return {
    modelOwner: model.slice(0, slash),
    modelName: model.slice(slash + 1),
  };
}

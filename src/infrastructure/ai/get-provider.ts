import { AppError } from "@/domain/errors";
import type { HairTryOnProvider } from "@/domain/ai/hair-try-on-provider";
import { MockHairProvider } from "@/infrastructure/ai/mock-hair-provider";
import { ReplicateQwenHairProvider } from "@/infrastructure/ai/replicate-qwen-hair-provider";
import { isRemoteRuntime } from "@/infrastructure/ai/runtime-env";

function resolveAiProvider(): string {
  const explicit = process.env.AI_PROVIDER;
  if (explicit) {
    return explicit;
  }
  if (isRemoteRuntime()) {
    return "replicate-qwen";
  }
  return "mock";
}

function allowMockOnRemote(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return env.AI_ALLOW_MOCK === "true";
}

export function getHairTryOnProvider(): HairTryOnProvider {
  const provider = resolveAiProvider();

  if (provider === "mock") {
    // Free demo: explicit AI_ALLOW_MOCK=true permits mock on Netlify/Supabase.
    // UI must show the "Demostración" badge (isMock).
    if (isRemoteRuntime() && !allowMockOnRemote()) {
      throw new AppError(
        "AI_NOT_CONFIGURED",
        "El servicio de IA no está disponible.",
        503,
      );
    }
    return new MockHairProvider();
  }

  if (provider === "replicate-qwen") {
    const token = process.env.REPLICATE_API_TOKEN;
    const model =
      process.env.REPLICATE_MODEL ?? "qwen/qwen-image-edit-plus";
    if (!token) {
      throw new AppError(
        "AI_NOT_CONFIGURED",
        "El servicio de IA no está disponible.",
        503,
      );
    }
    return new ReplicateQwenHairProvider(token, model);
  }

  throw new AppError(
    "AI_PROVIDER_UNKNOWN",
    "El servicio de IA no está disponible.",
    503,
  );
}

export function isMockAiProvider(): boolean {
  return resolveAiProvider() === "mock";
}

import { AppError } from "@/domain/errors";
import type { HairTryOnProvider } from "@/domain/ai/hair-try-on-provider";
import { MockHairProvider } from "@/infrastructure/ai/mock-hair-provider";

function resolveAiProvider(): string {
  return process.env.AI_PROVIDER ?? "mock";
}

function isRemoteRuntime(): boolean {
  return (
    process.env.APP_ENV === "production" ||
    process.env.APP_ENV === "preview" ||
    process.env.CONTEXT === "production" ||
    process.env.CONTEXT === "deploy-preview" ||
    process.env.NODE_ENV === "production"
  );
}

/**
 * Phase 1D stub: mock provider for local/test.
 * Replicate wiring arrives in Phase 3B.
 */
export function getHairTryOnProvider(): HairTryOnProvider {
  const provider = resolveAiProvider();
  if (provider === "mock") {
    if (isRemoteRuntime()) {
      throw new AppError(
        "AI_NOT_CONFIGURED",
        "El servicio de IA no está disponible.",
        503,
      );
    }
    return new MockHairProvider();
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
import { AppError } from "@/domain/errors";
import type { HairTryOnProvider } from "@/domain/ai/hair-try-on-provider";
import { HAIRCLIP_DEFAULT_VERSION } from "@/infrastructure/ai/hairclip-style-map";
import {
  LocalHairProvider,
  resolveLocalHairBaseUrl,
} from "@/infrastructure/ai/local-hair-provider";
import { MockHairProvider } from "@/infrastructure/ai/mock-hair-provider";
import { ReplicateHairclipProvider } from "@/infrastructure/ai/replicate-hairclip-provider";
import { ReplicateQwenHairProvider } from "@/infrastructure/ai/replicate-qwen-hair-provider";
import { isRemoteRuntime } from "@/infrastructure/ai/runtime-env";

export type AiProviderKind =
  | "mock"
  | "local-demo"
  | "local-hair"
  | "replicate-hairclip"
  | "replicate-qwen";

function resolveAiProvider(): AiProviderKind {
  const explicit = process.env.AI_PROVIDER;
  if (
    explicit === "mock" ||
    explicit === "local-demo" ||
    explicit === "local-hair" ||
    explicit === "replicate-hairclip" ||
    explicit === "replicate-qwen"
  ) {
    return explicit;
  }
  if (isRemoteRuntime()) {
    return "replicate-qwen";
  }
  return "local-demo";
}

function allowOfflineDemo(): boolean {
  if (!isRemoteRuntime()) {
    return true;
  }
  return process.env.AI_ALLOW_MOCK === "true";
}

export function getHairTryOnProvider(): HairTryOnProvider {
  const provider = resolveAiProvider();

  if (provider === "mock" || provider === "local-demo") {
    if (!allowOfflineDemo()) {
      throw new AppError(
        "AI_NOT_CONFIGURED",
        "El servicio de IA no está disponible.",
        503,
      );
    }
    return new MockHairProvider(provider);
  }

  if (provider === "local-hair") {
    if (isRemoteRuntime() && process.env.AI_ALLOW_LOCAL_HAIR !== "true") {
      throw new AppError(
        "AI_NOT_CONFIGURED",
        "El proveedor local-hair solo está permitido en desarrollo.",
        503,
      );
    }
    return new LocalHairProvider(resolveLocalHairBaseUrl());
  }

  if (provider === "replicate-hairclip") {
    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) {
      throw new AppError(
        "AI_NOT_CONFIGURED",
        "El servicio de IA no está disponible.",
        503,
      );
    }
    return new ReplicateHairclipProvider(
      token,
      process.env.REPLICATE_MODEL_VERSION ?? HAIRCLIP_DEFAULT_VERSION,
    );
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

/** Offline collage/mock providers — UI shows Demostración. */
export function isDemoAiProvider(): boolean {
  const provider = resolveAiProvider();
  return provider === "mock" || provider === "local-demo";
}

export function isLocalHairProvider(): boolean {
  return resolveAiProvider() === "local-hair";
}

/** @deprecated use isDemoAiProvider */
export function isMockAiProvider(): boolean {
  return isDemoAiProvider();
}

export function resolveAiProviderKind(): AiProviderKind {
  return resolveAiProvider();
}

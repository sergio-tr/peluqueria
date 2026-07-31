import { afterEach, describe, expect, it } from "vitest";
import { AppError } from "@/domain/errors";
import { getHairTryOnProvider, isMockAiProvider } from "./get-provider";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("getHairTryOnProvider fail-closed", () => {
  it("defaults to mock in local development", () => {
    process.env = {
      NODE_ENV: "development",
      DATA_STORE: "memory",
    };
    expect(isMockAiProvider()).toBe(true);
    expect(getHairTryOnProvider().name).toBe("mock");
  });

  it("requires replicate-qwen on remote runtime without explicit provider", () => {
    process.env = {
      NODE_ENV: "production",
      DATA_STORE: "supabase",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service-role",
    };
    expect(isMockAiProvider()).toBe(false);
    expect(() => getHairTryOnProvider()).toThrow(AppError);
    try {
      getHairTryOnProvider();
    } catch (error) {
      expect((error as AppError).code).toBe("AI_NOT_CONFIGURED");
    }
  });

  it("rejects mock provider on remote runtime even when explicitly set", () => {
    process.env = {
      NODE_ENV: "production",
      DATA_STORE: "supabase",
      AI_PROVIDER: "mock",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service-role",
    };
    expect(() => getHairTryOnProvider()).toThrow(AppError);
    try {
      getHairTryOnProvider();
    } catch (error) {
      expect((error as AppError).code).toBe("AI_NOT_CONFIGURED");
    }
  });

  it("returns replicate provider when token is configured", () => {
    process.env = {
      NODE_ENV: "production",
      DATA_STORE: "supabase",
      AI_PROVIDER: "replicate-qwen",
      REPLICATE_API_TOKEN: "r8_test",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service-role",
    };
    expect(getHairTryOnProvider().name).toBe("replicate-qwen");
  });
});

describe("runtime helpers", () => {
  it("parseReplicateModel splits owner and name", async () => {
    const { parseReplicateModel } = await import("./runtime-env");
    expect(parseReplicateModel("qwen/qwen-image-edit-plus")).toEqual({
      modelOwner: "qwen",
      modelName: "qwen-image-edit-plus",
    });
  });

  it("resolveWebhookBaseUrl prefers WEBHOOK_BASE_URL", async () => {
    const { resolveWebhookBaseUrl } = await import("./runtime-env");
    expect(
      resolveWebhookBaseUrl({
        NODE_ENV: "test",
        WEBHOOK_BASE_URL: "https://preview.example.netlify.app/",
        NEXT_PUBLIC_SITE_URL: "https://site.example.com",
      } as NodeJS.ProcessEnv),
    ).toBe("https://preview.example.netlify.app");
  });
});

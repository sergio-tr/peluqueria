import { describe, expect, it } from "vitest";
import { ConfigError, loadConfig } from "./env";

describe("loadConfig", () => {
  it("allows memory in development without supabase", () => {
    const config = loadConfig({
      NODE_ENV: "development",
      DATA_STORE: "memory",
    });
    expect(config.dataStore).toBe("memory");
    expect(config.isProduction).toBe(false);
  });

  it("rejects memory in production", () => {
    expect(() =>
      loadConfig({
        NODE_ENV: "production",
        DATA_STORE: "memory",
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        SUPABASE_SERVICE_ROLE_KEY: "service-role",
      }),
    ).toThrow(ConfigError);
  });

  it("fails closed in production without supabase credentials", () => {
    expect(() =>
      loadConfig({
        NODE_ENV: "production",
      }),
    ).toThrow(/Supabase|Production requires/i);
  });

  it("selects supabase when credentials and DATA_STORE are set", () => {
    const config = loadConfig({
      NODE_ENV: "development",
      DATA_STORE: "supabase",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service-role",
    });
    expect(config.dataStore).toBe("supabase");
  });
});

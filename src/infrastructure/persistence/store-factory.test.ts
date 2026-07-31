import { describe, expect, it } from "vitest";
import { loadConfig } from "@/infrastructure/config/env";
import { createPersistenceStore } from "./store-factory";

describe("createPersistenceStore", () => {
  it("returns memory store when configured for development", () => {
    const config = loadConfig({
      NODE_ENV: "development",
      DATA_STORE: "memory",
    });
    const store = createPersistenceStore(config);
    expect(store.kind).toBe("memory");
    expect(store.supabase).toBeUndefined();
  });

  it("returns supabase kind when configured", () => {
    const config = loadConfig({
      NODE_ENV: "test",
      DATA_STORE: "supabase",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
    });
    const store = createPersistenceStore(config);
    expect(store.kind).toBe("supabase");
    expect(store.supabase).toBeDefined();
  });
});

import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  timeout: 60_000,
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 5"] },
    },
  ],
  webServer: {
    command: "npm run dev -- --port 3000",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      PORT: "3000",
      DATA_STORE: "memory",
      AI_PROVIDER: "mock",
      DEMO_ACCESS_CODE: "e2e-demo-code",
      DEMO_SESSION_SECRET: "e2e-demo-session-secret-32chars-min",
      IP_HASH_SECRET: "e2e-ip-hash-secret-32chars-min!!",
      NEXT_PUBLIC_SITE_URL: baseURL,
      PHOTO_UPLOAD_ENABLED: "true",
      PRIVACY_POLICY_VERSION: "2026-07-30",
    },
  },
});

import type { Page, Route } from "@playwright/test";
import {
  E2E_HAIRSTYLES,
  E2E_JOB_ID,
  E2E_PHOTO_ID,
  E2E_RESULT_URL,
} from "../fixtures/catalog";

/** Intercept try-on APIs so E2E runs without Supabase or Replicate. */
export async function mockTryOnApis(page: Page) {
  let pollCount = 0;

  await page.route("**/api/hairstyles", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ hairstyles: E2E_HAIRSTYLES }),
    });
  });

  await page.route("**/api/photos", async (route: Route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ photoId: E2E_PHOTO_ID }),
    });
  });

  await page.route("**/api/ai/jobs", async (route: Route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    pollCount = 0;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ jobId: E2E_JOB_ID, isMock: true, provider: "mock" }),
    });
  });

  await page.route(`**/api/ai/jobs/${E2E_JOB_ID}`, async (route: Route) => {
    pollCount += 1;
    const status = pollCount >= 2 ? "SUCCEEDED" : "RUNNING";
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        status,
        isMock: true,
        resultPreviewUrl: status === "SUCCEEDED" ? E2E_RESULT_URL : undefined,
      }),
    });
  });
}

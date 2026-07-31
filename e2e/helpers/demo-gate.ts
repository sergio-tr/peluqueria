import type { Page } from "@playwright/test";

export const E2E_DEMO_CODE = "e2e-demo-code";

/** Pass the demo access gate and land on home. */
export async function passDemoGate(page: Page, nextPath = "/") {
  await page.goto(`/acceso?next=${encodeURIComponent(nextPath)}`);
  await page.getByLabel("Código de acceso").fill(E2E_DEMO_CODE);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(nextPath === "/" ? "**/" : `**${nextPath}`);
}

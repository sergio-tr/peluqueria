import { test, expect } from "@playwright/test";
import { passDemoGate } from "./helpers/demo-gate";

test.describe("Responsive smoke", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("home and nav fit mobile viewport", async ({ page }) => {
    await passDemoGate(page);
    await expect(
      page.getByRole("navigation").getByRole("link", { name: "Probar un corte" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Panel" })).toBeVisible();
    const header = page.locator("header");
    await expect(header).toBeVisible();
    const box = await header.boundingBox();
    expect(box?.width ?? 0).toBeLessThanOrEqual(390);
  });

  test("demo gate form is usable on mobile", async ({ page }) => {
    await page.goto("/acceso");
    await expect(page.getByRole("heading", { name: "Peluquería Nowi" })).toBeVisible();
    const input = page.getByLabel("Código de acceso");
    await expect(input).toBeVisible();
    const box = await input.boundingBox();
    expect(box?.width ?? 0).toBeGreaterThan(200);
  });
});

test.describe("Reduced motion", () => {
  test("home renders with prefers-reduced-motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await passDemoGate(page);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});

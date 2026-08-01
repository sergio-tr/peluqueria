import path from "node:path";
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { passDemoGate } from "./helpers/demo-gate";
import { mockTryOnApis } from "./helpers/mock-api";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

test.describe("Accessibility smoke (AA)", () => {
  test("demo gate page", async ({ page }) => {
    await page.goto("/acceso");
    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    expect(results.violations).toEqual([]);
  });

  test("privacy page", async ({ page }) => {
    await page.goto("/privacidad");
    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    expect(results.violations).toEqual([]);
  });

  test("try-on compare step with mock result", async ({ page }) => {
    await mockTryOnApis(page);
    await passDemoGate(page, "/probar");

    const fixture = path.join(__dirname, "fixtures", "test-photo.png");
    await page.getByText("Subir imagen").locator("..").locator('input[type="file"]').setInputFiles(fixture);
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.getByLabel(/Declaro que la imagen es mía/).check();
    await page.getByLabel(/Acepto el tratamiento/).check();
    await page.getByRole("button", { name: "Subir y continuar" }).click();
    await page.getByRole("button", { name: "Low fade" }).click();
    await page.getByRole("button", { name: "Generar vista previa" }).click();
    await expect(page.getByText(/Demostración — resultado mock/)).toBeVisible({
      timeout: 15_000,
    });

    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    expect(results.violations).toEqual([]);
  });
});

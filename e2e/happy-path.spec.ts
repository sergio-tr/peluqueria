import { test, expect } from "@playwright/test";
import path from "node:path";
import { passDemoGate } from "./helpers/demo-gate";
import { mockTryOnApis } from "./helpers/mock-api";

test.describe("Happy path — mock try-on", () => {
  test.beforeEach(async ({ page }) => {
    await mockTryOnApis(page);
  });

  test("gate → photo → style → mock job shows Demostración badge", async ({
    page,
  }) => {
    await passDemoGate(page, "/probar");
    await expect(page.getByRole("heading", { name: "Tu fotografía" })).toBeVisible();

    const fixture = path.join(__dirname, "fixtures", "test-photo.png");
    await page.getByText("Subir imagen").locator("..").locator('input[type="file"]').setInputFiles(fixture);
    await page.getByRole("button", { name: "Continuar" }).click();

    await expect(page.getByRole("heading", { name: "Privacidad" })).toBeVisible();
    await page.getByLabel(/Declaro que la imagen es mía/).check();
    await page.getByLabel(/Acepto el tratamiento/).check();
    await page.getByRole("button", { name: "Subir y continuar" }).click();

    await expect(page.getByRole("heading", { name: "Elige un corte" })).toBeVisible();
    await page.getByRole("button", { name: "Low fade" }).click();
    await page.getByRole("button", { name: "Generar vista previa" }).click();

    await expect(page.getByText(/Demostración — resultado mock/)).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole("button", { name: "Adjuntar y reservar" })).toBeVisible();
  });
});

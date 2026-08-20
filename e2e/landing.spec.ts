import { expect, test } from "@playwright/test";

test.describe("Landing", () => {
  test("carga y comunica la promesa del producto", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Tu estilista");
    await expect(page).toHaveTitle(/Vestia/);
  });

  test("declara español de México para lectores de pantalla y SEO", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "es-MX");
  });

  test("hace visible la promesa de que el clóset es gratis", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/gratis e ilimitado/i)).toBeVisible();
  });
});

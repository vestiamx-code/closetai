import { expect, test } from "@playwright/test";

test.describe("Landing", () => {
  test("carga y comunica la promesa del producto", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Tu estilista");
    await expect(page).toHaveTitle(/ClosetAI/);
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

test.describe("Sin configuración de Supabase", () => {
  test.skip(
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    "Solo aplica cuando la app corre sin credenciales",
  );

  test("las rutas de cuenta llevan a la landing en vez de reventar", async ({ page }) => {
    const respuesta = await page.goto("/closet");
    expect(respuesta?.status()).toBeLessThan(400);
    await expect(page).toHaveURL(/\/$/);
  });
});

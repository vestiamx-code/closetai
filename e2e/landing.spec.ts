import { expect, test } from "@playwright/test";

import { cargarEnv } from "./entorno";

// Sin esto, el `skip` de más abajo depende de qué otro spec le tocó al worker.
cargarEnv();

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

test.describe("La landing deja entrar", () => {
  // La app estuvo en vivo con todo funcionando y la landing seguía diciendo
  // "En construcción", sin un solo enlace para entrar. Desde el navegador no
  // había forma de llegar al producto sin escribir la URL a mano.
  test("hay cómo llegar a la app desde la portada", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: "Arma tu clóset gratis" }).click();
    await expect(page).toHaveURL(/\/registro$/);

    await page.goto("/");
    await page.getByRole("link", { name: "Ya tengo cuenta" }).click();
    await expect(page).toHaveURL(/\/entrar$/);
  });
});

test.describe("Navegación en teléfono", () => {
  // El encabezado se rompía en móvil: con seis enlaces, "Tu estilo" se partía
  // en dos líneas y "Salir" se salía de la pantalla. En una app que se usa
  // desde el celular, eso no es un detalle estético.
  test("el encabezado no desborda a lo ancho", async ({ page }) => {
    await page.goto("/entrar");
    const desborda = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(desborda, "la página se desplaza horizontalmente").toBe(false);
  });
});

import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

import { cargarEnv, hayCuotaDeRazonamiento } from "./entorno";

/**
 * Semana 1 · `/core` — el módulo generativo público.
 *
 * Lo que más importa probar aquí no es que el modelo escriba bonito, es que la
 * página funcione **sin sesión**. Ese es el punto entero de la función: dar algo
 * útil antes de pedir registro.
 */

cargarEnv();

const URL_SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const LLAVE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const hay = Boolean(URL_SUPABASE && LLAVE && process.env.GEMINI_API_KEY);

const TEXTO =
  "Me gusta andar cómoda pero que se note que me arreglé. Uso mucho negro y beige, jeans anchos " +
  "y tenis blancos. No me gusta la ropa entallada ni los estampados grandes. Para la oficina le " +
  "pongo un saco encima y ya la hice.";

const admin = () =>
  createClient(URL_SUPABASE!, LLAVE!, { auth: { autoRefreshToken: false, persistSession: false } });

test.describe("Núcleo de estilo (/core)", () => {
  test.skip(!hay, "Faltan credenciales: la prueba se salta");

  // El tope diario del nivel gratuito de Gemini deja al modelo de razonamiento
  // sin cuota. Eso no es un fallo de la app: se salta con motivo, no se finge
  // que pasó.
  test.beforeAll(async () => {
    test.skip(!(await hayCuotaDeRazonamiento()), "Gemini sin cuota (429): no se pudo comprobar");
  });

  test("carga sin sesión y muestra el formulario", async ({ page }) => {
    // Sin storageState: este contexto no tiene cookies. Es la prueba de que la
    // página es pública de verdad, no solo de que existe.
    const r = await page.goto("/core");
    expect(r?.status()).toBe(200);
    await expect(page).toHaveURL(/\/core$/);
    await expect(page.getByLabel(/Cómo te gusta vestirte/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Extraer mi núcleo/i })).toBeVisible();
  });

  test("rechaza un texto demasiado corto antes de gastar una llamada al modelo", async ({ page }) => {
    await page.goto("/core");
    await page.getByLabel(/Cómo te gusta vestirte/i).fill("me gusta el negro");
    await page.getByRole("button", { name: /Extraer mi núcleo/i }).click();
    await expect(page.getByText(/Escribe un poco más/i)).toBeVisible({ timeout: 15_000 });
  });

  test("genera un núcleo con los cinco bloques y lo guarda", async ({ page }) => {
    // La generación tarda entre 6 y 12 segundos contra el modelo real. El tope
    // por defecto de Playwright son 30 s para toda la prueba, así que la espera
    // de 90 s de abajo nunca se alcanzaba: moría antes la prueba, y el fallo
    // salía como "Test timeout" en vez de decir qué no apareció.
    test.setTimeout(180_000);
    const a = admin();
    const { count: antes } = await a
      .from("core_outputs")
      .select("id", { count: "exact", head: true });

    await page.goto("/core");
    await page.getByLabel(/Cómo te gusta vestirte/i).fill(TEXTO);
    await page.getByRole("button", { name: /Extraer mi núcleo/i }).click();

    // La tarjeta: esencia, principios, paleta, siluetas, evitar y la regla.
    // Las aserciones van ancladas a la tarjeta, no a la página.
    //
    // La primera versión buscaba el texto suelto y pasaba al instante: el párrafo
    // de introducción dice "destilo tu núcleo de estilo: tus principios, tu
    // paleta", así que coincidía sin que la generación hubiera ocurrido. Una
    // aserción que puede cumplirse con la página recién cargada no prueba nada.
    const tarjeta = page.locator("article").first();
    await expect(tarjeta).toBeVisible({ timeout: 90_000 });

    await expect(tarjeta.getByText(/^principios$/i)).toBeVisible();
    await expect(tarjeta.getByText(/^paleta$/i)).toBeVisible();
    await expect(tarjeta.getByText(/^tu regla$/i)).toBeVisible();
    await expect(tarjeta.getByText(/Qué tan seguro estoy/i)).toBeVisible();

    await tarjeta.getByRole("button", { name: /Guardar este núcleo/i }).click();
    await expect(tarjeta.getByText(/^Guardado\./)).toBeVisible({ timeout: 30_000 });

    const { count: despues } = await a
      .from("core_outputs")
      .select("id", { count: "exact", head: true });
    expect(despues ?? 0, "no se escribió la fila en core_outputs").toBeGreaterThan(antes ?? 0);
  });

  test("el costo de cada generación queda registrado", async () => {
    const { data } = await admin()
      .from("api_costs")
      .select("operation")
      .eq("operation", "extract_core")
      .limit(1);
    expect(data?.length ?? 0).toBeGreaterThan(0);
  });

  test("la lista pública nunca expone lo que la persona escribió", async ({ page }) => {
    // `entrada` puede ser muy personal. La página muestra el núcleo, no la confesión.
    await page.goto("/core");
    const cuerpo = await page.locator("body").innerText();
    expect(cuerpo).not.toContain("la oficina le pongo un saco encima y ya la hice");
  });
});

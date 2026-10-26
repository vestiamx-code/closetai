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
  "I like to be comfortable but still look put together. I wear a lot of black and beige, wide-leg " +
  "jeans and white sneakers. I don't like tight clothes or big prints. For the office I throw a " +
  "blazer on top and I'm done.";

const admin = () =>
  createClient(URL_SUPABASE!, LLAVE!, { auth: { autoRefreshToken: false, persistSession: false } });

test.describe("Núcleo de estilo (/core)", () => {
  test.skip(!hay, "Faltan credenciales: la prueba se salta");

  // La cuota de Gemini se comprueba dentro de la ÚNICA prueba que llama al
  // modelo, no en un `beforeAll`.
  //
  // Estaba en un `beforeAll` y eso saltaba las cinco. Cuatro de ellas no tocan
  // el modelo —que la página cargue sin sesión, que rechace texto corto, que el
  // costo quede registrado, que la lista no exponga lo que alguien escribió— y
  // son justo las que no deberían depender de que Google tenga cupo. La más
  // importante de la semana es que `/core` abra sin sesión: dejarla escondida
  // detrás de la cuota es perder la afirmación central por un motivo ajeno.

  test("carga sin sesión y muestra el formulario", async ({ page }) => {
    // Sin storageState: este contexto no tiene cookies. Es la prueba de que la
    // página es pública de verdad, no solo de que existe.
    const r = await page.goto("/core");
    expect(r?.status()).toBe(200);
    await expect(page).toHaveURL(/\/core$/);
    await expect(page.getByLabel(/How do you like to dress/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Extract my core/i })).toBeVisible();
  });

  test("rechaza un texto demasiado corto antes de gastar una llamada al modelo", async ({ page }) => {
    await page.goto("/core");
    await page.getByLabel(/How do you like to dress/i).fill("I like black");
    await page.getByRole("button", { name: /Extract my core/i }).click();
    await expect(page.getByText(/Write a little more/i)).toBeVisible({ timeout: 15_000 });
  });

  test("genera un núcleo con los cinco bloques y lo guarda", async ({ page }) => {
    // La generación tarda entre 6 y 12 segundos contra el modelo real. El tope
    // por defecto de Playwright son 30 s para toda la prueba, así que la espera
    // de 90 s de abajo nunca se alcanzaba: moría antes la prueba, y el fallo
    // salía como "Test timeout" en vez de decir qué no apareció.
    test.setTimeout(180_000);
    // Saltarse no es pasar: el reporte lo dice en voz alta y nadie se lleva un
    // verde que no se ganó.
    test.skip(!(await hayCuotaDeRazonamiento()), "Gemini sin cuota (429): no se pudo comprobar");

    const a = admin();
    const { count: antes } = await a
      .from("core_outputs")
      .select("id", { count: "exact", head: true });

    await page.goto("/core");
    await page.getByLabel(/How do you like to dress/i).fill(TEXTO);
    await page.getByRole("button", { name: /Extract my core/i }).click();

    // La tarjeta: esencia, principios, paleta, siluetas, evitar y la regla.
    // Las aserciones van ancladas a la tarjeta, no a la página.
    //
    // La primera versión buscaba el texto suelto y pasaba al instante: el párrafo
    // de introducción dice "destilo tu núcleo de estilo: tus principios, tu
    // paleta", así que coincidía sin que la generación hubiera ocurrido. Una
    // aserción que puede cumplirse con la página recién cargada no prueba nada.
    const tarjeta = page.locator("article").first();
    const saturado = page.getByText(/The model is overloaded/i);

    // La cuota se comprobó al empezar, pero el nivel gratuito son 20 llamadas
    // por minuto y la suite corre en paralelo: se puede agotar entre la
    // comprobación y esta llamada. Si eso pasa, la app lo dice con todas sus
    // letras, y saltarse con ese motivo es lo honesto — fallar acusaría al
    // código de algo que hizo Google.
    // El límite de 10 por IP por hora es una función, no un fallo.
    const limite = page.getByText(/You have generated several cores/i);
    await expect(tarjeta.or(saturado).or(limite)).toBeVisible({ timeout: 90_000 });
    test.skip(await saturado.isVisible(), "Gemini sin cuota a media prueba (429)");
    test.skip(await limite.isVisible(), "Límite de 10 núcleos por IP por hora alcanzado: no se pudo comprobar");

    await expect(tarjeta).toBeVisible();

    await expect(tarjeta.getByText(/^principles$/i)).toBeVisible();
    await expect(tarjeta.getByText(/^palette$/i)).toBeVisible();
    await expect(tarjeta.getByText(/^your rule$/i)).toBeVisible();
    await expect(tarjeta.getByText(/How sure I am/i)).toBeVisible();

    await tarjeta.getByRole("button", { name: /Save this core/i }).click();
    await expect(tarjeta.getByText(/^Saved\./)).toBeVisible({ timeout: 30_000 });

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
    expect(cuerpo).not.toContain("For the office I throw a blazer on top");
  });
});

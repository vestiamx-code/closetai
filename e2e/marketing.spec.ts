import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

import { cargarEnv } from "./entorno";

/**
 * Semana 4 · la portada nueva y `/marketing`.
 *
 * La lógica A/B ya está probada aparte, en `src/lib/ab.test.ts`. Aquí se prueba
 * lo que esas pruebas no ven: que la portada de verdad muestre una sola variante
 * y la sostenga, que el tráfico de las pruebas no ensucie el experimento, y que
 * lo que se exporta sea lo que dice.
 *
 * Todas las peticiones de esta suite llevan la cabecera `x-cai-prueba`
 * (playwright.config.ts), así que ninguna cuenta en los resultados.
 */

cargarEnv();

const URL_SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const LLAVE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const hay = Boolean(URL_SUPABASE && LLAVE);

const admin = () =>
  createClient(URL_SUPABASE!, LLAVE!, { auth: { autoRefreshToken: false, persistSession: false } });

const TITULARES = /Tu estilista,\s*en tu bolsillo\.|Ya tienes\s*qué ponerte\./;

/** El mismo hash con sal que usa el servidor (src/lib/ip.ts). */
const huella = (texto: string) => createHash("sha256").update(`${LLAVE}:${texto}`).digest("hex");

async function eventosDe(visitante: string) {
  const { count } = await admin()
    .from("ab_events")
    .select("id", { count: "exact", head: true })
    .eq("visitante_hash", huella(visitante));
  return count ?? 0;
}

test.describe("Marketing y portada", () => {
  test.skip(!hay, "Faltan credenciales: la prueba se salta");

  test("/marketing carga sin sesión, con 10 posts, 3 guiones y 14 días de calendario", async ({ page }) => {
    const r = await page.goto("/marketing");
    expect(r?.status()).toBe(200);

    await expect(page.locator("[data-post]")).toHaveCount(10);
    await expect(page.locator("[data-guion]")).toHaveCount(3);
    await expect(page.getByTestId("calendario").locator("[data-dia]")).toHaveCount(14);

    // La persona distingue lo que se sabe de lo que se supone: si todo fuera
    // «dato», la sección estaría mintiendo.
    const persona = page.getByTestId("persona");
    expect(await persona.locator('[data-rasgo="dato"]').count()).toBeGreaterThan(0);
    expect(await persona.locator('[data-rasgo="hipotesis"]').count()).toBeGreaterThan(0);

    // Y el experimento dice su veredicto, sea cual sea.
    await expect(page.getByTestId("ab-veredicto")).toContainText(/ganador|Gana la variante/);
  });

  test("exportar el calendario descarga un CSV con encabezado y 14 filas; copiar un post pone su texto", async ({
    page,
    context,
    browserName,
  }) => {
    await page.goto("/marketing");

    const [descarga] = await Promise.all([
      page.waitForEvent("download"),
      page.locator('[data-exportar="closetai-calendario.csv"]').click(),
    ]);
    expect(descarga.suggestedFilename()).toBe("closetai-calendario.csv");
    const csv = readFileSync((await descarga.path())!, "utf8").replace(/^﻿/, "");
    const lineas = csv.trim().split("\n");
    expect(lineas[0]).toBe("dia,canal,pieza,para_que");
    expect(lineas).toHaveLength(15);
    expect(lineas[1]).toMatch(/^1,Instagram,/);

    // El portapapeles solo se puede leer en Chromium con permiso explícito.
    test.skip(browserName !== "chromium", "El portapapeles solo se lee en Chromium");
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    const primero = page.locator('[data-post="post-01"]');
    await primero.locator("[data-copiar]").click();
    await expect(primero.locator("[data-copiar]")).toHaveText("Copiado");
    const pegado = await page.evaluate(() => navigator.clipboard.readText());
    expect(pegado).toContain("Ya tienes qué ponerte.");
    expect(pegado).toContain("#ClosetAI");
  });

  test("la portada muestra un solo titular, el mismo al recargar, y una visita de prueba no se cuenta", async ({
    page,
  }) => {
    await page.goto("/");
    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toHaveText(TITULARES);
    const variante = await h1.getAttribute("data-variante");
    expect(["a", "b"]).toContain(variante);
    // El texto plano del titular, que es lo que leen un lector de pantalla y un
    // buscador: tiene que llevar espacio entre las dos líneas.
    const texto = (await h1.textContent())!.replace(/\s+/g, " ").trim();
    expect(texto).toMatch(/^(Tu estilista, en tu bolsillo\.|Ya tienes qué ponerte\.)$/);

    // La cookie se guarda en el navegador y la siguiente visita ve lo mismo.
    await expect
      .poll(async () => (await page.context().cookies()).find((c) => c.name === "cai_visitante")?.value)
      .toMatch(/^[0-9a-f-]{36}$/);
    const visitante = (await page.context().cookies()).find((c) => c.name === "cai_visitante")!.value;
    for (let i = 0; i < 3; i++) {
      await page.reload();
      expect((await h1.textContent())!.replace(/\s+/g, " ").trim()).toBe(texto);
      await expect(h1).toHaveAttribute("data-variante", variante!);
    }

    // Y el clic en «Empezar gratis» lleva al registro.
    await page.locator('[data-cta="empezar"]').click();
    await expect(page).toHaveURL(/\/registro$/);

    // Cuatro cargas y un clic, y de este visitante no quedó ni un evento: todo
    // llevaba la cabecera de prueba. Se mira su hash exacto, no el total, para que
    // una visita real que entre mientras corre la prueba no la haga fallar.
    await page.waitForTimeout(1500);
    expect(await eventosDe(visitante)).toBe(0);
  });

  test("la portada tiene las siete secciones del plan, en orden", async ({ page }) => {
    await page.goto("/");
    const orden = await page.locator("[data-seccion]").evaluateAll((s) => s.map((e) => e.getAttribute("data-seccion")));
    expect(orden).toEqual(["titular", "problema", "como-funciona", "prueba", "precio", "privacidad", "empezar"]);

    // La prueba con datos enlaza a la investigación, donde está cada fuente.
    await expect(page.locator('[data-seccion="prueba"] a[href="/research"]')).toBeVisible();
    // Y las dos frases que se quitaron no volvieron.
    await expect(page.getByText("A las dos semanas")).toHaveCount(0);
    await expect(page.getByText("Diez prendas bastan")).toHaveCount(0);
  });
});

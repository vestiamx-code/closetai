import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

import { cargarEnv, hayCuotaDeRazonamiento } from "./entorno";

/**
 * Semana 2 · `/research` — el módulo de investigación.
 *
 * Lo que más importa probar no es que la página se vea bien, es que no mienta:
 * que cada riesgo apunte a evidencia que existe, que la búsqueda no falle en
 * silencio y que la validación con personas diga "pendiente" en vez de simular.
 */

cargarEnv();

const URL_SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const LLAVE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const hay = Boolean(URL_SUPABASE && LLAVE);

const admin = () =>
  createClient(URL_SUPABASE!, LLAVE!, { auth: { autoRefreshToken: false, persistSession: false } });

test.describe("Investigación (/research)", () => {
  test.skip(!hay, "Faltan credenciales: la prueba se salta");

  test("carga sin sesión, con el panel, 5 referentes con fuente y al menos 8 competidores y sustitutos", async ({
    page,
  }) => {
    const r = await page.goto("/research");
    expect(r?.status()).toBe(200);
    await expect(page).toHaveURL(/\/research$/);

    await expect(page.getByRole("region", { name: /resumen de la investigación/i })).toBeVisible();

    const referentes = page.getByTestId("referente");
    await expect(referentes).toHaveCount(5);
    for (const tarjeta of await referentes.all()) {
      await expect(tarjeta.locator('a[href^="https://"]').first()).toBeVisible();
    }

    const filas = page.getByTestId("tabla-competidores").locator("tbody tr");
    expect(await filas.count()).toBeGreaterThanOrEqual(8);
  });

  test("buscar «mexico» sin tilde encuentra México, y algo que no existe muestra el aviso", async ({ page }) => {
    await page.goto("/research");
    const tabla = page.getByTestId("tabla-competidores");
    const buscador = page.getByRole("searchbox", { name: /buscar competidores/i });

    // Primero se afirma que Whering SÍ está: si no, que desaparezca después no prueba nada.
    await expect(tabla.getByText("Whering", { exact: true })).toBeVisible();

    await buscador.fill("mexico");
    await expect(tabla.getByText("GoTrendier", { exact: true })).toBeVisible();
    await expect(tabla.getByText("Whering", { exact: true })).toHaveCount(0);

    await buscador.fill("zzzz-no-existe");
    await expect(page.getByText(/ningún competidor ni sustituto coincide/i)).toBeVisible();
    await expect(page.getByTestId("tabla-competidores")).toHaveCount(0);
  });

  test("filtrar por sustitutos deja solo sustitutos", async ({ page }) => {
    await page.goto("/research");
    const tabla = page.getByTestId("tabla-competidores");

    const antes = await tabla.locator("tbody tr").evaluateAll((trs) => trs.map((t) => t.getAttribute("data-tipo")));
    expect(new Set(antes)).toEqual(new Set(["competidor", "sustituto"]));

    await page.getByRole("button", { name: "Sustitutos", exact: true }).click();
    await expect(page.getByRole("button", { name: "Sustitutos", exact: true })).toHaveAttribute("aria-pressed", "true");

    const despues = await tabla.locator("tbody tr").evaluateAll((trs) => trs.map((t) => t.getAttribute("data-tipo")));
    expect(despues.length).toBeGreaterThan(0);
    expect(new Set(despues)).toEqual(new Set(["sustituto"]));
  });

  test("el mapa muestra cada riesgo, y cada evidencia citada existe", async ({ page }) => {
    const a = admin();
    const [riesgos, fuentes] = await Promise.all([
      a.from("research_risks").select("id, evidencia"),
      a.from("research_sources").select("id"),
    ]);
    const ids = new Set((fuentes.data ?? []).map((f) => f.id as string));
    const lista = (riesgos.data ?? []) as { id: string; evidencia: string[] }[];

    // Postgres no permite llave foránea sobre un arreglo: esta es la garantía.
    expect(lista.length).toBeGreaterThanOrEqual(6);
    for (const r of lista) {
      for (const e of r.evidencia) {
        expect(ids.has(e), `el riesgo «${r.id}» cita una evidencia que no existe: «${e}»`).toBe(true);
      }
    }

    await page.goto("/research");
    const mapa = page.getByTestId("mapa-riesgos");
    for (const r of lista) {
      await expect(mapa.locator(`[data-riesgo="${r.id}"]`)).toBeVisible();
    }
  });

  test("la validación muestra la conversación real o dice que está pendiente, nunca otra cosa", async ({ page }) => {
    const { count } = await admin().from("validation_conversations").select("id", { count: "exact", head: true });

    await page.goto("/research");
    const seccion = page.getByTestId("validacion");
    if ((count ?? 0) === 0) {
      await expect(seccion.getByText(/pendiente/i)).toBeVisible();
      await expect(seccion.locator("blockquote")).toHaveCount(0);
    } else {
      await expect(seccion.locator("blockquote").first()).toBeVisible();
      await expect(seccion.getByText(/pendiente/i)).toHaveCount(0);
    }
  });

  test("rechaza una pregunta demasiado corta sin gastar una llamada al modelo", async ({ page }) => {
    await page.goto("/research");
    await page.getByLabel(/pregunta de investigación/i).fill("¿competencia?");
    await page.getByRole("button", { name: "Investigar", exact: true }).click();
    await expect(page.getByText(/escribe la pregunta completa/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("informe")).toHaveCount(0);
  });

  test("una pregunta produce un informe con citas reales y se guarda", async ({ page }) => {
    test.setTimeout(180_000);
    test.skip(!(await hayCuotaDeRazonamiento()), "Gemini sin cuota (429): no se pudo comprobar");

    const a = admin();
    const { count: antes } = await a.from("research_outputs").select("id", { count: "exact", head: true });

    await page.goto("/research");
    await page
      .getByLabel(/pregunta de investigación/i)
      .fill("¿La gente paga por apps para organizar su clóset, y cuánto?");
    await page.getByRole("button", { name: "Investigar", exact: true }).click();

    const informe = page.getByTestId("informe");
    const saturado = page.getByText(/El modelo está saturado/i);
    await expect(informe.or(saturado)).toBeVisible({ timeout: 90_000 });
    test.skip(await saturado.isVisible(), "Gemini sin cuota a media prueba (429)");

    // Cada cita del informe es un enlace a una fuente que existe en la tabla.
    const citas = informe.locator("a[data-fuente]");
    expect(await citas.count()).toBeGreaterThan(0);
    const { data: fuentes } = await a.from("research_sources").select("id");
    const ids = new Set((fuentes ?? []).map((f) => f.id as string));
    for (const id of await citas.evaluateAll((as) => as.map((x) => x.getAttribute("data-fuente")))) {
      expect(ids.has(id ?? ""), `el informe cita «${id}», que no existe`).toBe(true);
    }

    await informe.getByRole("button", { name: /guardar este informe/i }).click();
    await expect(informe.getByText(/^Guardado\./)).toBeVisible({ timeout: 30_000 });

    const { count: despues } = await a.from("research_outputs").select("id", { count: "exact", head: true });
    expect(despues ?? 0, "no se escribió la fila en research_outputs").toBeGreaterThan(antes ?? 0);
  });
});

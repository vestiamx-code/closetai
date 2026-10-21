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

  test("una visita real sí se cuenta: una vista y un clic, una sola vez aunque recargue", async ({ browser }) => {
    // La prueba anterior demuestra que el tráfico de pruebas NO se cuenta. Sola,
    // pasaría igual si el contador estuviera roto y no contara nada. Esta es la
    // contraria: un navegador SIN la cabecera de prueba, como el de cualquier
    // persona. Al final borra sus propios eventos para no ensuciar el experimento.
    // Y con el user-agent de un Chrome normal: Playwright se identifica como
    // HeadlessChrome, que el experimento descarta con razón (ver traficoAutomatico).
    const contexto = await browser.newContext({
      extraHTTPHeaders: {},
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    });
    const page = await contexto.newPage();
    let visitante = "";
    try {
      await page.goto("/");
      await expect
        .poll(async () => (await contexto.cookies()).find((c) => c.name === "cai_visitante")?.value ?? "")
        .toMatch(/^[0-9a-f-]{36}$/);
      visitante = (await contexto.cookies()).find((c) => c.name === "cai_visitante")!.value;

      const eventos = async () => {
        const { data } = await admin()
          .from("ab_events")
          .select("evento, variante")
          .eq("visitante_hash", huella(visitante));
        return data ?? [];
      };

      await expect.poll(async () => (await eventos()).map((e) => e.evento).sort()).toEqual(["vista"]);

      // Recargar no suma otra vista: la unidad es la persona.
      await page.reload();
      await page.reload();
      await page.waitForTimeout(1500);
      expect((await eventos()).filter((e) => e.evento === "vista")).toHaveLength(1);

      // Y el clic en «Empezar gratis» se registra, con la misma variante que vio.
      const variante = await page.getByRole("heading", { level: 1 }).getAttribute("data-variante");
      await page.locator('[data-cta="empezar"]').click();
      await expect(page).toHaveURL(/\/registro$/);
      await expect.poll(async () => (await eventos()).map((e) => e.evento).sort()).toEqual(["clic", "vista"]);
      expect(new Set((await eventos()).map((e) => e.variante))).toEqual(new Set([variante]));
    } finally {
      if (visitante) await admin().from("ab_events").delete().eq("visitante_hash", huella(visitante));
      await contexto.close();
    }
  });

  test("el generador escribe un post sin cifras inventadas y lo guarda como «sin revisar»", async ({ page }) => {
    // Una sola llamada al modelo por corrida: basta con un perfil.
    test.skip(test.info().project.name !== "desktop-chrome", "Llama a la IA: corre en un solo perfil");
    test.setTimeout(90_000);

    await page.goto("/marketing#generador");
    await page.locator("#tema").fill("Qué ponerse un lunes de lluvia con lo que ya tienes");
    await page.getByRole("button", { name: "Generar post" }).click();

    const resultado = page.getByTestId("resultado-generador");
    await expect(resultado.locator('[data-testid="post-generado"], [role="alert"]')).toBeVisible({ timeout: 60_000 });
    // Se decide qué salió sin esperar: textContent() sobre un aviso que no existe
    // se queda esperando hasta agotar el tiempo de la prueba.
    const aviso = (await resultado.getByTestId("post-generado").isVisible())
      ? null
      : await resultado.getByRole("alert").textContent();
    test.skip(Boolean(aviso && /saturado|varios posts/i.test(aviso)), `El proveedor no respondió: ${aviso}`);

    // Si el modelo inventó una cifra, el rechazo es el comportamiento correcto, no
    // un fallo: se anota y se acepta. Lo que no puede pasar es que la muestre.
    if (aviso && /no están en los datos verificados/.test(aviso)) {
      test.info().annotations.push({ type: "rechazo", description: aviso });
      return;
    }

    const post = page.getByTestId("post-generado");
    await expect(post).toContainText("Generado con IA · sin revisar");
    const titulo = (await post.locator("h3").textContent())!.trim();

    await post.getByRole("button", { name: "Guardar" }).click();
    await expect(post.getByRole("button", { name: "Guardado" })).toBeVisible({ timeout: 20_000 });

    const { data } = await admin()
      .from("marketing_assets")
      .select("id, origen, aprobado, titulo, cuerpo")
      .eq("titulo", titulo)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    try {
      expect(data!.origen).toBe("generado_ia");
      expect(data!.aprobado).toBe(false);
      await page.reload();
      await expect(page.locator(`[data-generado="${data!.id}"]`)).toBeVisible();
    } finally {
      if (data?.id) await admin().from("marketing_assets").delete().eq("id", data.id);
    }
  });

  test("la portada tiene las siete secciones del plan, en orden", async ({ page }) => {
    await page.goto("/");
    const orden = await page.locator("[data-seccion]").evaluateAll((s) => s.map((e) => e.getAttribute("data-seccion")));
    expect(orden).toEqual(["titular", "problema", "como-funciona", "prueba", "precio", "privacidad", "empezar"]);

    // La prueba con datos enlaza a la investigación, donde está cada fuente.
    await expect(page.locator('[data-seccion="prueba"] a[href="/research"]')).toBeVisible();
    // El resto de la página no repite ninguno de los dos titulares: si lo hiciera,
    // cada grupo vería también la variante del otro.
    const fueraDelTitular = await page
      .locator('[data-seccion]:not([data-seccion="titular"])')
      .evaluateAll((s) => s.map((e) => e.textContent ?? "").join(" "));
    expect(fueraDelTitular).not.toMatch(/Ya tienes qué ponerte|Tu estilista, en tu bolsillo/);

    // Y las dos frases que se quitaron no volvieron.
    await expect(page.getByText("A las dos semanas")).toHaveCount(0);
    await expect(page.getByText("Diez prendas bastan")).toHaveCount(0);
  });
});

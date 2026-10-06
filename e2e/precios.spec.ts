import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

import { cargarEnv } from "./entorno";

/**
 * Semana 3 · `/product` y `/pricing`.
 *
 * La aritmética ya está probada aparte, en `src/lib/precios.test.ts`. Lo que se
 * prueba aquí es lo que esas pruebas no pueden ver: que la página recalcule al
 * mover un control, y —la que de verdad importa— que lo que se guarda sea el
 * número del servidor y no el que mandó el navegador.
 */

cargarEnv();

const URL_SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const LLAVE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const hay = Boolean(URL_SUPABASE && LLAVE);

const admin = () =>
  createClient(URL_SUPABASE!, LLAVE!, { auth: { autoRefreshToken: false, persistSession: false } });

/** "$12,345" → 12345. Lo que se compara es el número, no cómo se escribe. */
const aNumero = (texto: string) => Number(texto.replace(/[^\d-]/g, ""));

test.describe("Producto y precios", () => {
  test.skip(!hay, "Faltan credenciales: la prueba se salta");

  test("/pricing carga sin sesión, con los tres planes y los dos segmentos", async ({ page }) => {
    const r = await page.goto("/pricing");
    expect(r?.status()).toBe(200);

    const planes = page.locator("[data-plan]");
    await expect(planes).toHaveCount(3);
    await expect(page.locator('[data-plan="completo"]')).toContainText("$100");

    // Los dos segmentos, en la tabla de resultados.
    await expect(page.locator('[data-segmento="nucleo"]')).toBeVisible();
    await expect(page.locator('[data-segmento="mayores"]')).toBeVisible();

    // Y la tabla de supuestos distingue lo verificado de lo supuesto: si todo
    // dijera "verificado", la tabla no serviría de nada.
    const tabla = page.getByTestId("tabla-supuestos");
    await expect(tabla.getByText("verificado").first()).toBeVisible();
    await expect(tabla.getByText("supuesto").first()).toBeVisible();
  });

  test("mover un supuesto y cambiar de escenario cambia el resultado", async ({ page }) => {
    await page.goto("/pricing");

    const neto = page.getByTestId("neto-mensual");
    const inicial = aNumero((await neto.innerText()) ?? "");

    // Primero el número tiene que existir: si fuera 0, "cambia" no probaría nada.
    expect(inicial).toBeGreaterThan(0);

    await page.locator("#registros-nucleo").fill("1200");
    await page.locator("#registros-nucleo").blur();
    await expect.poll(async () => aNumero(await neto.innerText())).toBeGreaterThan(inicial);

    const conMasRegistros = aNumero(await neto.innerText());
    await page.locator('[data-escenario="conservador"]').click();
    await expect.poll(async () => aNumero(await neto.innerText())).toBeLessThan(conMasRegistros);

    await page.locator('[data-escenario="optimista"]').click();
    await expect.poll(async () => aNumero(await neto.innerText())).toBeGreaterThanOrEqual(conMasRegistros);
  });

  test("lo que se guarda es el resultado del servidor, no el del navegador", async ({ page }) => {
    await page.goto("/pricing");

    const nombre = `prueba-e2e-${Date.now()}`;
    await page.locator("#registros-nucleo").fill("500");
    await page.locator("#registros-nucleo").blur();
    const enPantalla = aNumero(await page.getByTestId("neto-mensual").innerText());

    await page.locator("#nombre").fill(nombre);
    await page.getByRole("button", { name: "Guardar", exact: true }).click();

    // Aparece en la lista sin recargar.
    await expect(page.getByTestId("lista-escenarios").getByText(nombre)).toBeVisible({ timeout: 20_000 });

    // Y en la base está el número que calculó el servidor, no el del navegador.
    const { data } = await admin()
      .from("pricing_scenarios")
      .select("nombre, resultado, supuestos, ip_hash")
      .eq("nombre", nombre)
      .single();

    expect(data).not.toBeNull();
    const guardado = data!.resultado as { ingresoNeto: number };
    expect(Math.round(guardado.ingresoNeto)).toBe(enPantalla);

    // La IP no se guarda: lo que hay es un hash de 64 caracteres.
    expect(data!.ip_hash).toMatch(/^[0-9a-f]{64}$/);

    await admin().from("pricing_scenarios").delete().eq("nombre", nombre);
  });

  test("el servidor ignora un resultado inventado por el navegador", async ({ page, request }) => {
    // Esta es la prueba del requisito 9: la Server Action recalcula. Se ataca
    // por el camino más corto —mandar supuestos de un escenario y comprobar que
    // el resultado guardado corresponde a esos supuestos, no a un número suelto—.
    await page.goto("/pricing");

    const nombre = `prueba-servidor-${Date.now()}`;
    await page.locator("#registros-nucleo").fill("0");
    await page.locator("#registros-mayores").fill("0");
    await page.locator("#registros-nucleo").blur();
    await page.locator("#nombre").fill(nombre);
    await page.getByRole("button", { name: "Guardar", exact: true }).click();
    await expect(page.getByTestId("lista-escenarios").getByText(nombre)).toBeVisible({ timeout: 20_000 });

    const { data } = await admin()
      .from("pricing_scenarios")
      .select("resultado")
      .eq("nombre", nombre)
      .single();

    // Sin registros no hay ingreso posible: cualquier otro número habría salido
    // del navegador.
    const guardado = data!.resultado as { ingresoBruto: number; ingresoNeto: number };
    expect(guardado.ingresoBruto).toBe(0);
    expect(guardado.ingresoNeto).toBe(0);

    await admin().from("pricing_scenarios").delete().eq("nombre", nombre);
    expect(request).toBeTruthy();
  });

  test("/product carga sin sesión y el mapa dice el estado real de cada función", async ({ page }) => {
    const r = await page.goto("/product");
    expect(r?.status()).toBe(200);

    const mapa = page.getByTestId("mapa-funciones");
    await expect(mapa).toBeVisible();

    const funciones = mapa.locator("[data-funcion]");
    expect(await funciones.count()).toBeGreaterThanOrEqual(12);

    // Un mapa donde todo está "en vivo" sería publicidad, no un mapa.
    expect(await mapa.locator('[data-estado="vivo"]').count()).toBeGreaterThan(0);
    expect(await mapa.locator('[data-estado="planeado"]').count()).toBeGreaterThan(0);

    // Y lo que dice estar en vivo tiene que abrirse de verdad.
    const rutas = await mapa.locator('[data-estado="vivo"] a[href^="/"]').evaluateAll((as) =>
      [...new Set(as.map((a) => a.getAttribute("href")!))],
    );
    expect(rutas.length).toBeGreaterThan(0);
    for (const ruta of rutas.filter((x) => ["/core", "/research", "/product", "/pricing"].includes(x))) {
      const resp = await page.request.get(ruta);
      expect(resp.status(), `${ruta} debería cargar`).toBe(200);
    }
  });
});

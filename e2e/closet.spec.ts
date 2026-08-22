import path from "node:path";

import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

import { cargarEnv } from "./entorno";

/**
 * Recorrido completo de la Semana 1: entrar, subir una prenda, verla catalogada
 * en el clóset, corregirla y borrarla.
 *
 * Usa el proyecto real de Supabase. Crea su propia usuaria desechable y la borra
 * al final, así que no ensucia la base. Se salta solo si no hay credenciales,
 * para que el CI no dependa de secretos.
 */

cargarEnv();

const URL_SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const LLAVE_SERVICIO = process.env.SUPABASE_SERVICE_ROLE_KEY;
const hayCredenciales = Boolean(URL_SUPABASE && LLAVE_SERVICIO && process.env.GEMINI_API_KEY);

const CORREO = `e2e-${Date.now()}@closetai.lat`;
const CONTRASENA = "Prueba-E2E-2026!";

test.describe.configure({ mode: "serial" });

/**
 * Playwright aísla el navegador entre pruebas: cada una empieza sin sesión.
 * Por eso las que necesitan estar dentro vuelven a entrar aquí.
 */
async function iniciarSesion(page: import("@playwright/test").Page) {
  await page.goto("/entrar");
  await page.getByLabel("Correo").fill(CORREO);
  await page.getByLabel("Contraseña").fill(CONTRASENA);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/closet/);
}

test.describe("Clóset digital", () => {
  test.skip(!hayCredenciales, "Faltan credenciales: la prueba se salta");

  let userId = "";

  const admin = () => createClient(URL_SUPABASE!, LLAVE_SERVICIO!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  test.beforeAll(async () => {
    const { data, error } = await admin().auth.admin.createUser({
      email: CORREO,
      password: CONTRASENA,
      email_confirm: true,
      user_metadata: { full_name: "Prueba E2E" },
    });
    if (error) throw error;
    userId = data.user!.id;
  });

  test.afterAll(async () => {
    if (!userId) return;
    const a = admin();
    const { data: archivos } = await a.storage.from("garments").list(userId, { limit: 100 });
    const rutas = (archivos ?? []).map((f) => `${userId}/${f.name}`);
    if (rutas.length) await a.storage.from("garments").remove(rutas);
    await a.auth.admin.deleteUser(userId);
  });

  test("una ruta privada manda a iniciar sesión", async ({ page }) => {
    await page.goto("/closet");
    await expect(page).toHaveURL(/\/entrar/);
    // Y recuerda a dónde iba, para regresarla ahí después.
    await expect(page).toHaveURL(/destino=%2Fcloset/);
  });

  test("no revela si un correo tiene cuenta o no", async ({ page }) => {
    await page.goto("/entrar");
    await page.getByLabel("Correo").fill("no-existe-jamas@closetai.lat");
    await page.getByLabel("Contraseña").fill("loquesea123");
    await page.getByRole("button", { name: "Entrar" }).click();
    // El mismo mensaje que con contraseña incorrecta: no se filtra qué correos existen.
    // (No se usa getByRole("alert"): Next añade su propio anunciador de rutas con ese rol.)
    await expect(page.getByText("Correo o contraseña incorrectos.")).toBeVisible();
  });

  test("entrar, subir una prenda y verla catalogada", async ({ page }) => {
    test.setTimeout(120_000);

    await iniciarSesion(page);
    await expect(page.getByRole("heading", { name: "Mi clóset" })).toBeVisible();
    await expect(page.getByText("Empieza con diez prendas")).toBeVisible();

    await page.getByRole("link", { name: /Subir mis primeras fotos|Agregar prendas/ }).first().click();
    await expect(page).toHaveURL(/\/closet\/subir/);

    await page.locator('input[type="file"]').setInputFiles(
      path.join(__dirname, "..", "src", "tests", "fixtures", "playera-rayas.png"),
    );

    // La IA tarda: compresión, subida y catalogación.
    await expect(page.getByText("✓ Lista")).toBeVisible({ timeout: 90_000 });

    await page.getByRole("link", { name: /Ver mi clóset/ }).click();
    await expect(page).toHaveURL(/\/closet$/);

    // La prenda quedó catalogada en español de México.
    await expect(page.getByText(/playera/i).first()).toBeVisible();
    await expect(page.getByText("1 prenda")).toBeVisible();
  });

  test("corregir el nombre de una prenda deja rastro para el aprendizaje", async ({ page }) => {
    await iniciarSesion(page);
    await page.locator("ul li a").first().click();

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.getByLabel("Nombre de la prenda").fill("playera de rayas marinera");
    await page.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(page.getByText("Guardado.")).toBeVisible();

    // La corrección tiene que haber generado un feedback_event de tipo tag_fix:
    // es la materia prima del aprendizaje de gustos (M4), no solo un dato editado.
    const { data } = await admin()
      .from("feedback_events")
      .select("type, payload")
      .eq("user_id", userId)
      .eq("type", "tag_fix");

    expect(data?.length).toBeGreaterThan(0);
  });

  test("el costo de la catalogación quedó registrado", async () => {
    const { data } = await admin()
      .from("api_costs")
      .select("provider, operation, est_cost_usd")
      .eq("user_id", userId);

    expect(data?.length).toBeGreaterThan(0);
    expect(data![0].operation).toBe("catalog_garment");
  });
});

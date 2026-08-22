import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

import { cargarEnv } from "./entorno";

/**
 * Recorrido de la Semana 2: el estilista arma outfits con el clóset real,
 * la usuaria reacciona, y esa reacción queda registrada para el aprendizaje.
 */

cargarEnv();

const URL_SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const LLAVE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const hay = Boolean(URL_SUPABASE && LLAVE && process.env.GEMINI_API_KEY);

const CORREO = `e2e-estilista-${Date.now()}@closetai.lat`;
const CONTRASENA = "Prueba-E2E-2026!";

const PRENDAS = [
  { subcategory: "playera de rayas", category: "top", colors: ["azul marino", "blanco"], styles: ["casual"], seasons: ["verano"], occasions: ["diario"] },
  { subcategory: "jeans rectos", category: "bottom", colors: ["azul"], styles: ["casual"], seasons: ["todo el año"], occasions: ["diario"] },
  { subcategory: "blazer beige", category: "abrigo", colors: ["beige"], styles: ["formal"], seasons: ["otoño"], occasions: ["oficina"] },
  { subcategory: "tenis blancos", category: "calzado", colors: ["blanco"], styles: ["casual"], seasons: ["todo el año"], occasions: ["diario"] },
  { subcategory: "vestido acampanado", category: "vestido", colors: ["vino"], styles: ["romántico"], seasons: ["primavera"], occasions: ["cita"] },
];

test.describe.configure({ mode: "serial" });

test.describe("Estilista", () => {
  test.skip(!hay, "Faltan credenciales");

  let userId = "";
  const admin = () =>
    createClient(URL_SUPABASE!, LLAVE!, { auth: { autoRefreshToken: false, persistSession: false } });

  test.beforeAll(async () => {
    const a = admin();
    const { data, error } = await a.auth.admin.createUser({
      email: CORREO,
      password: CONTRASENA,
      email_confirm: true,
      user_metadata: { full_name: "Prueba Estilista" },
    });
    if (error) throw error;
    userId = data.user!.id;

    // Clóset sembrado directo: esta prueba mide al estilista, no a la subida.
    await a.from("garments").insert(
      PRENDAS.map((p, i) => ({
        ...p,
        user_id: userId,
        image_path: `${userId}/semilla-${i}.png`,
        status: "active",
      })),
    );
  });

  test.afterAll(async () => {
    if (userId) await admin().auth.admin.deleteUser(userId);
  });

  async function iniciarSesion(page: import("@playwright/test").Page) {
    await page.goto("/entrar");
    await page.getByLabel("Correo").fill(CORREO);
    await page.getByLabel("Contraseña").fill(CONTRASENA);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/closet/);
  }

  test("arma tres outfits explicando por qué funcionan", async ({ page }) => {
    test.setTimeout(180_000);
    await iniciarSesion(page);

    await page.goto("/hoy");
    await expect(page.getByRole("heading", { name: "Qué me pongo hoy" })).toBeVisible();

    await page.getByRole("button", { name: /Armar mis outfits/ }).click();
    await expect(page.getByRole("button", { name: /Me lo pongo/ }).first()).toBeVisible({
      timeout: 120_000,
    });

    const outfits = await page.locator("main ul > li").filter({ has: page.getByRole("button", { name: "Me lo pongo" }) }).count();
    expect(outfits).toBeGreaterThan(0);

    // Cada outfit explica su razón: es la promesa del producto, no un adorno.
    const { data } = await admin()
      .from("outfits")
      .select("title, explanation, weather")
      .eq("user_id", userId);

    expect(data?.length).toBeGreaterThan(0);
    for (const outfit of data ?? []) {
      expect(outfit.explanation?.length ?? 0).toBeGreaterThan(40);
      expect(outfit.title?.length ?? 0).toBeGreaterThan(0);
    }
    // Y el clima real quedó guardado con el outfit.
    expect(data?.[0]?.weather).toBeTruthy();
  });

  test("rechazar un outfit deja constancia para el aprendizaje", async ({ page }) => {
    await iniciarSesion(page);
    await page.goto("/hoy");

    await page.getByRole("button", { name: "No, gracias" }).first().click();
    await page.getByRole("button", { name: "No es mi estilo" }).first().click();
    await expect(page.getByText(/No te vuelvo a proponer/)).toBeVisible();

    const { data } = await admin()
      .from("feedback_events")
      .select("type, payload")
      .eq("user_id", userId)
      .eq("type", "reject");

    expect(data?.length).toBeGreaterThan(0);
    expect((data![0].payload as Record<string, string>).motivo).toBe("No es mi estilo");
  });

  test("el costo de cada llamada al estilista queda registrado", async () => {
    const { data } = await admin()
      .from("api_costs")
      .select("operation")
      .eq("user_id", userId)
      .eq("operation", "suggest_outfits");

    expect(data?.length).toBeGreaterThan(0);
  });
});

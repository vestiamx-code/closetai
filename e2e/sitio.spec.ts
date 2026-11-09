import { createClient } from "@supabase/supabase-js";
import { expect, test, type Page } from "@playwright/test";

import { cargarEnv } from "./entorno";
import { SECCIONES_PUBLICAS } from "../src/components/sitio-nav";
import { PASOS } from "../src/lib/demo";

/**
 * Week 6 · Full-site regression, against the real site.
 *
 * Every public page: it loads, has its heading, carries the shared navigation,
 * fits a phone and logs no errors. Every private page sends a stranger to sign
 * in. The public key can't read any private table. And the full-site tester
 * flow saves a summary — marked as a test, never shown, deleted afterwards.
 *
 * Runs on both profiles (phone and desktop): the navigation is different on
 * each, and both are checked.
 */

cargarEnv();

const PUBLICAS = ["/", ...SECCIONES_PUBLICAS.map((s) => s.href), "/privacy", "/sign-in", "/sign-up"];
const SEMANAS_DEMO = ["/demo/week-0", "/demo/week-1", "/demo/week-2", "/demo/week-3", "/demo/week-4", "/demo/week-5"];
const PRIVADAS = ["/today", "/closet", "/closet/add", "/try-on", "/style", "/profile", "/buy/recommendations", "/admin"];

/** Collects console errors and failed page requests while a page is open. */
function vigilarErrores(page: Page) {
  const errores: string[] = [];
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const texto = m.text();
    // The browser's own noise about third-party images it chose not to preload is not the page's fault.
    if (/Failed to load resource.*(favicon|unsplash)/i.test(texto)) return;
    errores.push(texto);
  });
  page.on("pageerror", (e) => errores.push(e.message));
  return errores;
}

for (const ruta of [...PUBLICAS, ...SEMANAS_DEMO]) {
  test(`${ruta} loads, has a heading, fits the screen and logs no errors`, async ({ page }) => {
    const errores = vigilarErrores(page);
    const r = await page.goto(ruta);
    expect(r?.status(), ruta).toBe(200);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    await page.waitForLoadState("networkidle");
    const desborde = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(desborde, "horizontal overflow in px").toBeLessThanOrEqual(0);
    expect(errores, errores.join("\n")).toEqual([]);
  });
}

test("every public module reaches every other one through the shared navigation", async ({ page, isMobile }) => {
  for (const origen of SECCIONES_PUBLICAS.map((s) => s.href)) {
    await page.goto(origen);
    if (isMobile) {
      // On a phone the links live behind the Menu.
      await expect(page.getByTestId("nav-escritorio")).toBeHidden();
      await page.getByTestId("nav-movil").locator("summary").click();
    }
    const nav = page.getByTestId(isMobile ? "nav-movil" : "nav-escritorio");
    for (const { href, texto } of SECCIONES_PUBLICAS) {
      await expect(nav.getByRole("link", { name: texto, exact: true }), `${origen} → ${href}`).toHaveAttribute("href", href);
    }
    await expect(nav.locator('[aria-current="page"]')).toHaveAttribute("href", origen);
  }
});

test("the phone menu opens, navigates, and is closed again on the next page", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Phone profile only");
  await page.goto("/chat");
  const menu = page.getByTestId("nav-movil");
  await menu.locator("summary").click();
  await menu.getByRole("link", { name: "Dashboard", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByTestId("nav-movil")).not.toHaveAttribute("open", "");
});

for (const ruta of PRIVADAS) {
  test(`${ruta} sends a stranger to sign in`, async ({ page }) => {
    await page.goto(ruta);
    await expect(page).toHaveURL(/\/sign-in/);
  });
}

test("/demo walks through live pages, draws every agent, and lists five testers", async ({ page }) => {
  await page.goto("/demo");
  const pasos = page.getByTestId("pasos").locator("[data-paso]");
  await expect(pasos).toHaveCount(PASOS.length);
  // Every step links a page that answers 200 right now.
  for (const p of PASOS) {
    const r = await page.request.get(p.ruta);
    expect(r.status(), p.ruta).toBe(200);
  }
  const agentes = page.locator("[data-agente]");
  expect(await agentes.count()).toBeGreaterThanOrEqual(10);
  await expect(page.getByTestId("testers").locator("[data-tester]")).toHaveCount(5);
  // A tester shows either their own words or "Pending" — never something in between.
  for (const fila of await page.getByTestId("testers").locator("[data-tester]").all()) {
    const estado = await fila.getAttribute("data-estado");
    if (estado === "pendiente") await expect(fila).toContainText("Pending");
    else await expect(fila).toContainText("What worked");
  }
  await expect(page.getByTestId("riesgos").locator("tbody tr")).toHaveCount(8);
  expect(await page.getByTestId("roadmap").locator("li").count()).toBeGreaterThanOrEqual(5);
});

test("/docs shows every production prompt with its full text", async ({ page }) => {
  await page.goto("/docs");
  const tarjetas = page.getByTestId("prompts").locator("[data-prompt]");
  expect(await tarjetas.count()).toBeGreaterThanOrEqual(9);
  const chat = page.locator('[data-prompt="chat"]');
  await chat.getByText("Read the full prompt").click();
  await expect(chat.locator("pre")).toContainText("You are ClosetAI's public stylist");
  await expect(page.getByTestId("bitacora").locator("li")).toHaveCount(7);
});

test("/dashboard shows real numbers and no personal data", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByTestId("error-tablero")).toHaveCount(0);
  for (const id of ["cuentas", "prendas", "outfits", "conversaciones"]) {
    await expect(page.locator(`[data-cifra="${id}"] p`).first()).toHaveText(/^\d[\d,]*$/);
  }
  expect(await page.getByTestId("costos").locator("[data-operacion]").count()).toBeGreaterThanOrEqual(5);
  const texto = (await page.locator("main").textContent()) ?? "";
  expect(texto, "an email on the page").not.toMatch(/[\w.+-]+@[\w-]+\.\w+/);
  expect(texto, "an IP on the page").not.toMatch(/\b\d{1,3}(\.\d{1,3}){3}\b/);
});

test.describe("data that must stay private", () => {
  const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  test.skip(!URL || !ANON, "Missing the public key");

  const PRIVADAS_DB = [
    "profiles",
    "garments",
    "outfits",
    "feedback_events",
    "tryon_renders",
    "avatar_photos",
    "api_costs",
    "chat_sessions",
    "chat_messages",
    "chat_ratings",
    "chat_test_summaries",
    "site_test_summaries",
    "ab_events",
    "core_outputs",
  ];

  test("the public key reads no row from any private table", async ({ isMobile }) => {
    test.skip(isMobile, "One profile is enough for a database check");
    const anon = createClient(URL!, ANON!, { auth: { persistSession: false } });
    for (const tabla of PRIVADAS_DB) {
      const { data, error } = await anon.from(tabla).select("*").limit(1);
      // Either refused outright, or RLS filters every row away.
      expect(error !== null || (data ?? []).length === 0, `${tabla} is readable with the public key`).toBe(true);
    }
  });
});

test.describe("full-site tester flow", () => {
  const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const LLAVE = process.env.SUPABASE_SERVICE_ROLE_KEY;
  test.skip(!URL || !LLAVE, "Missing credentials");
  const admin = () => createClient(URL!, LLAVE!, { auth: { autoRefreshToken: false, persistSession: false } });
  const inicio = new Date().toISOString();

  test.afterAll(async () => {
    await admin().from("site_test_summaries").delete().eq("es_prueba", true).gte("created_at", inicio);
  });

  test("needs consent, saves the summary marked as a test, and never shows it", async ({ page, isMobile }) => {
    test.skip(isMobile, "One profile: the row is read back from the database");
    await page.goto("/demo?test=5");
    const caja = page.getByTestId("prueba-sitio");
    await expect(caja).toBeVisible();
    // Without consent nothing can be sent.
    await expect(caja.getByRole("button", { name: "Send my summary" })).toBeDisabled();

    await page.getByTestId("consentimiento-sitio").locator("input").check();
    await caja.getByLabel("1. Ask the stylist, without an account").check();
    await caja.getByLabel("8. See everything counted").check();
    await caja.getByLabel("2. What worked, or what did you like?").fill("Automated regression run");
    await caja.getByLabel("3. What was confusing, slow, broken or missing?").fill("Nothing: this is a test");
    await caja.getByRole("button", { name: "4", exact: true }).click();
    await caja.getByText("Maybe", { exact: true }).click();
    await caja.getByRole("button", { name: "Send my summary" }).click();
    await expect(page.getByTestId("prueba-guardada")).toBeVisible({ timeout: 20_000 });

    const { data } = await admin()
      .from("site_test_summaries")
      .select("tester, paginas, puntaje, lo_usaria, es_prueba, consentimiento_at")
      .gte("created_at", inicio);
    expect(data).toEqual([
      expect.objectContaining({ tester: 5, paginas: ["chat", "dashboard"], puntaje: 4, lo_usaria: "tal_vez", es_prueba: true }),
    ]);
    expect(data![0].consentimiento_at).toBeTruthy();

    // A test row never takes a real tester's place on the page.
    await page.goto("/demo");
    await expect(page.getByTestId("testers")).not.toContainText("Automated regression run");
  });
});

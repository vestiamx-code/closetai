import { createClient } from "@supabase/supabase-js";
import { expect, test, type Page } from "@playwright/test";

import { cargarEnv } from "./entorno";

/**
 * Week 5 · /chat, against the real site.
 *
 * The three software tests the week asks for. Every run carries the test header
 * (playwright.config.ts), so its conversations are stored marked as tests: they
 * stay out of the public totals, and this file deletes them at the end so they
 * don't fill Tamara's review list.
 *
 * The guardrail logic itself is tested in src/lib/chat.test.ts; here it is
 * tested end to end, including that the model was never called.
 */

cargarEnv();

const URL_SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const LLAVE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const hay = Boolean(URL_SUPABASE && LLAVE);
const admin = () =>
  createClient(URL_SUPABASE!, LLAVE!, { auth: { autoRefreshToken: false, persistSession: false } });

const inicio = new Date().toISOString();

/** The conversations this run created (all marked as tests). */
async function sesionesDeEstaCorrida() {
  const { data } = await admin()
    .from("chat_sessions")
    .select("id, intake, needs_review, motivo_revision, es_prueba")
    .eq("es_prueba", true)
    .gte("created_at", inicio)
    .order("created_at", { ascending: true });
  return data ?? [];
}

async function costosDeChat() {
  const { count } = await admin()
    .from("api_costs")
    .select("id", { count: "exact", head: true })
    .eq("operation", "chat_reply")
    .gte("created_at", inicio);
  return count ?? 0;
}

/** Answers the three intake questions with the suggested chips. */
async function contestarIntake(page: Page) {
  const chat = page.getByTestId("chat");
  await chat.getByText("What’s the occasion?").waitFor();
  await page.getByTestId("sugerencias").getByRole("button", { name: "Work" }).click();
  await expect(chat.getByText("Where are you, and what’s the weather like?")).toBeVisible({ timeout: 20_000 });
  await page.getByTestId("sugerencias").getByRole("button", { name: "Rainy" }).click();
  await expect(chat.getByText("How do you like to dress?")).toBeVisible({ timeout: 20_000 });
}

/** Waits for the outfit, or skips if the provider had no quota (and says so). */
async function esperarSugerencia(page: Page) {
  const resultado = page.locator('[data-testid="outfit"], [role="alert"]').first();
  await resultado.waitFor({ timeout: 90_000 });
  if (!(await page.getByTestId("outfit").isVisible())) {
    const aviso = await page.getByRole("alert").textContent();
    test.skip(/overloaded/i.test(aviso ?? ""), `The provider did not answer: ${aviso}`);
    throw new Error(`No outfit: ${aviso}`);
  }
}

test.describe("Chat", () => {
  test.skip(!hay, "Missing credentials: the test is skipped");
  // These read "the conversation this run just created" from the database; with
  // two browser profiles running at once they would read each other's. One
  // profile, in order. The phone layout has its own test below.
  test.beforeEach(() => {
    test.skip(test.info().project.name !== "desktop-chrome", "Runs on one profile");
  });
  test.describe.configure({ mode: "serial" });

  test.afterAll(async () => {
    const ids = (await sesionesDeEstaCorrida()).map((s) => s.id);
    if (ids.length) await admin().from("chat_sessions").delete().in("id", ids);
  });

  test("the three questions come in order, and the outfit only after the third", async ({ page }) => {
    test.setTimeout(150_000);

    const r = await page.goto("/chat");
    expect(r?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/What should\s*I wear\?/);

    const costosAntes = await costosDeChat();
    await contestarIntake(page);

    // Two answers in: no suggestion yet, and the model has not been called.
    await expect(page.getByTestId("outfit")).toHaveCount(0);
    expect(await costosDeChat()).toBe(costosAntes);
    const [sesion] = await sesionesDeEstaCorrida();
    expect(sesion.intake).toEqual({ ocasion: "Work", clima: "Rainy" });

    await page.getByTestId("sugerencias").getByRole("button", { name: "Comfortable" }).click();
    await esperarSugerencia(page);

    const card = page.getByTestId("outfit").first();
    expect(await card.locator("li").count()).toBeGreaterThanOrEqual(2);
    await expect(card).toContainText("Tip:");
    expect(await costosDeChat()).toBe(costosAntes + 1);
  });

  test("a diet question gets the guardrail, is flagged for review, and never reaches the model", async ({ page }) => {
    await page.goto("/chat");
    const costosAntes = await costosDeChat();
    const antes = (await sesionesDeEstaCorrida()).length;

    await page.getByLabel("What’s the occasion?").fill("How do I lose 5 kilos before the party?");
    await page.getByRole("button", { name: "Send" }).click();

    const guardrail = page.getByTestId("guardrail");
    await expect(guardrail).toBeVisible({ timeout: 20_000 });
    await expect(guardrail).toContainText("I don’t give advice on diets or weight");
    await expect(guardrail).toContainText("A person from ClosetAI will review this conversation");
    await expect(page.getByTestId("aviso-revision")).toBeVisible();

    const sesiones = await sesionesDeEstaCorrida();
    expect(sesiones.length).toBe(antes + 1);
    const sesion = sesiones[sesiones.length - 1];
    expect(sesion.needs_review).toBe(true);
    expect(sesion.motivo_revision).toBe("dieta");
    // The guardrail answer didn't count as an intake answer…
    expect(sesion.intake).toEqual({});
    // …and nobody paid a model for it.
    expect(await costosDeChat()).toBe(costosAntes);
    // The same question is still waiting.
    await expect(page.getByLabel("What’s the occasion?")).toBeVisible();
  });

  test("a rating is saved once, and test traffic stays out of the public totals", async ({ page }) => {
    test.setTimeout(150_000);

    await page.goto("/chat");
    const arribaAntes = await page.locator('[data-total="arriba"]').textContent();
    await contestarIntake(page);
    await page.getByTestId("sugerencias").getByRole("button", { name: "Minimal" }).click();
    await esperarSugerencia(page);

    const calificar = page.getByTestId("outfit").first().getByTestId("calificar");
    await calificar.getByRole("button", { name: "Helpful" }).click();
    await expect(calificar.getByText("Thanks for rating")).toBeVisible();
    // Once rated, both buttons are done: no second vote, no changing sides.
    await expect(calificar.getByRole("button", { name: "Not helpful" })).toBeDisabled();

    const sesiones = await sesionesDeEstaCorrida();
    const sesion = sesiones[sesiones.length - 1];
    const { data: mensajes } = await admin()
      .from("chat_messages")
      .select("id, chat_ratings(rating)")
      .eq("session_id", sesion.id)
      .eq("rol", "asistente")
      .not("modelo", "is", null);
    await expect
      .poll(async () => {
        const { data } = await admin()
          .from("chat_ratings")
          .select("rating")
          .in("message_id", (mensajes ?? []).map((m) => m.id));
        return (data ?? []).map((r) => r.rating);
      })
      .toEqual([1]);

    // The database refuses a second rating for the same answer, too.
    const { error } = await admin()
      .from("chat_ratings")
      .insert({ message_id: mensajes![0].id, rating: -1 });
    expect(error?.code).toBe("23505");

    // A test run's thumbs up does not move what the public sees.
    await page.reload();
    await expect(page.locator('[data-total="arriba"]')).toHaveText(arribaAntes ?? "0");
  });
});

test("on a phone, the chat fits the screen and the suggestions can be tapped", async ({ page }) => {
  test.skip(test.info().project.name !== "mobile-chrome", "Phone profile only");
  await page.goto("/chat");
  await expect(page.getByTestId("sugerencias").getByRole("button", { name: "Work" })).toBeVisible();
  const desborde = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(desborde).toBe(0);
});


import { chromium } from "@playwright/test";
import fs from "node:fs";

// Week 6 demo video, recorded against https://closetai.lat. The test header goes
// only to ClosetAI, so its chat conversation stays out of the public totals.
// Each scene lasts at least as long as Tamara's sentence for it (her narration,
// Nov 16, 2026, timed with faster-whisper).
// Usage (repo root): cp this to ./grabar-tmp.mjs; node grabar-tmp.mjs <out>; rm it.
const OUT = process.argv[2];
const SITIO = "https://closetai.lat";
const b = await chromium.launch();
const ctx = await b.newContext({
  viewport: { width: 1280, height: 720 },
  recordVideo: { dir: OUT, size: { width: 1280, height: 720 } },
  userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
});
await ctx.route("https://closetai.lat/**", (r) => r.continue({ headers: { ...r.request().headers(), "x-cai-prueba": "1" } }));
const p = await ctx.newPage();
const t0 = Date.now();
const marcas = [];
const marca = (n) => {
  const t = (Date.now() - t0) / 1000;
  marcas.push({ escena: n, segundo: Number(t.toFixed(1)) });
  console.log(t.toFixed(1).padStart(6), n);
  return Date.now();
};
const esperar = (ms) => p.waitForTimeout(ms);
/**
 * Waits until the scene has lasted at least `s` seconds, plus a few seconds of
 * breathing room after each sentence: Week 6's video is about 5 minutes.
 */
const RESPIRO = 3.6;
const hasta = async (inicio, s) => {
  const falta = (s + RESPIRO) * 1000 - (Date.now() - inicio);
  if (falta > 0) await esperar(falta);
};
const irA = async (loc, ms = 1400) => {
  const destino = await loc.evaluate((e) => e.getBoundingClientRect().top + window.scrollY - 80);
  const origen = await p.evaluate(() => window.scrollY);
  for (let i = 1; i <= 20; i++) {
    await p.evaluate((y) => window.scrollTo(0, y), origen + ((destino - origen) * i) / 20);
    await esperar(ms / 20);
  }
};
/** Scrolls down slowly for `s` seconds. */
const bajar = async (s, px = 2) => {
  const pasos = Math.round((s * 1000) / 40);
  for (let i = 0; i < pasos; i++) {
    await p.evaluate((d) => window.scrollBy(0, d), px);
    await esperar(40);
  }
};
const tocar = (n) => p.getByTestId("sugerencias").getByRole("button", { name: n, exact: true }).click();
const burbuja = (t) => p.getByTestId("chat").locator('li[data-rol="asistente"]').getByText(t).first();

// Warm the pages up so the recording doesn't show cold starts.
for (const r of ["/", "/demo", "/chat", "/dashboard", "/docs", "/product"]) await (await ctx.request.get(`${SITIO}${r}`)).text();

let t = marca("portada");
await p.goto(`${SITIO}/`, { waitUntil: "networkidle" });
await hasta(t, 11);

t = marca("demo");
await p.goto(`${SITIO}/demo`, { waitUntil: "networkidle" });
await esperar(9000);
await bajar(6, 1);
await hasta(t, 18.5);

t = marca("menu");
await p.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
await esperar(1200);
for (const n of ["Product", "Research", "Style core", "Pricing", "Marketing", "Chat", "Dashboard", "Docs", "Demo"]) {
  await p.getByTestId("nav-escritorio").getByRole("link", { name: n, exact: true }).hover();
  await esperar(750);
}
await hasta(t, 9);

t = marca("pasos");
await irA(p.locator("#walkthrough"));
await esperar(3000);
await bajar(3, 2);
await hasta(t, 8);

t = marca("preguntas");
await p.goto(`${SITIO}/chat`, { waitUntil: "networkidle" });
await esperar(1500);
await irA(p.getByTestId("chat"), 900);
await esperar(1500);
await tocar("Women’s clothes");
await burbuja("What’s the occasion?").waitFor({ timeout: 30000 });
await esperar(2200);
await tocar("A date");
await burbuja("Where are you, and what’s the weather like?").waitFor({ timeout: 30000 });
await esperar(2200);
await tocar("Mexico City, cool");
await burbuja("How do you like to dress?").waitFor({ timeout: 30000 });
await hasta(t, 11.5 - RESPIRO);
await tocar("Elegant");

marca("pensando");
await p.getByTestId("outfit").first().waitFor({ timeout: 90000 });
await esperar(800);

t = marca("outfit");
console.log("photos", await p.getByTestId("foto").count(), "of", await p.getByTestId("prenda").count());
await irA(p.getByTestId("outfit").first());
await esperar(3000);
await bajar(9, 3);
await hasta(t, 15);

t = marca("filtro");
await p.locator("#mensaje").click();
await p.keyboard.type("How do I lose 5 kilos before the party?", { delay: 45 });
await esperar(400);
await p.getByRole("button", { name: "Send" }).click();
await p.getByTestId("guardrail").first().waitFor({ timeout: 30000 });
await irA(p.getByTestId("guardrail").first(), 800);
await hasta(t, 10.5);

t = marca("app");
await p.goto(`${SITIO}/`, { waitUntil: "networkidle" });
await irA(p.getByRole("heading", { name: "How it works" }), 1200);
await esperar(5500);
await p.goto(`${SITIO}/product`, { waitUntil: "networkidle" });
await esperar(1500);
await bajar(5, 3);
await hasta(t, 14);

t = marca("dashboard");
await p.goto(`${SITIO}/dashboard`, { waitUntil: "networkidle" });
await esperar(4500);
await bajar(11, 3);
await irA(p.getByTestId("costos"), 1200);
await hasta(t, 19.5);

t = marca("docs");
await p.goto(`${SITIO}/docs`, { waitUntil: "networkidle" });
await esperar(2500);
await irA(p.locator('[data-prompt="chat"]'), 1000);
await p.locator('[data-prompt="chat"]').getByText("Read the full prompt").click();
await esperar(3000);
await irA(p.locator("#build-log"), 1200);
await esperar(2000);
await hasta(t, 12.5);

t = marca("agentes");
await p.goto(`${SITIO}/demo`, { waitUntil: "networkidle" });
await irA(p.locator("#agents"), 1000);
await esperar(2500);
await bajar(9, 3);
await hasta(t, 15);

t = marca("testers");
await irA(p.locator("#testing"), 1200);
await esperar(5000);
await bajar(14, 2);
await hasta(t, 22.5);

t = marca("regresion");
await irA(p.getByTestId("regresion"), 900);
await hasta(t, 14.5);

t = marca("impacto");
await irA(p.locator("#impact"), 1200);
await esperar(3500);
await bajar(8, 3);
await hasta(t, 13.5);

t = marca("roadmap");
await irA(p.locator("#roadmap"), 1200);
await esperar(3000);
await bajar(8, 2);
await hasta(t, 13);

t = marca("github");
await p.goto("https://github.com/vestiamx-code/closetai/commits/main", { waitUntil: "load", timeout: 60000 });
await hasta(t, 9);
marca("fin");

const video = p.video();
await ctx.close();
const ruta = await video.path();
await b.close();
fs.writeFileSync(`${OUT}/marcas.json`, JSON.stringify(marcas, null, 2));
console.log("video:", ruta);

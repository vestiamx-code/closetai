import { chromium } from "@playwright/test";
import fs from "node:fs";

// Week 5 demo video, recorded against https://closetai.lat. Carries the test
// header on the site, so its conversation stays out of the public totals.
// Usage (repo root): cp this to ./grabar-tmp.mjs; node grabar-tmp.mjs <out>; rm it.
const OUT = process.argv[2];
const SITIO = "https://closetai.lat";
const b = await chromium.launch();
const ctx = await b.newContext({
  viewport: { width: 1280, height: 720 },
  recordVideo: { dir: OUT, size: { width: 1280, height: 720 } },
  userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
});
// The test header goes only to ClosetAI, not to the stores.
await ctx.route("https://closetai.lat/**", (r) => r.continue({ headers: { ...r.request().headers(), "x-cai-prueba": "1" } }));
const p = await ctx.newPage();
const t0 = Date.now();
const marcas = [];
const marca = (n) => { const t = (Date.now() - t0) / 1000; marcas.push({ escena: n, segundo: Number(t.toFixed(1)) }); console.log(t.toFixed(1).padStart(6), n); };
const esperar = (ms) => p.waitForTimeout(ms);
const irA = async (loc, ms = 1400) => {
  const destino = await loc.evaluate((e) => e.getBoundingClientRect().top + window.scrollY - 90);
  const origen = await p.evaluate(() => window.scrollY);
  for (let i = 1; i <= 18; i++) { await p.evaluate((y) => window.scrollTo(0, y), origen + ((destino - origen) * i) / 18); await esperar(ms / 18); }
};
const tocar = (n) => p.getByTestId("sugerencias").getByRole("button", { name: n, exact: true }).click();
const burbuja = (t) => p.getByTestId("chat").locator('li[data-rol="asistente"]').getByText(t).first();

marca("portada");
await p.goto(`${SITIO}/`, { waitUntil: "networkidle" });
await esperar(6000);

marca("chat");
await p.goto(`${SITIO}/chat`, { waitUntil: "networkidle" });
await esperar(5000);

marca("preguntas");
await irA(p.getByTestId("chat"));
await esperar(2500);
await tocar("Women’s clothes");
await burbuja("What’s the occasion?").waitFor({ timeout: 30000 });
await esperar(3000);
await tocar("A date");
await burbuja("Where are you, and what’s the weather like?").waitFor({ timeout: 30000 });
await esperar(3000);
await tocar("Mexico City, cool");
await burbuja("How do you like to dress?").waitFor({ timeout: 30000 });
await esperar(3500);
await tocar("Elegant");

marca("pensando");
await p.getByTestId("outfit").first().waitFor({ timeout: 90000 });
await esperar(1500);

marca("outfit");
console.log("photos", await p.getByTestId("foto").count(), "of", await p.getByTestId("prenda").count());
await irA(p.getByTestId("outfit").first());
await esperar(5000);
for (let i = 0; i < 40; i++) { await p.evaluate(() => window.scrollBy(0, 30)); await esperar(120); }
await esperar(2500);

marca("calificar");
await irA(p.getByTestId("calificar").first(), 900);
await esperar(1500);
await p.getByTestId("calificar").first().getByRole("button", { name: "Helpful", exact: true }).click();
await esperar(3000);

marca("seguimiento");
await p.locator("#mensaje").click();
await p.keyboard.type("Can I wear sneakers instead?", { delay: 55 });
await esperar(600);
const antes = await p.getByTestId("chat").locator('li[data-rol="asistente"]').count();
await p.getByRole("button", { name: "Send" }).click();
// The follow-up may come back in words or as a new outfit: wait for any new answer.
await p.waitForFunction((n) => document.querySelectorAll('[data-testid="chat"] li[data-rol="asistente"]').length > n, antes, { timeout: 60000 });
await irA(p.getByTestId("chat").locator('li[data-rol="asistente"]').last(), 900);
await esperar(6000);

marca("filtro");
await p.locator("#mensaje").click();
await p.keyboard.type("How do I lose 5 kilos before the party?", { delay: 55 });
await esperar(600);
await p.getByRole("button", { name: "Send" }).click();
await p.getByTestId("guardrail").first().waitFor({ timeout: 30000 });
await irA(p.getByTestId("guardrail").first(), 900);
await esperar(8000);

marca("tienda");
await p.goto("https://shop.mango.com/mx/es/search/mujer?q=vestido%20negro%20cruzado%20mujer", { waitUntil: "domcontentloaded" });
await esperar(8000);

marca("evidencia");
await p.goto(`${SITIO}/chat`, { waitUntil: "networkidle" });
await esperar(800);
await irA(p.locator("#calificaciones-titulo"), 1200);
await esperar(4000);
await irA(p.locator("#pruebas-titulo"), 1200);
await esperar(9000);

marca("github");
await p.goto("https://github.com/vestiamx-code/closetai/commits/main", { waitUntil: "load", timeout: 60000 });
await esperar(9000);
marca("fin");

const video = p.video();
await ctx.close();
const ruta = await video.path();
await b.close();
fs.writeFileSync(`${OUT}/marcas.json`, JSON.stringify(marcas, null, 2));
console.log("video:", ruta);

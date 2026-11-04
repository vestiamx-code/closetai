import { chromium, devices } from "@playwright/test";

// Screenshots for the Week 5 document, from https://closetai.lat, with the test header.
// Usage (repo root): cp this to ./capturas-tmp.mjs; node capturas-tmp.mjs <out>; rm it.
const OUT = process.argv[2];
const SITIO = "https://closetai.lat";
const JPG = { type: "jpeg", quality: 86 };
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2, extraHTTPHeaders: { "x-cai-prueba": "1" } });
const p = await ctx.newPage();
await p.goto(`${SITIO}/chat`, { waitUntil: "networkidle" });
await p.waitForTimeout(1000);
await p.screenshot({ path: `${OUT}/01-chat.jpg`, ...JPG });
await p.getByTestId("sugerencias").getByRole("button", { name: "Women’s clothes", exact: true }).click();
await p.getByLabel("What’s the occasion?").fill("How do I lose 5 kilos before the party?");
await p.getByRole("button", { name: "Send" }).click();
await p.getByTestId("guardrail").waitFor({ timeout: 30000 });
await p.waitForTimeout(800);
await p.getByTestId("chat").screenshot({ path: `${OUT}/02-guardrail.jpg`, ...JPG });
const seccion = async (sel, n) => { const l = p.locator(sel).locator('xpath=..'); await l.scrollIntoViewIfNeeded(); await p.waitForTimeout(400); await l.screenshot({ path: `${OUT}/${n}.jpg`, ...JPG }); };
await seccion('#calificaciones-titulo', "03-calificaciones");
await seccion('#pruebas-titulo', "04-testers");
await p.goto(`${SITIO}/`, { waitUntil: "networkidle" });
await p.waitForTimeout(1500);
await p.screenshot({ path: `${OUT}/05-portada.jpg`, ...JPG });
const cel = await b.newContext({ ...devices["iPhone 13"], extraHTTPHeaders: { "x-cai-prueba": "1" } });
const c = await cel.newPage();
await c.goto(`${SITIO}/chat`, { waitUntil: "networkidle" });
await c.waitForTimeout(800);
console.log("phone overflow:", await c.evaluate(() => document.documentElement.scrollWidth - window.innerWidth));
await c.screenshot({ path: `${OUT}/06-celular.jpg`, ...JPG });
const gh = await b.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
const g = await gh.newPage();
await g.goto("https://github.com/vestiamx-code/closetai/commits/main", { waitUntil: "load", timeout: 60000 });
await g.waitForTimeout(2500);
await g.screenshot({ path: `${OUT}/07-commits.jpg`, ...JPG });
await b.close();

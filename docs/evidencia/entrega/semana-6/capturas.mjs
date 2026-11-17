import { chromium, devices } from "@playwright/test";

// Screenshots for the Week 6 document, from https://closetai.lat, with the test header.
// Usage (repo root): cp this to ./capturas-tmp.mjs; node capturas-tmp.mjs <out>; rm it.
const OUT = process.argv[2];
const SITIO = "https://closetai.lat";
const JPG = { type: "jpeg", quality: 84 };
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1280, height: 860 }, deviceScaleFactor: 2, extraHTTPHeaders: { "x-cai-prueba": "1" } });
const p = await ctx.newPage();

const seccion = async (id, nombre) => {
  const l = p.locator(`section#${id}`);
  await l.scrollIntoViewIfNeeded();
  await p.waitForTimeout(500);
  await l.screenshot({ path: `${OUT}/${nombre}.jpg`, ...JPG });
};

await p.goto(`${SITIO}/demo`, { waitUntil: "networkidle" });
await p.waitForTimeout(1200);
await p.screenshot({ path: `${OUT}/01-demo.jpg`, ...JPG });
await seccion("walkthrough", "02-pasos");
await seccion("agents", "03-agentes");
await seccion("testing", "04-testers");
await seccion("impact", "05-impacto");
await seccion("roadmap", "06-roadmap");

await p.goto(`${SITIO}/dashboard`, { waitUntil: "networkidle" });
await p.waitForTimeout(800);
await p.locator("main").screenshot({ path: `${OUT}/07-dashboard.jpg`, ...JPG });

await p.goto(`${SITIO}/docs`, { waitUntil: "networkidle" });
const chat = p.locator('[data-prompt="chat"]');
await chat.getByText("Read the full prompt").click();
await p.waitForTimeout(500);
await p.locator("section#prompts").screenshot({ path: `${OUT}/08-docs.jpg`, ...JPG });
await p.locator("section#build-log").screenshot({ path: `${OUT}/09-bitacora.jpg`, ...JPG });

const cel = await b.newContext({ ...devices["iPhone 13"], extraHTTPHeaders: { "x-cai-prueba": "1" } });
const c = await cel.newPage();
await c.goto(`${SITIO}/chat`, { waitUntil: "networkidle" });
await c.getByTestId("nav-movil").locator("summary").click();
await c.waitForTimeout(500);
await c.screenshot({ path: `${OUT}/10-menu-celular.jpg`, ...JPG });
await c.goto(`${SITIO}/demo?test=preview`, { waitUntil: "networkidle" });
await c.getByTestId("consentimiento-sitio").locator("input").check();
await c.waitForTimeout(500);
await c.getByTestId("prueba-sitio").scrollIntoViewIfNeeded();
await c.screenshot({ path: `${OUT}/11-tester-celular.jpg`, ...JPG });
console.log("phone overflow:", await c.evaluate(() => document.documentElement.scrollWidth - window.innerWidth));

const gh = await b.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
const g = await gh.newPage();
await g.goto("https://github.com/vestiamx-code/closetai/commits/main", { waitUntil: "load", timeout: 60000 });
await g.waitForTimeout(2500);
await g.screenshot({ path: `${OUT}/12-commits.jpg`, ...JPG });
await b.close();

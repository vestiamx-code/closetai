import { chromium, devices } from "@playwright/test";

// Screenshots for the Week 4 submission document, taken from https://closetai.lat.
// Retaken on Oct 26, 2026 against the English product. Carries the test header,
// so taking them adds no visits to the experiment.
//
// Usage (from the repo root, so @playwright/test resolves):
//   cp docs/evidencia/entrega/semana-4/capturas.mjs ./capturas-tmp.mjs
//   node capturas-tmp.mjs docs/evidencia/entrega/semana-4 && rm capturas-tmp.mjs

const OUT = process.argv[2];
const SITIO = "https://closetai.lat";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
// Same sample visitors as the video: A and B of the `headline` experiment.
const VISITANTE = { a: "de540b17-7d9f-4959-a79b-1dece3efae1e", b: "192325e8-414d-4438-b3ab-0e7a21801819" };
const JPG = { type: "jpeg", quality: 86 };

const b = await chromium.launch();
const ctx = await b.newContext({
  viewport: { width: 1280, height: 720 },
  deviceScaleFactor: 2,
  extraHTTPHeaders: { "x-cai-prueba": "1" },
  userAgent: UA,
});
const p = await ctx.newPage();

async function portada(v) {
  await ctx.addCookies([{ name: "cai_visitante", value: VISITANTE[v], url: SITIO }]);
  await p.goto(`${SITIO}/`, { waitUntil: "networkidle" });
  await p.waitForSelector(`h1[data-variante="${v}"]`);
  await p.waitForTimeout(800);
}
async function seccion(selector, nombre) {
  const el = p.locator(selector).first();
  await el.scrollIntoViewIfNeeded();
  await p.waitForTimeout(500);
  await el.screenshot({ path: `${OUT}/${nombre}.jpg`, ...JPG });
  console.log(nombre);
}

await portada("a");
await p.screenshot({ path: `${OUT}/01-portada-a.jpg`, ...JPG });
await portada("b");
await p.screenshot({ path: `${OUT}/01-portada-b.jpg`, ...JPG });
await seccion('[data-seccion="problema"]', "02-problema");
await seccion('[data-seccion="como-funciona"]', "02-como-funciona");
await seccion('[data-seccion="prueba"]', "02-prueba");
await seccion('[data-seccion="precio"]', "02-precio");

await p.goto(`${SITIO}/marketing`, { waitUntil: "networkidle" });
await p.waitForSelector("[data-post]");
await seccion("#marca", "03-marca");
await seccion("#persona", "04-persona");
await seccion("#ab", "05-ab");
await seccion("#posts", "06-posts-arriba");
await seccion("#guiones", "07-guiones");
await seccion("#calendario", "08-calendario");
await seccion("#generador", "09-generador");
await seccion("#guardados", "10-guardados");

const gh = await b.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2, userAgent: UA });
const g = await gh.newPage();
await g.goto("https://github.com/vestiamx-code/closetai/commits/main", { waitUntil: "load", timeout: 60000 });
await g.waitForTimeout(2500);
await g.screenshot({ path: `${OUT}/11-commits.jpg`, ...JPG });
console.log("11-commits");
await gh.close();

const cel = await b.newContext({ ...devices["iPhone 13"], extraHTTPHeaders: { "x-cai-prueba": "1" } });
await cel.addCookies([{ name: "cai_visitante", value: VISITANTE.b, url: SITIO }]);
const c = await cel.newPage();
for (const [ruta, nombre] of [["/", "12-celular-portada"], ["/marketing", "13-celular-marketing"]]) {
  await c.goto(`${SITIO}${ruta}`, { waitUntil: "networkidle" });
  await c.waitForTimeout(800);
  const desborde = await c.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  await c.screenshot({ path: `${OUT}/${nombre}.jpg`, ...JPG });
  console.log(nombre, "horizontal overflow:", desborde);
}
await b.close();

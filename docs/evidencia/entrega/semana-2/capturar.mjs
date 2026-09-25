import { chromium } from "@playwright/test";

const SALIDA = process.argv[2];
const b = await chromium.launch();

async function pinta(p) {
  // Sin animaciones ni cursor: la captura tiene que ser idéntica corrida a corrida.
  await p.addStyleTag({ content: "*{animation:none!important;transition:none!important}" });
}

const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
await p.goto("https://closetai.lat/research", { waitUntil: "networkidle" });
await pinta(p);

const trozos = [
  ["02-referentes", "#referentes"],
  ["03-mexico", "#mexico"],
  ["04-tabla", "#competidores"],
  ["06-riesgos", "#riesgos"],
  ["08-descartado", "#descartado"],
];
for (const [nombre, sel] of trozos) {
  const loc = p.locator(sel);
  await loc.scrollIntoViewIfNeeded();
  await p.waitForTimeout(400);
  await loc.screenshot({ path: `${SALIDA}/${nombre}.png` });
  console.log(nombre);
}

// La tabla filtrada: se escribe "mexico" sin acento, que es justo lo que prueba la búsqueda.
await p.getByRole("searchbox", { name: /buscar competidores/i }).fill("mexico");
await p.waitForTimeout(700);
await p.locator("#competidores").screenshot({ path: `${SALIDA}/05-busqueda-mexico.png` });
console.log("05-busqueda-mexico");

// El repositorio, con el commit de la narración arriba.
await p.goto("https://github.com/vestiamx-code/closetai/commits/main", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2500);
await p.screenshot({ path: `${SALIDA}/10-commits.png` });
console.log("10-commits");
await ctx.close();

// En teléfono: lo que se muestra es que no hay desborde horizontal.
const cel = await b.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
});
const q = await cel.newPage();
await q.goto("https://closetai.lat/research", { waitUntil: "networkidle" });
await pinta(q);
await q.locator("#riesgos").scrollIntoViewIfNeeded();
await q.waitForTimeout(500);
const desborde = await q.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
console.log("desborde horizontal:", desborde, "px");
await q.screenshot({ path: `${SALIDA}/09-celular.png` });
console.log("09-celular");
await cel.close();
await b.close();

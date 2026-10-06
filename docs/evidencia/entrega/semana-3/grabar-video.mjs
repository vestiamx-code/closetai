import { chromium } from "@playwright/test";
import fs from "node:fs";

const OUT = process.argv[2];
const b = await chromium.launch();
const ctx = await b.newContext({
  viewport: { width: 1280, height: 720 },
  recordVideo: { dir: OUT, size: { width: 1280, height: 720 } },
});
const p = await ctx.newPage();
const t0 = Date.now();
const marcas = [];
const marca = (n) => {
  const t = (Date.now() - t0) / 1000;
  marcas.push({ escena: n, segundo: Number(t.toFixed(1)) });
  console.log(`${t.toFixed(1).padStart(6)} s  ${n}`);
};
const esperar = (ms) => p.waitForTimeout(ms);

async function irA(selector, pasos = 20, ms = 1600) {
  const destino = await p.evaluate(
    (s) => document.querySelector(s).getBoundingClientRect().top + window.scrollY - 70,
    selector,
  );
  const origen = await p.evaluate(() => window.scrollY);
  for (let i = 1; i <= pasos; i++) {
    await p.evaluate((y) => window.scrollTo(0, y), origen + ((destino - origen) * i) / pasos);
    await esperar(ms / pasos);
  }
}
async function bajar(px, pasos = 22, ms = 2400) {
  for (let i = 0; i < pasos; i++) {
    await p.evaluate((d) => window.scrollBy(0, d), px / pasos);
    await esperar(ms / pasos);
  }
}
// Mover un control número a número, para que en el video se vea el cambio.
async function subirHasta(selector, desde, hasta, paso, ms) {
  const campo = p.locator(selector);
  for (let v = desde + paso; v <= hasta; v += paso) {
    await campo.fill(String(v));
    await campo.dispatchEvent("change");
    await esperar(ms);
  }
}

marca("producto");
await p.goto("https://closetai.lat/product", { waitUntil: "domcontentloaded" });
await p.waitForSelector("[data-funcion]");
await esperar(8100);

marca("mapa");
await irA("#mapa");
await esperar(6750);
await bajar(420);
await esperar(6750);
await bajar(420);
await esperar(5400);

marca("planes");
await p.goto("https://closetai.lat/pricing", { waitUntil: "domcontentloaded" });
await p.waitForSelector("[data-plan]");
await esperar(12150);

marca("simulador");
await irA('[data-testid="simulador"]');
await esperar(6750);

marca("mover");
await subirHasta("#registros-nucleo", 400, 1200, 100, 420);
await esperar(4725);

marca("escenarios");
await p.locator('[data-escenario="conservador"]').click();
await esperar(4725);
await p.locator('[data-escenario="optimista"]').click();
await esperar(5400);
await p.locator('[data-escenario="base"]').click();
await esperar(4050);

marca("supuestos");
await irA("#supuestos");
await esperar(9450);
await bajar(420);
await esperar(8100);

marca("guardar");
await irA('[data-testid="simulador"]');
await esperar(1500);
await p.locator("#nombre").click();
await p.keyboard.type("Mil doscientos registros al mes", { delay: 55 });
await esperar(1200);
await p.getByRole("button", { name: "Guardar", exact: true }).click();
await p.getByTestId("lista-escenarios").getByText("Mil doscientos registros al mes").waitFor({ timeout: 25_000 });
await esperar(1500);

marca("guardados");
await irA("#guardados");
await esperar(9450);

marca("github");
await p.goto("https://github.com/vestiamx-code/closetai/commits/main", { waitUntil: "domcontentloaded" });
await esperar(6750);
await bajar(520, 26, 4200);
await esperar(4725);
marca("fin");

const video = p.video();
await ctx.close();
const ruta = await video.path();
await b.close();
fs.writeFileSync(`${OUT}/marcas.json`, JSON.stringify(marcas, null, 2));
console.log("video:", ruta);

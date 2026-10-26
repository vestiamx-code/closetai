import { chromium } from "@playwright/test";
import fs from "node:fs";

// Week 4 demo video, recorded against https://closetai.lat.
// It carries the test header: recording the video adds no visits to the experiment.
//
// Usage (from the repo root, so @playwright/test resolves):
//   cp docs/evidencia/entrega/semana-4/grabar-video.mjs ./grabar-tmp.mjs
//   node grabar-tmp.mjs <output-folder> && rm grabar-tmp.mjs
//
// The scene marks of the submitted recording are in marcas-video.json.
// Re-recorded on Oct 26, 2026 against the English product.

const OUT = process.argv[2];
// Two sample visitors: the first lands in variant A, the second in B of the
// `headline` experiment (computed with varianteDe from src/lib/ab.ts).
const VISITANTE = {
  a: "de540b17-7d9f-4959-a79b-1dece3efae1e",
  b: "192325e8-414d-4438-b3ab-0e7a21801819",
};
const SITIO = "https://closetai.lat";

const b = await chromium.launch();
const ctx = await b.newContext({
  viewport: { width: 1280, height: 720 },
  recordVideo: { dir: OUT, size: { width: 1280, height: 720 } },
  extraHTTPHeaders: { "x-cai-prueba": "1" },
  userAgent:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
});
await ctx.grantPermissions(["clipboard-read", "clipboard-write"], { origin: SITIO });
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
async function comoVisitante(v) {
  await ctx.addCookies([{ name: "cai_visitante", value: VISITANTE[v], url: SITIO }]);
  await p.goto(`${SITIO}/`, { waitUntil: "domcontentloaded" });
  await p.waitForSelector(`h1[data-variante="${v}"]`);
}

marca("portada-a");
await comoVisitante("a");
await esperar(7000);

marca("portada-b");
await comoVisitante("b");
await esperar(7000);

marca("argumento");
await irA('[data-seccion="problema"]');
await esperar(3500);
await irA('[data-seccion="como-funciona"]');
await esperar(4000);
await irA('[data-seccion="prueba"]');
await esperar(5000);
await irA('[data-seccion="precio"]');
await esperar(3500);
await irA('[data-seccion="privacidad"]');
await esperar(4000);

marca("marketing");
await p.goto(`${SITIO}/marketing`, { waitUntil: "domcontentloaded" });
await p.waitForSelector("[data-post]");
await esperar(6000);

marca("marca");
await irA("#marca");
await esperar(6000);

marca("persona");
await irA("#persona");
await esperar(8000);

marca("ab");
await irA("#ab");
await esperar(9000);

marca("posts");
await irA("#posts");
await esperar(3000);
await p.locator('[data-post="post-01"] [data-copiar]').click();
await esperar(3000);
await bajar(500);
await esperar(4000);

marca("guiones");
await irA("#guiones");
await esperar(6000);

marca("calendario");
await irA("#calendario");
await esperar(2500);
const descarga = p.waitForEvent("download").catch(() => null);
await p.locator('[data-exportar="closetai-calendario.csv"]').click();
await descarga;
await esperar(5000);

marca("generador");
await irA("#generador");
await esperar(1500);
await p.locator("#tema").click();
await p.keyboard.type("What to wear on a rainy Monday", { delay: 55 });
await esperar(800);
for (let intento = 1; intento <= 2; intento++) {
  await p.getByRole("button", { name: "Generate post" }).click();
  const salida = p.getByTestId("resultado-generador");
  await salida.locator('[data-testid="post-generado"], [role="alert"]').first().waitFor({ timeout: 90_000 });
  if (await salida.getByTestId("post-generado").isVisible()) break;
  console.log(`   notice on attempt ${intento}: "${await salida.getByRole("alert").textContent()}"`);
  if (intento === 2) throw new Error("two attempts without a post");
}
marca("post-generado");
await esperar(6000);
await p.getByTestId("post-generado").getByRole("button", { name: "Save" }).click();
await p.getByTestId("post-generado").getByRole("button", { name: "Saved" }).waitFor({ timeout: 20_000 });
await esperar(2500);

marca("guardados");
await irA("#guardados");
await esperar(6000);

marca("github");
await p.goto("https://github.com/vestiamx-code/closetai/commits/main", { waitUntil: "domcontentloaded" });
await esperar(5000);
await bajar(520, 26, 4200);
await esperar(3500);
marca("fin");

const video = p.video();
await ctx.close();
const ruta = await video.path();
await b.close();
fs.writeFileSync(`${OUT}/marcas.json`, JSON.stringify(marcas, null, 2));
console.log("video:", ruta);

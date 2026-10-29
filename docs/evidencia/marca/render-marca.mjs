// Renders the brand files from icono.html and compartir.html.
// Run from the repo root: node docs/evidencia/marca/render-marca.mjs
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const aqui = (f) => fileURLToPath(new URL(f, import.meta.url));
const app = (f) => fileURLToPath(new URL(`../../../src/app/${f}`, import.meta.url));

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1200, height: 630 } });

await p.goto(`file://${aqui("./icono.html")}`, { waitUntil: "networkidle" });
await p.evaluate(() => document.fonts.ready);
await p.locator("#icono").screenshot({ path: app("icon.png"), omitBackground: true });
await p.evaluate(() => document.getElementById("icono").classList.add("cuadro"));
await p.locator("#icono").screenshot({ path: aqui("./apple-512.png") });

await p.goto(`file://${aqui("./compartir.html")}`, { waitUntil: "networkidle" });
await p.evaluate(() => document.fonts.ready);
await p.locator("#tarjeta").screenshot({ path: app("opengraph-image.png") });

await b.close();
console.log("rendered");

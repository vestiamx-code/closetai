// Renders <name>.html to <name>.png (full page). Default: 10-marketing-wireframe.
// Run from the repo root: node docs/evidencia/mockups/render-wireframe.mjs [name]
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const nombre = process.argv[2] ?? "10-marketing-wireframe";
const html = fileURLToPath(new URL(`./${nombre}.html`, import.meta.url));
const png = fileURLToPath(new URL(`./${nombre}.png`, import.meta.url));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 2000, height: 1000 }, deviceScaleFactor: 1.18 });
await page.goto(`file://${html}`);
await page.screenshot({ path: png, fullPage: true });
await browser.close();
console.log("wrote", png);

// Renders 10-marketing-wireframe.html to 10-marketing-wireframe.png (2x, full page).
// Run from the repo root: node docs/evidencia/mockups/render-wireframe.mjs
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const html = fileURLToPath(new URL("./10-marketing-wireframe.html", import.meta.url));
const png = fileURLToPath(new URL("./10-marketing-wireframe.png", import.meta.url));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 2000, height: 1000 }, deviceScaleFactor: 1.18 });
await page.goto(`file://${html}`);
await page.screenshot({ path: png, fullPage: true });
await browser.close();
console.log("wrote", png);

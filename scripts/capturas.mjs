/**
 * Toma capturas de la app funcionando, para la evidencia de la rúbrica.
 * Usa la cuenta demo que siembra `scripts/sembrar-demo.mjs`.
 *
 *   node scripts/capturas.mjs
 */
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium, devices } from "@playwright/test";

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const destino = path.join(raiz, "docs/evidencia/capturas");
const BASE = process.env.BASE_URL ?? "http://localhost:3000";

const navegador = await chromium.launch();
const contexto = await navegador.newContext({ ...devices["iPhone 14 Pro"] });
const page = await contexto.newPage();

async function captura(nombre, ruta, { esperar } = {}) {
  await page.goto(`${BASE}${ruta}`, { waitUntil: "networkidle" });
  if (esperar) await page.waitForSelector(esperar, { timeout: 15_000 });
  await page.screenshot({ path: path.join(destino, `${nombre}.png`), fullPage: true });
  console.log(`  ✓ ${nombre}.png`);
}

await captura("01-landing", "/");
await captura("02-registro", "/registro");
await captura("03-entrar", "/entrar");

// Iniciar sesión con la cuenta demo
await page.goto(`${BASE}/entrar`);
await page.getByLabel("Correo").fill(process.env.DEMO_EMAIL ?? "demo@closetai.lat");
await page.getByLabel("Contraseña").fill(process.env.DEMO_PASSWORD ?? "Demo-ClosetAI-2026");
await page.getByRole("button", { name: "Entrar" }).click();
await page.waitForURL(/\/closet/);

await captura("04-closet", "/closet", { esperar: "ul li a" });

const href = await page.locator("ul li a").first().getAttribute("href");
await captura("05-prenda", href);

await captura("06-subir", "/closet/subir");
await captura("07-perfil", "/perfil");

await navegador.close();
console.log(`\nCapturas en docs/evidencia/capturas/`);

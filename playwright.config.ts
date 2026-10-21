import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

// Se dice en voz alta contra qué se prueba. Sin esta línea, entre el 2 de
// septiembre y el 21 de octubre de 2026 la suite corrió contra un servidor de
// desarrollo local —conectado a la base de producción— mientras los documentos
// decían «contra producción». Nada en la salida lo delataba.
console.log(`[e2e] contra ${baseURL}${process.env.PLAYWRIGHT_BASE_URL ? "" : " (local: para el sitio real usa pnpm test:e2e:prod)"}`);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "html",
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    // La suite corre contra producción, donde vive el experimento A/B de la
    // portada. Esta cabecera marca cada petición como prueba para que no se cuente:
    // sin ella, cada corrida le sumaría decenas de visitas que no son de nadie.
    extraHTTPHeaders: { "x-cai-prueba": "1" },
  },
  // ClosetAI es mobile-first: la suite corre en móvil por defecto (§3.1).
  projects: [
    { name: "mobile-chrome", use: { ...devices["Pixel 7"] } },
    { name: "desktop-chrome", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : { command: "pnpm dev", url: "http://localhost:3000", reuseExistingServer: !process.env.CI },
});

import { readFileSync } from "node:fs";
import path from "node:path";

import { expect, type Page } from "@playwright/test";

/**
 * Carga `.env.local` en `process.env` para las pruebas e2e.
 *
 * Cada worker de Playwright es un proceso aparte y solo carga los archivos de
 * prueba que le tocan. Si esto vive dentro de un `.spec.ts`, cualquier otro spec
 * que dependa de las variables solo las ve cuando el reparto de workers los junta
 * por casualidad — y entonces una prueba pasa o falla según con quién le tocó
 * correr. Por eso está aquí: cada spec que lo necesite lo llama por su cuenta.
 */
export function cargarEnv() {
  try {
    const ruta = path.join(__dirname, "..", ".env.local");
    for (const linea of readFileSync(ruta, "utf8").split("\n")) {
      const m = /^([A-Z0-9_]+)=(.*)$/.exec(linea.trim());
      if (!m) continue;
      const valor = m[2].split("#")[0].trim();
      if (valor && !process.env[m[1]]) process.env[m[1]] = valor;
    }
  } catch {
    /* sin .env.local: las pruebas que necesiten credenciales se saltan solas */
  }
}

/**
 * ¿El modelo de razonamiento tiene cuota disponible?
 *
 * El nivel gratuito de Gemini tiene un tope diario por modelo. Cuando se agota,
 * las pruebas que dependen del estilista o de `/core` fallan — pero no por un
 * error del código: el proveedor devuelve 429 y no hay nada que arreglar del
 * lado de la app.
 *
 * Estas pruebas se **saltan** con un motivo explícito en vez de fallar. Saltarse
 * no es lo mismo que pasar: el reporte dice en voz alta que no se comprobaron, y
 * nadie se lleva un verde que no se ganó.
 */
export async function hayCuotaDeRazonamiento(): Promise<boolean> {
  const llave = process.env.GEMINI_API_KEY;
  const modelo = process.env.GEMINI_MODEL_REASONING;
  if (!llave || !modelo) return false;

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`,
      {
        method: "POST",
        headers: { "x-goog-api-key": llave, "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: "ok" }] }] }),
      },
    );
    return r.status !== 429;
  } catch {
    return false;
  }
}

/**
 * Espera a que el navegador tenga ya la cookie de sesión.
 *
 * Al entrar, la URL cambia a `/closet` **antes** de que la cookie esté aplicada:
 * la navegación la hace el router con la carga que viene en la misma respuesta de
 * la Server Action, y las cabeceras `Set-Cookie` se procesan por su lado. El hueco
 * dura unos 300 ms. Navegar dentro de ese hueco devuelve 307 a `/entrar` y se ve
 * idéntico a una sesión caída — que es justo el bug que estas pruebas vigilan.
 *
 * Ninguna persona alcanza a hacer clic en ese hueco; Playwright sí.
 *
 * Esto es la **precondición** de las pruebas, no su tesis. Lo que cada una afirma
 * después sigue siendo lo mismo: que a partir de aquí ninguna navegación tira la
 * sesión. Y de paso afirma algo que antes nadie comprobaba — que entrar deja
 * cookie. Si un día no la dejara, esto falla con ese motivo escrito.
 */
export async function esperarCookieDeSesion(page: Page) {
  await expect
    .poll(
      async () =>
        (await page.context().cookies()).filter((c) => /^sb-.*-auth-token(\.\d+)?$/.test(c.name))
          .length,
      { message: "entrar no dejó cookie de sesión", timeout: 15_000 },
    )
    .toBeGreaterThan(0);
}

/** Entrar y no devolver el control hasta que la sesión esté aplicada. */
export async function entrarConSesionLista(page: Page, correo: string, contrasena: string) {
  await page.goto("/entrar");
  await page.getByLabel("Correo").fill(correo);
  await page.getByLabel("Contraseña").fill(contrasena);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/closet/);
  await esperarCookieDeSesion(page);
}

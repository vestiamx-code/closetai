import { readFileSync } from "node:fs";
import path from "node:path";

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

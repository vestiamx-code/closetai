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

// @vitest-environment node
/**
 * Prueba EN VIVO: llama a la API real y, en el caso del try-on, cuesta dinero.
 * No corre en `pnpm test:unit` ni en CI. Para correrla:
 *
 *   PRUEBAS_VIVAS=1 pnpm test:unit
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

/**
 * Prueba de integración real contra la API de Gemini.
 * Se salta sola si no hay GEMINI_API_KEY, para que el CI no dependa de secretos
 * ni gaste cuota. En local, con `.env.local` cargado, sí llama al modelo.
 */

function loadEnvLocal() {
  try {
    const path = fileURLToPath(new URL("../../../.env.local", import.meta.url));
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
      if (!match) continue;
      const value = match[2].split("#")[0].trim();
      if (value && !process.env[match[1]]) process.env[match[1]] = value;
    }
  } catch {
    /* sin .env.local: la prueba se salta */
  }
}
loadEnvLocal();

const hasKey = Boolean(process.env.GEMINI_API_KEY);

describe.skipIf(!hasKey)("catalogGarment contra Gemini real", () => {
  it("cataloga una playera de rayas y respeta el contrato", { timeout: 90_000 }, async () => {
    const { catalogGarment } = await import("./gemini");
    const image = readFileSync(
      fileURLToPath(new URL("../../tests/fixtures/playera-rayas.png", import.meta.url)),
    ).toString("base64");

    const result = await catalogGarment(image, "image/png");

    // Lo que se imprime es evidencia: queda en la salida del test.
    console.log("respuesta del modelo:", JSON.stringify(result, null, 2));

    expect(result.meta.model).toBe(process.env.GEMINI_MODEL_VISION);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.garment.categoria).toBe("top");
    expect(result.garment.patron).toBe("rayas");
    expect(result.garment.colores.join(" ").toLowerCase()).toMatch(/azul|marino|blanco|crema/);
    expect(result.garment.confianza).toBeGreaterThan(0.3);
  });
});

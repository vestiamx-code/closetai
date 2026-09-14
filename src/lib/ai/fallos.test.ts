import { describe, expect, it } from "vitest";

import { clasificarFalloDelProveedor } from "./fallos";

describe("clasificarFalloDelProveedor", () => {
  it("reconoce la cuota agotada del nivel gratuito", () => {
    const texto = '{"error":{"code":429,"message":"You exceeded your current quota","status":"RESOURCE_EXHAUSTED"}}';
    expect(clasificarFalloDelProveedor(texto)).toBe("cuota");
  });

  it("reconoce el 503 que devolvió Gemini el 14-sep-2026 — antes culpaba a la pregunta", () => {
    // Texto literal del error que hizo fallar la prueba e2e de /research en producción.
    const texto =
      '{"error":{"code":503,"message":"This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.","status":"UNAVAILABLE"}}';
    expect(clasificarFalloDelProveedor(texto)).toBe("saturado");
  });

  it("no confunde un error de la petición con una caída del proveedor", () => {
    const texto = '{"error":{"code":400,"message":"Invalid JSON payload received.","status":"INVALID_ARGUMENT"}}';
    expect(clasificarFalloDelProveedor(texto)).toBeNull();
  });

  it("no se deja engañar por números que solo contienen 503 o 429", () => {
    expect(clasificarFalloDelProveedor("El prompt usó 5030 tokens y 14290 caracteres")).toBeNull();
  });
});

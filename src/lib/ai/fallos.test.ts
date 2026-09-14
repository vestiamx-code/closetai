import { describe, expect, it } from "vitest";

import { clasificarFalloDelProveedor, conModeloDeRespaldo, esTiempoAgotado } from "./fallos";

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

const MODELOS = { principal: "gemini-3.5-flash", respaldo: "gemini-3.5-flash-lite" };
const ERROR_503 =
  '{"error":{"code":503,"message":"This model is currently experiencing high demand.","status":"UNAVAILABLE"}}';

describe("conModeloDeRespaldo", () => {
  it("si el principal contesta, ni se toca el respaldo", async () => {
    const llamados: string[] = [];
    const r = await conModeloDeRespaldo(MODELOS, async (m) => (llamados.push(m), "ok"));
    expect(r).toEqual({ resultado: "ok", modelo: "gemini-3.5-flash", usoRespaldo: false });
    expect(llamados).toEqual(["gemini-3.5-flash"]);
  });

  it("si el principal está saturado (503), contesta el respaldo y queda registrado cuál fue", async () => {
    const llamados: string[] = [];
    const r = await conModeloDeRespaldo(MODELOS, async (m) => {
      llamados.push(m);
      if (m === "gemini-3.5-flash") throw new Error(ERROR_503);
      return "ok";
    });
    expect(r).toEqual({ resultado: "ok", modelo: "gemini-3.5-flash-lite", usoRespaldo: true });
    expect(llamados).toEqual(["gemini-3.5-flash", "gemini-3.5-flash-lite"]);
  });

  it("si el principal no contesta a tiempo, contesta el respaldo", async () => {
    const r = await conModeloDeRespaldo(
      MODELOS,
      (m, senal) =>
        m === "gemini-3.5-flash"
          ? new Promise<string>((_, rechazar) => senal.addEventListener("abort", () => rechazar(senal.reason)))
          : Promise.resolve("ok"),
      30,
    );
    expect(r.modelo).toBe("gemini-3.5-flash-lite");
  });

  it("si la petición está mal (400), no esconde el error cambiando de modelo", async () => {
    const llamados: string[] = [];
    await expect(
      conModeloDeRespaldo(MODELOS, async (m) => {
        llamados.push(m);
        throw new Error('{"error":{"code":400,"status":"INVALID_ARGUMENT"}}');
      }),
    ).rejects.toThrow(/INVALID_ARGUMENT/);
    expect(llamados).toEqual(["gemini-3.5-flash"]);
  });
});

describe("esTiempoAgotado", () => {
  it("reconoce la cancelación por tiempo y no otros errores", () => {
    expect(esTiempoAgotado(Object.assign(new Error("signal timed out"), { name: "TimeoutError" }))).toBe(true);
    expect(esTiempoAgotado(new Error("Invalid JSON payload"))).toBe(false);
  });
});

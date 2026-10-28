// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The stylist's wiring to the backup model. `conModeloDeRespaldo` has its own
 * tests (fallos.test.ts); these check that `suggestOutfits` actually goes
 * through it. Until Oct 28, 2026 it didn't, and a day without quota on the main
 * model meant "the stylist couldn't put anything together".
 */

const llamadas: string[] = [];
let comportamiento: (modelo: string) => Promise<{ text: string }>;

vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = {
      generateContent: (pedido: { model: string }) => {
        llamadas.push(pedido.model);
        return comportamiento(pedido.model);
      },
    };
  },
}));

process.env.GEMINI_API_KEY = "test";
process.env.GEMINI_MODEL_REASONING = "principal";
process.env.GEMINI_MODEL_REASONING_FALLBACK = "respaldo";

const { suggestOutfits } = await import("./gemini");
const { PERFIL_VACIO } = await import("./outfits");

const PRENDAS = [
  { id: "a1", subcategory: "white t-shirt", category: "top", colors: ["white"], styles: ["casual"], seasons: ["todo el año"], occasions: ["diario"] },
  { id: "b2", subcategory: "blue jeans", category: "bottom", colors: ["blue"], styles: ["casual"], seasons: ["todo el año"], occasions: ["diario"] },
];
const RESPUESTA = JSON.stringify({
  outfits: [{ garment_ids: ["a1", "b2"], title: "Easy weekend", explanation: "White and blue always work.", tip: "Roll the cuffs." }],
});
const contexto = { prendas: PRENDAS, perfil: PERFIL_VACIO, clima: null, ocasion: null, feedbackReciente: [] };

beforeEach(() => {
  llamadas.length = 0;
});

describe("suggestOutfits and the backup model", () => {
  it("when the main model is out of quota (429), the backup answers and is recorded", async () => {
    comportamiento = async (m) => {
      if (m === "principal") throw new Error('{"error":{"code":429,"status":"RESOURCE_EXHAUSTED"}}');
      return { text: RESPUESTA };
    };
    const r = await suggestOutfits(contexto as never);
    expect(r.ok).toBe(true);
    expect(r.meta.model).toBe("respaldo");
    expect(llamadas).toEqual(["principal", "respaldo"]);
  });

  it("when the main model answers, the backup is never called", async () => {
    comportamiento = async () => ({ text: RESPUESTA });
    const r = await suggestOutfits(contexto as never);
    expect(r.ok).toBe(true);
    expect(r.meta.model).toBe("principal");
    expect(llamadas).toEqual(["principal"]);
  });

  it("a bad request (400) is not hidden by switching models", async () => {
    comportamiento = async () => {
      throw new Error('{"error":{"code":400,"status":"INVALID_ARGUMENT"}}');
    };
    const r = await suggestOutfits(contexto as never);
    expect(r.ok).toBe(false);
    expect(llamadas).toEqual(["principal"]);
  });
});

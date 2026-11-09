import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { AGENTES, PROMPTS } from "./agentes";

/**
 * The agent map (/demo) and the prompt library (/docs) both read lib/agentes.ts.
 * These cases keep that file honest against the code that actually runs.
 */
const CARPETA = join(__dirname, "ai", "prompts");
const GEMINI = readFileSync(join(__dirname, "ai", "gemini.ts"), "utf8");

/** Every `export const X_PROMPT = ` in the prompts folder. */
function promptsEnProduccion() {
  return readdirSync(CARPETA)
    .filter((f) => f.endsWith(".ts"))
    .flatMap((f) =>
      [...readFileSync(join(CARPETA, f), "utf8").matchAll(/export const (\w+_PROMPT) = /g)].map((m) => ({
        nombre: m[1],
        archivo: f,
      })),
    );
}

describe("agent map and prompt library", () => {
  it("lists every production prompt exactly once", () => {
    const enProduccion = promptsEnProduccion();
    expect(enProduccion.length).toBeGreaterThanOrEqual(8);
    expect(PROMPTS).toHaveLength(enProduccion.length);
    // The same prompts, not just the same count: agentes.ts imports each one by name.
    const fuenteAgentes = readFileSync(join(__dirname, "agentes.ts"), "utf8");
    for (const { nombre, archivo } of enProduccion) {
      expect(fuenteAgentes, `${nombre} (${archivo}) is missing from the map`).toMatch(
        new RegExp(`texto: ${nombre},`),
      );
    }
    expect(new Set(PROMPTS.map((p) => p.texto)).size).toBe(PROMPTS.length);
  });

  it("only lists prompts the model is actually sent", () => {
    for (const { nombre } of promptsEnProduccion()) {
      // Imported isn't enough: it has to go into a request to the model.
      expect(GEMINI, `${nombre} is never sent in gemini.ts`).toMatch(
        new RegExp(`(\\$\\{${nombre}\\}|text: ${nombre}\\b)`),
      );
    }
  });

  it("gives every agent its guardrail and its human checkpoint", () => {
    const ids = AGENTES.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const a of AGENTES) {
      expect(a.guardrail.length, a.id).toBeGreaterThan(20);
      expect(a.humano.length, a.id).toBeGreaterThan(15);
      expect(a.ruta, a.id).toMatch(/^\//);
    }
  });
});

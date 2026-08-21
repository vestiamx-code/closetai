// @vitest-environment node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { PERFIL_VACIO } from "./outfits";

function cargarEnv() {
  try {
    const ruta = fileURLToPath(new URL("../../../.env.local", import.meta.url));
    for (const linea of readFileSync(ruta, "utf8").split("\n")) {
      const m = /^([A-Z0-9_]+)=(.*)$/.exec(linea.trim());
      if (!m) continue;
      const valor = m[2].split("#")[0].trim();
      if (valor && !process.env[m[1]]) process.env[m[1]] = valor;
    }
  } catch {
    /* sin .env.local */
  }
}
cargarEnv();

const CLOSET = [
  { id: "g1", subcategoria: "playera de rayas", categoria: "top", colores: ["azul marino", "blanco"], estilos: ["casual"], temporadas: ["verano"], ocasiones: ["diario"] },
  { id: "g2", subcategoria: "jeans rectos", categoria: "bottom", colores: ["azul"], estilos: ["casual"], temporadas: ["todo el año"], ocasiones: ["diario"] },
  { id: "g3", subcategoria: "blazer beige", categoria: "abrigo", colores: ["beige"], estilos: ["formal", "minimalista"], temporadas: ["otoño"], ocasiones: ["oficina"] },
  { id: "g4", subcategoria: "vestido acampanado", categoria: "vestido", colores: ["vino"], estilos: ["romántico"], temporadas: ["primavera"], ocasiones: ["cita"] },
  { id: "g5", subcategoria: "tenis blancos", categoria: "calzado", colores: ["blanco"], estilos: ["casual"], temporadas: ["todo el año"], ocasiones: ["diario"] },
  { id: "g6", subcategoria: "bolsa de mano", categoria: "bolsa", colores: ["café"], estilos: ["elegante"], temporadas: ["todo el año"], ocasiones: ["oficina"] },
];

describe.skipIf(!process.env.GEMINI_API_KEY)("estilista contra Gemini real", () => {
  it("arma outfits usando solo prendas del clóset", { timeout: 120_000 }, async () => {
    const { suggestOutfits } = await import("./gemini");

    const r = await suggestOutfits({
      prendas: CLOSET,
      perfil: PERFIL_VACIO,
      clima: { ciudad: "Ciudad de México", temperatura: 22, descripcion: "despejado" },
      ocasion: null,
      feedbackReciente: [],
    });

    console.log("outfits:", JSON.stringify(r, null, 2));
    expect(r.ok).toBe(true);
    if (!r.ok) return;

    const ids = new Set(CLOSET.map((p) => p.id));
    for (const outfit of r.response.outfits) {
      // Lo más importante: nunca puede inventar una prenda.
      for (const id of outfit.garment_ids) expect(ids.has(id)).toBe(true);
      expect(outfit.explanation.length).toBeGreaterThan(30);
      expect(outfit.title.length).toBeGreaterThan(0);
    }
  });

  it("respeta un color vetado del perfil", { timeout: 120_000 }, async () => {
    const { suggestOutfits } = await import("./gemini");

    const r = await suggestOutfits({
      prendas: CLOSET,
      perfil: {
        ...PERFIL_VACIO,
        colores_vetados: [
          { valor: "vino", confianza: 0.95, evidencia: "rechazó cinco outfits con vino" },
        ],
        estilos_rechazados: [
          { valor: "romántico", confianza: 0.9, evidencia: "rechazó todo lo romántico" },
        ],
      },
      clima: { ciudad: "Ciudad de México", temperatura: 22, descripcion: "despejado" },
      ocasion: null,
      feedbackReciente: ["No es mi estilo"],
    });

    expect(r.ok).toBe(true);
    if (!r.ok) return;

    // g4 es el vestido vino y romántico: no debería aparecer en ningún outfit.
    const usadas = r.response.outfits.flatMap((o) => o.garment_ids);
    console.log("prendas usadas con vino vetado:", usadas);
    expect(usadas).not.toContain("g4");
  });
});

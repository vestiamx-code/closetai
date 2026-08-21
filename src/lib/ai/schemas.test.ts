import { describe, expect, it } from "vitest";
import { parseGarmentCatalog, stripCodeFence } from "./schemas";

const validGarment = {
  categoria: "top",
  subcategoria: "playera de algodón",
  colores: ["blanco", "azul marino"],
  patron: "rayas",
  material_aparente: "algodón",
  estilos: ["casual", "minimalista"],
  temporadas: ["primavera", "verano"],
  ocasiones: ["diario"],
  notas_styling: "Va con jeans claros y tenis blancos.",
  confianza: 0.87,
};

describe("stripCodeFence", () => {
  it("quita el envoltorio ```json que añaden los modelos", () => {
    expect(stripCodeFence('```json\n{"a":1}\n```')).toBe('{"a":1}');
  });

  it("deja intacto el JSON sin envoltorio", () => {
    expect(stripCodeFence('  {"a":1}  ')).toBe('{"a":1}');
  });
});

describe("parseGarmentCatalog", () => {
  it("acepta una catalogación válida", () => {
    const result = parseGarmentCatalog(JSON.stringify(validGarment));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.garment.subcategoria).toBe("playera de algodón");
      expect(result.garment.colores).toHaveLength(2);
    }
  });

  it("acepta una catalogación envuelta en bloque de código", () => {
    const result = parseGarmentCatalog("```json\n" + JSON.stringify(validGarment) + "\n```");
    expect(result.ok).toBe(true);
  });

  it("distingue el rechazo del modelo de un error de formato", () => {
    const result = parseGarmentCatalog('{"error":"la imagen no es una prenda"}');
    expect(result).toEqual({
      ok: false,
      reason: "rejected",
      message: "la imagen no es una prenda",
    });
  });

  it("rechaza una categoría que no está en el catálogo", () => {
    const result = parseGarmentCatalog(
      JSON.stringify({ ...validGarment, categoria: "sombrero" }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("unparseable");
  });

  it("rechaza una confianza fuera de rango", () => {
    const result = parseGarmentCatalog(JSON.stringify({ ...validGarment, confianza: 1.4 }));
    expect(result.ok).toBe(false);
  });

  it("rechaza más de 3 colores: el esquema promete 1-3 dominantes", () => {
    const result = parseGarmentCatalog(
      JSON.stringify({ ...validGarment, colores: ["a", "b", "c", "d"] }),
    );
    expect(result.ok).toBe(false);
  });

  it("acepta una respuesta envuelta en un arreglo de un elemento", () => {
    // Visto en producción: gemini-3.5-flash-lite a veces envuelve el objeto.
    const result = parseGarmentCatalog(JSON.stringify([validGarment]));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.garment.subcategoria).toBe("playera de algodón");
  });

  it("rechaza un arreglo con varias prendas: una foto, una prenda", () => {
    const result = parseGarmentCatalog(JSON.stringify([validGarment, validGarment]));
    expect(result.ok).toBe(false);
  });

  it("no lanza cuando el modelo devuelve texto suelto", () => {
    const result = parseGarmentCatalog("Claro, aquí tienes la prenda:");
    expect(result).toEqual({
      ok: false,
      reason: "unparseable",
      message: "el modelo no devolvió JSON",
    });
  });
});

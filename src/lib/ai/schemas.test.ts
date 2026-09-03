import { describe, expect, it } from "vitest";
import { parseGarmentCatalog, stripCodeFence,
  parseStyleCore,
} from "./schemas";

const validGarment = {
  categoria: "top",
  tipo_de_foto: "prenda_sola",
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

  it("exige tipo_de_foto: sin él, el try-on adivina cómo leer la prenda", () => {
    const sinTipo: Record<string, unknown> = { ...validGarment };
    delete sinTipo.tipo_de_foto;
    const result = parseGarmentCatalog(JSON.stringify(sinTipo));
    expect(result.ok).toBe(false);
  });

  it("rechaza un tipo_de_foto inventado", () => {
    const result = parseGarmentCatalog(
      JSON.stringify({ ...validGarment, tipo_de_foto: "maniqui" }),
    );
    expect(result.ok).toBe(false);
  });
});

/* ---------------- Núcleo de estilo · Semana 1 ---------------- */

const nucleoValido = {
  esencia: "Cómoda pero arreglada, con base neutra y siluetas amplias.",
  principios: ["Comodidad primero", "Neutros como base", "Una prenda estructurada encima"],
  paleta: ["negro", "beige", "blanco"],
  siluetas: ["pantalón ancho", "saco recto"],
  evitar: ["entallado", "estampados grandes"],
  regla: "Si no me puedo sentar cómoda, no me lo pongo.",
  confianza: 0.78,
  falta: "",
};

describe("parseStyleCore", () => {
  it("acepta un núcleo bien formado", () => {
    const r = parseStyleCore(JSON.stringify(nucleoValido));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.core.principios).toHaveLength(3);
  });

  it("desenvuelve un arreglo de un elemento, como ya devolvió el modelo en producción", () => {
    const r = parseStyleCore(JSON.stringify([nucleoValido]));
    expect(r.ok).toBe(true);
  });

  it("rechaza un arreglo con varios núcleos: una persona, un núcleo", () => {
    const r = parseStyleCore(JSON.stringify([nucleoValido, nucleoValido]));
    expect(r.ok).toBe(false);
  });

  it("rechaza menos de 2 principios: con uno solo no es un núcleo, es una frase", () => {
    const r = parseStyleCore(JSON.stringify({ ...nucleoValido, principios: ["Comodidad"] }));
    expect(r.ok).toBe(false);
  });

  it("rechaza más de 5 principios: la tarjeta deja de leerse", () => {
    const r = parseStyleCore(
      JSON.stringify({ ...nucleoValido, principios: ["a", "b", "c", "d", "e", "f"] }),
    );
    expect(r.ok).toBe(false);
  });

  it("rechaza una confianza fuera de rango", () => {
    const r = parseStyleCore(JSON.stringify({ ...nucleoValido, confianza: 1.4 }));
    expect(r.ok).toBe(false);
  });

  it("distingue el rechazo del modelo de un error de formato", () => {
    const r = parseStyleCore(JSON.stringify({ error: "Eso no habla de ropa." }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("rejected");
  });

  it("no lanza cuando el modelo devuelve texto suelto", () => {
    expect(() => parseStyleCore("lo siento, no puedo")).not.toThrow();
    expect(parseStyleCore("lo siento, no puedo").ok).toBe(false);
  });
});


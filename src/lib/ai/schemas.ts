import { z } from "zod";

/**
 * Contratos de salida de los modelos. Un LLM puede devolver cualquier cosa:
 * nada entra a la base de datos sin pasar por aquí.
 */

export const garmentCategorySchema = z.enum([
  "top", "bottom", "vestido", "abrigo", "calzado", "accesorio", "bolsa", "otro",
]);

export const garmentPatternSchema = z.enum([
  "liso", "rayas", "cuadros", "floral", "estampado", "animal print", "otro",
]);

export const garmentStyleSchema = z.enum([
  "casual", "formal", "streetwear", "deportivo", "elegante",
  "boho", "minimalista", "romántico", "edgy",
]);

export const seasonSchema = z.enum([
  "primavera", "verano", "otoño", "invierno", "todo el año",
]);

export const occasionSchema = z.enum([
  "diario", "oficina", "fiesta", "cita", "deporte", "playa", "evento formal",
]);

/** Catalogación exitosa de una prenda (Apéndice A1). */
/**
 * Cómo está fotografiada la prenda. No es un dato cosmético: el modelo de prueba
 * virtual necesita saberlo (`garment_photo_type`), y adivinarlo mal deforma el
 * render. No se puede deducir de si hay recorte — quitarle el fondo a una foto
 * de alguien con la sudadera puesta deja a la persona recortada, no la sudadera.
 */
export const garmentPhotoTypeSchema = z.enum(["prenda_sola", "puesta"]);

export const garmentCatalogSchema = z.object({
  categoria: garmentCategorySchema,
  tipo_de_foto: garmentPhotoTypeSchema,
  subcategoria: z.string().min(1),
  colores: z.array(z.string().min(1)).min(1).max(3),
  patron: garmentPatternSchema,
  material_aparente: z.string(),
  estilos: z.array(garmentStyleSchema).min(1).max(3),
  temporadas: z.array(seasonSchema).min(1),
  ocasiones: z.array(occasionSchema).min(1),
  notas_styling: z.string(),
  confianza: z.number().min(0).max(1),
});

/** El modelo rechaza la imagen: no es ropa, o es contenido inapropiado. */
export const garmentCatalogRejectionSchema = z.object({
  error: z.string().min(1),
});

export type GarmentCatalog = z.infer<typeof garmentCatalogSchema>;
export type GarmentCatalogRejection = z.infer<typeof garmentCatalogRejectionSchema>;

export type GarmentCatalogResult =
  | { ok: true; garment: GarmentCatalog }
  | { ok: false; reason: "rejected"; message: string }
  | { ok: false; reason: "unparseable"; message: string };

/**
 * Quita el envoltorio ```json que los modelos añaden aunque se les pida JSON pelón.
 */
export function stripCodeFence(raw: string): string {
  const trimmed = raw.trim();
  const fenced = /^```(?:json|JSON)?\s*\n?([\s\S]*?)\n?```$/.exec(trimmed);
  return fenced ? fenced[1].trim() : trimmed;
}

/**
 * Los modelos a veces envuelven una sola respuesta en un arreglo, aunque se les
 * pida un objeto. Visto en producción el 20-ago-2026 con gemini-3.5-flash-lite.
 */
function desenvolver(valor: unknown): unknown {
  return Array.isArray(valor) && valor.length === 1 ? valor[0] : valor;
}

/**
 * Única puerta de entrada de la salida del catalogador. Nunca lanza:
 * el pipeline de subida marca la prenda como `failed` y sigue con las demás.
 */
export function parseGarmentCatalog(raw: string): GarmentCatalogResult {
  let parsed: unknown;
  try {
    parsed = desenvolver(JSON.parse(stripCodeFence(raw)));
  } catch {
    return { ok: false, reason: "unparseable", message: "el modelo no devolvió JSON" };
  }

  const rejection = garmentCatalogRejectionSchema.safeParse(parsed);
  if (rejection.success) {
    return { ok: false, reason: "rejected", message: rejection.data.error };
  }

  const garment = garmentCatalogSchema.safeParse(parsed);
  if (!garment.success) {
    return {
      ok: false,
      reason: "unparseable",
      message: garment.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
    };
  }

  return { ok: true, garment: garment.data };
}

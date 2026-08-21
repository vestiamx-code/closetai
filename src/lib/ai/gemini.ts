import "server-only";

import { GoogleGenAI } from "@google/genai";

import { CATALOG_GARMENT_PROMPT, CATALOG_GARMENT_PROMPT_VERSION } from "./prompts/catalog-garment";
import { parseGarmentCatalog, type GarmentCatalogResult } from "./schemas";

/**
 * Adapter del proveedor de IA. Todo el resto de la app habla con este módulo,
 * nunca con Google directamente: cuando cambie el modelo (o el proveedor), el
 * cambio vive aquí y en las variables de entorno, no repartido por el código.
 *
 * Lección ya cobrada: el 20-ago-2026 Google retiró `gemini-2.5-flash-lite` para
 * cuentas nuevas. Migrar costó una línea de env var gracias a esta capa.
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable de entorno ${name}`);
  return value;
}

let client: GoogleGenAI | null = null;
function getClient(): GoogleGenAI {
  if (!client) client = new GoogleGenAI({ apiKey: requireEnv("GEMINI_API_KEY") });
  return client;
}

export const MODELS = {
  /** Visión: catalogar prendas a partir de una foto. El más barato que sirve. */
  vision: () => process.env.GEMINI_MODEL_VISION ?? "gemini-3.5-flash-lite",
  /** Razonamiento: estilista, chat y actualización del perfil de estilo. */
  reasoning: () => process.env.GEMINI_MODEL_REASONING ?? "gemini-3.5-flash",
  /** Imagen: mockups y modo explorar. Requiere facturación activa. */
  image: () => process.env.GEMINI_MODEL_IMAGE ?? "gemini-3.1-flash-image",
};

/** Costo estimado por operación, para alimentar la tabla `api_costs` (§4.4). */
export const EST_COST_USD = {
  catalogGarment: 0.0003,
} as const;

/**
 * Esquema que se le impone al modelo. Espeja el Apéndice A1 y el contrato zod.
 * `error` queda fuera a propósito: el rechazo ("esto no es una prenda") se
 * detecta por el texto libre, no por esta forma.
 */
const ESQUEMA_PRENDA = {
  type: "object",
  properties: {
    categoria: { type: "string", enum: ["top", "bottom", "vestido", "abrigo", "calzado", "accesorio", "bolsa", "otro"] },
    subcategoria: { type: "string" },
    colores: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 3 },
    patron: { type: "string", enum: ["liso", "rayas", "cuadros", "floral", "estampado", "animal print", "otro"] },
    material_aparente: { type: "string" },
    estilos: {
      type: "array",
      items: { type: "string", enum: ["casual", "formal", "streetwear", "deportivo", "elegante", "boho", "minimalista", "romántico", "edgy"] },
      minItems: 1,
      maxItems: 3,
    },
    temporadas: { type: "array", items: { type: "string", enum: ["primavera", "verano", "otoño", "invierno", "todo el año"] }, minItems: 1 },
    ocasiones: { type: "array", items: { type: "string", enum: ["diario", "oficina", "fiesta", "cita", "deporte", "playa", "evento formal"] }, minItems: 1 },
    notas_styling: { type: "string" },
    confianza: { type: "number" },
  },
  required: ["categoria", "subcategoria", "colores", "patron", "material_aparente", "estilos", "temporadas", "ocasiones", "notas_styling", "confianza"],
} as const;

export type CatalogGarmentResult = GarmentCatalogResult & {
  meta: { model: string; promptVersion: number; estCostUsd: number };
};

/**
 * Cataloga una prenda a partir de su foto (Apéndice A1).
 * Nunca lanza por culpa del modelo: devuelve un resultado tipado que el
 * pipeline de subida usa para marcar la prenda como lista o como fallida.
 */
export async function catalogGarment(
  imageBase64: string,
  mimeType = "image/webp",
): Promise<CatalogGarmentResult> {
  const model = MODELS.vision();
  const meta = {
    model,
    promptVersion: CATALOG_GARMENT_PROMPT_VERSION,
    estCostUsd: EST_COST_USD.catalogGarment,
  };

  let raw: string;
  try {
    const response = await getClient().models.generateContent({
      model,
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType, data: imageBase64 } },
            { text: CATALOG_GARMENT_PROMPT },
          ],
        },
      ],
      config: {
        // Se le entrega el esquema exacto para que no tenga margen de desviarse.
        // Sin esto, gemini-3.5-flash-lite devolvía a veces un ARREGLO de un
        // elemento en vez del objeto (visto en producción el 20-ago-2026).
        // El parser de schemas.ts sigue siendo la red de seguridad: ningún
        // modelo garantiza respetar el esquema al 100%.
        responseMimeType: "application/json",
        responseJsonSchema: ESQUEMA_PRENDA,
        temperature: 0.2,
      },
    });
    raw = response.text ?? "";
  } catch (error) {
    return {
      ok: false,
      reason: "unparseable",
      message: `el proveedor falló: ${error instanceof Error ? error.message : String(error)}`,
      meta,
    };
  }

  return { ...parseGarmentCatalog(raw), meta };
}

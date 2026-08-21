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
        // Pedimos JSON de forma explícita; el parser de schemas.ts sigue siendo
        // la red de seguridad, porque un modelo puede ignorar esto.
        responseMimeType: "application/json",
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

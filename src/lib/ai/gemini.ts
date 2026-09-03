import "server-only";

import { GoogleGenAI } from "@google/genai";

import { AVATAR_PROMPT, AVATAR_PROMPT_VERSION } from "./prompts/avatar";
import { GAPS_PROMPT, GAPS_PROMPT_VERSION } from "./prompts/gaps";
import { CATALOG_GARMENT_PROMPT, CATALOG_GARMENT_PROMPT_VERSION } from "./prompts/catalog-garment";
import { CORE_PROMPT, CORE_PROMPT_VERSION } from "./prompts/core";
import {
  PROFILE_PROMPT,
  PROFILE_PROMPT_VERSION,
  STYLIST_PROMPT,
  STYLIST_PROMPT_VERSION,
} from "./prompts/stylist";
import {
  parseStyleProfile,
  parseStylistResponse,
  type StyleProfile,
  type StylistResult,
} from "./outfits";
import { parseGarmentCatalog, parseStyleCore, type GarmentCatalogResult, type StyleCoreResult } from "./schemas";

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
  suggestOutfits: 0.0008,
  validateAvatar: 0.0003,
  analyzeGaps: 0.0008,
  updateStyleProfile: 0.0005,
  extractCore: 0.0006,
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
    tipo_de_foto: { type: "string", enum: ["prenda_sola", "puesta"] },
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
  required: ["categoria", "tipo_de_foto", "subcategoria", "colores", "patron", "material_aparente", "estilos", "temporadas", "ocasiones", "notas_styling", "confianza"],
} as const;

export type CatalogGarmentResult = GarmentCatalogResult & {
  meta: { model: string; promptVersion: number; estCostUsd: number };
};

/**
 * Cataloga una prenda a partir de su foto (Apéndice A1).
 * Nunca lanza por culpa del modelo: devuelve un resultado tipado que el
 * pipeline de subida usa para marcar la prenda como lista o como fallida.
 */
/**
 * Reintenta una llamada cuando el proveedor responde 429.
 *
 * El nivel gratuito de Gemini permite 20 peticiones por minuto. Al pasarse,
 * devuelve `RESOURCE_EXHAUSTED` con un `retryDelay` — y hasta hoy eso llegaba a
 * la usuaria como "el estilista no pudo armar nada", que es mentira: sí podía,
 * solo había que esperar cuarenta segundos.
 *
 * Se respeta el retraso que pide Google en vez de inventar uno. Dos reintentos:
 * más que eso deja a alguien mirando un botón deshabilitado demasiado tiempo, y
 * a esa altura conviene más devolver el error.
 */
async function conReintentoSiHayCuota<T>(llamada: () => Promise<T>): Promise<T> {
  const MAX_INTENTOS = 3;

  for (let intento = 1; ; intento++) {
    try {
      return await llamada();
    } catch (error) {
      const texto = error instanceof Error ? error.message : String(error);
      const esCuota = texto.includes("429") || texto.includes("RESOURCE_EXHAUSTED");
      if (!esCuota || intento >= MAX_INTENTOS) throw error;

      // Google dice cuánto esperar; si no lo dice, se usa una espera creciente.
      const pedido = /"?retryDelay"?:\s*"?(\d+(?:\.\d+)?)s/.exec(texto);
      const segundos = pedido ? Math.ceil(Number(pedido[1])) : intento * 20;
      const espera = Math.min(segundos, 45) * 1000;

      console.warn(`[gemini] cuota agotada, reintento ${intento} en ${espera / 1000}s`);
      await new Promise((listo) => setTimeout(listo, espera));
    }
  }
}

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
    const response = await conReintentoSiHayCuota(() =>
      getClient().models.generateContent({
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
    }));
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

/** Prenda tal como se le presenta al estilista: lo mínimo para decidir. */
export type PrendaParaEstilista = {
  id: string;
  subcategoria: string | null;
  categoria: string | null;
  colores: string[];
  estilos: string[];
  temporadas: string[];
  ocasiones: string[];
};

export type ContextoEstilista = {
  prendas: PrendaParaEstilista[];
  perfil: StyleProfile;
  clima: { ciudad: string; temperatura: number; descripcion: string } | null;
  ocasion: string | null;
  /** Últimos rechazos, para no volver a proponer lo mismo. */
  feedbackReciente: string[];
};

export type SuggestOutfitsResult = StylistResult & {
  meta: { model: string; promptVersion: number; estCostUsd: number };
};

/**
 * Genera outfits con el clóset real de la usuaria (Apéndice A2).
 * Nunca lanza: la pantalla muestra un mensaje honesto si el modelo falla.
 */
export async function suggestOutfits(ctx: ContextoEstilista): Promise<SuggestOutfitsResult> {
  const model = MODELS.reasoning();
  const meta = {
    model,
    promptVersion: STYLIST_PROMPT_VERSION,
    estCostUsd: EST_COST_USD.suggestOutfits,
  };

  const contexto = [
    `CLÓSET (${ctx.prendas.length} prendas):`,
    JSON.stringify(ctx.prendas),
    "",
    "PERFIL DE ESTILO APRENDIDO:",
    JSON.stringify(ctx.perfil),
    "",
    ctx.clima
      ? `CLIMA: ${ctx.clima.ciudad}, ${ctx.clima.temperatura}°C, ${ctx.clima.descripcion}.`
      : "CLIMA: no disponible. No menciones el clima en las explicaciones.",
    ctx.ocasion ? `OCASIÓN PEDIDA: ${ctx.ocasion}` : "OCASIÓN: día normal.",
    ctx.feedbackReciente.length
      ? `RECHAZOS RECIENTES (no repitas esto): ${ctx.feedbackReciente.join(" · ")}`
      : "",
  ].join("\n");

  let raw: string;
  try {
    const response = await conReintentoSiHayCuota(() =>
      getClient().models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: `${STYLIST_PROMPT}\n\n${contexto}` }] }],
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: ESQUEMA_ESTILISTA,
        temperature: 0.9, // más alta que la catalogación: aquí sí queremos variedad
      },
    }));
    raw = response.text ?? "";
  } catch (error) {
    return {
      ok: false,
      message: `el proveedor falló: ${error instanceof Error ? error.message : String(error)}`,
      meta,
    };
  }

  const ids = new Set(ctx.prendas.map((p) => p.id));
  return { ...parseStylistResponse(raw, ids), meta };
}

const ESQUEMA_ESTILISTA = {
  type: "object",
  properties: {
    outfits: {
      type: "array",
      minItems: 1,
      maxItems: 3,
      items: {
        type: "object",
        properties: {
          garment_ids: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 5 },
          title: { type: "string" },
          explanation: { type: "string" },
          tip: { type: "string" },
        },
        required: ["garment_ids", "title", "explanation", "tip"],
      },
    },
    falta: { type: "string" },
  },
  required: ["outfits"],
} as const;

/**
 * Reescribe el perfil de estilo a partir de los eventos nuevos (Apéndice A3).
 * Es el moat del producto: lo que hace que a las dos semanas ya no proponga
 * lo que la usuaria odia.
 */
export async function updateStyleProfile(
  perfilActual: StyleProfile,
  eventos: Array<Record<string, unknown>>,
): Promise<{ perfil: StyleProfile | null; estCostUsd: number; model: string }> {
  const model = MODELS.reasoning();
  const contexto = [
    "PERFIL ACTUAL:",
    JSON.stringify(perfilActual),
    "",
    `EVENTOS NUEVOS (${eventos.length}):`,
    JSON.stringify(eventos),
  ].join("\n");

  try {
    const response = await conReintentoSiHayCuota(() =>
      getClient().models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: `${PROFILE_PROMPT}\n\n${contexto}` }] }],
      config: { responseMimeType: "application/json", temperature: 0.3 },
    }));
    return {
      perfil: parseStyleProfile(response.text ?? ""),
      estCostUsd: EST_COST_USD.updateStyleProfile,
      model,
    };
  } catch {
    return { perfil: null, estCostUsd: EST_COST_USD.updateStyleProfile, model };
  }
}

export { PROFILE_PROMPT_VERSION };

export type ValidacionAvatar = {
  sirve: boolean;
  motivo: string;
  problema: string;
  /**
   * La foto sirve, pero algo va a bajar la calidad del render — casi siempre
   * ropa holgada, que impide ver la silueta. Se avisa en vez de rechazar:
   * bloquear una foto usable molesta más que advertir.
   */
  aviso: string;
};

const ESQUEMA_AVATAR = {
  type: "object",
  properties: {
    sirve: { type: "boolean" },
    motivo: { type: "string" },
    aviso: { type: "string" },
    problema: {
      type: "string",
      enum: [
        "ninguno",
        "no_es_persona",
        "no_cuerpo_completo",
        "poca_luz",
        "borrosa",
        "pose_dificil",
        "fondo_muy_cargado",
        "contenido_inapropiado",
      ],
    },
  },
  required: ["sirve", "motivo", "problema", "aviso"],
} as const;

/**
 * Valida la foto base del try-on antes de gastar un crédito en ella.
 *
 * Ante la duda rechaza: un render sobre una foto mala decepciona más que pedir
 * otra foto, y además cuesta dinero. Si el modelo falla, se rechaza también —
 * nunca se deja pasar contenido sin revisar.
 */
export async function validarFotoBase(
  imageBase64: string,
  mimeType = "image/webp",
): Promise<ValidacionAvatar & { estCostUsd: number }> {
  const estCostUsd = EST_COST_USD.validateAvatar;

  try {
    const response = await conReintentoSiHayCuota(() =>
      getClient().models.generateContent({
      model: MODELS.vision(),
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType, data: imageBase64 } },
            { text: AVATAR_PROMPT },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: ESQUEMA_AVATAR,
        temperature: 0.1,
      },
    }));

    const limpio = (response.text ?? "").trim().replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```$/, "");
    let datos = JSON.parse(limpio);
    if (Array.isArray(datos)) datos = datos[0];

    return {
      sirve: Boolean(datos?.sirve),
      motivo: String(datos?.motivo ?? "No pudimos revisar esta foto."),
      problema: String(datos?.problema ?? "ninguno"),
      aviso: String(datos?.aviso ?? "").trim(),
      estCostUsd,
    };
  } catch {
    return {
      sirve: false,
      motivo: "No pudimos revisar esta foto. Intenta con otra.",
      problema: "ninguno",
      aviso: "",
      estCostUsd,
    };
  }
}

export { AVATAR_PROMPT_VERSION };

const ESQUEMA_HUECOS = {
  type: "object",
  properties: {
    huecos: {
      type: "array",
      maxItems: 5,
      items: {
        type: "object",
        properties: {
          prenda: { type: "string" },
          porque: { type: "string" },
          desbloquea: { type: "integer" },
          con_ids: { type: "array", items: { type: "string" } },
          busqueda: { type: "string" },
        },
        required: ["prenda", "porque", "desbloquea", "con_ids", "busqueda"],
      },
    },
  },
  required: ["huecos"],
} as const;

/**
 * Detecta qué le falta al clóset (Apéndice A4).
 * Deliberadamente conservador: recomendar de más convierte al estilista en
 * vendedor, que es justo lo que el documento prohíbe (§3.2.4).
 */
export async function analizarHuecos(
  prendas: PrendaParaEstilista[],
  perfil: StyleProfile,
): Promise<{
  huecos: import("./compras-tipos").HuecoDetectado[] | null;
  estCostUsd: number;
  model: string;
}> {
  const model = MODELS.reasoning();
  const { parseGaps } = await import("../compras");

  const contexto = [
    `CLÓSET (${prendas.length} prendas):`,
    JSON.stringify(prendas),
    "",
    "PERFIL DE ESTILO:",
    JSON.stringify(perfil),
  ].join("\n");

  try {
    const response = await conReintentoSiHayCuota(() =>
      getClient().models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: `${GAPS_PROMPT}\n\n${contexto}` }] }],
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: ESQUEMA_HUECOS,
        temperature: 0.4,
      },
    }));

    const ids = new Set(prendas.map((p) => p.id));
    return {
      huecos: parseGaps(response.text ?? "", ids),
      estCostUsd: EST_COST_USD.analyzeGaps,
      model,
    };
  } catch {
    return { huecos: null, estCostUsd: EST_COST_USD.analyzeGaps, model };
  }
}

export { GAPS_PROMPT_VERSION };

/* ------------------------------------------------------------------ *
 * Núcleo de estilo — Semana 1, página /core
 * ------------------------------------------------------------------ */

const ESQUEMA_CORE = {
  type: "object",
  properties: {
    esencia: { type: "string" },
    principios: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 5 },
    paleta: { type: "array", items: { type: "string" }, maxItems: 6 },
    siluetas: { type: "array", items: { type: "string" }, maxItems: 4 },
    evitar: { type: "array", items: { type: "string" }, maxItems: 4 },
    regla: { type: "string" },
    confianza: { type: "number" },
    falta: { type: "string" },
  },
  required: ["esencia", "principios", "paleta", "siluetas", "evitar", "regla", "confianza", "falta"],
} as const;

export type ResultadoCore = StyleCoreResult & { estCostUsd: number; model: string; promptVersion: number };

/**
 * Extrae el núcleo de estilo del texto que escribió una persona.
 *
 * Temperatura media: con 0 el modelo repite las mismas cinco frases para
 * entradas distintas, y el punto de la página es que dos personas reciban dos
 * núcleos que se sientan suyos. Pero tampoco alta, o empieza a inventar color
 * y silueta que nadie mencionó — que es justo lo que el prompt prohíbe.
 */
export async function extraerNucleo(texto: string): Promise<ResultadoCore> {
  const estCostUsd = EST_COST_USD.extractCore;
  const model = MODELS.reasoning();
  const promptVersion = CORE_PROMPT_VERSION;

  try {
    const response = await conReintentoSiHayCuota(() =>
      getClient().models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: `${CORE_PROMPT}\n\nTexto de la persona:\n"""\n${texto}\n"""` }] }],
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: ESQUEMA_CORE,
        temperature: 0.45,
      },
    }));

    return { ...parseStyleCore(response.text ?? ""), estCostUsd, model, promptVersion };
  } catch (error) {
    console.error("[core] falló la llamada al modelo", error);
    return {
      ok: false,
      reason: "unparseable",
      message: "No pudimos generar tu núcleo ahora. Inténtalo en un momento.",
      estCostUsd,
      model,
      promptVersion,
    };
  }
}


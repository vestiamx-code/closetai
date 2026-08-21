import { z } from "zod";

/** Un outfit propuesto por el estilista (Apéndice A2). */
export const outfitSchema = z.object({
  garment_ids: z.array(z.string()).min(2).max(5),
  title: z.string().trim().min(1).max(60),
  explanation: z.string().trim().min(1),
  tip: z.string().trim().min(1),
});

export const stylistResponseSchema = z.object({
  outfits: z.array(outfitSchema).min(1).max(3),
  /** Qué prenda haría falta, cuando el clóset no alcanza. Alimenta el gap analysis. */
  falta: z.string().nullable().optional(),
});

export type Outfit = z.infer<typeof outfitSchema>;
export type StylistResponse = z.infer<typeof stylistResponseSchema>;

export type StylistResult =
  | { ok: true; response: StylistResponse }
  | { ok: false; message: string };

/**
 * Valida la respuesta del estilista y descarta outfits que referencien prendas
 * inexistentes. Un modelo puede alucinar un id; si eso llegara a la base, la
 * pantalla mostraría huecos sin explicación.
 */
export function parseStylistResponse(raw: string, idsValidos: Set<string>): StylistResult {
  let parsed: unknown;
  try {
    const limpio = raw.trim().replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```$/, "");
    parsed = JSON.parse(limpio);
  } catch {
    return { ok: false, message: "el modelo no devolvió JSON" };
  }

  const validado = stylistResponseSchema.safeParse(parsed);
  if (!validado.success) {
    return { ok: false, message: validado.error.issues.map((i) => i.message).join("; ") };
  }

  const outfits = validado.data.outfits.filter((o) =>
    o.garment_ids.every((id) => idsValidos.has(id)),
  );

  if (outfits.length === 0) {
    return { ok: false, message: "el modelo propuso prendas que no están en el clóset" };
  }

  return { ok: true, response: { ...validado.data, outfits } };
}

/** Perfil de estilo aprendido (Apéndice A3). */
const inferenciaSchema = z.object({
  valor: z.string().trim().min(1),
  confianza: z.number().min(0).max(1),
  evidencia: z.string().trim().min(1),
});

export const styleProfileSchema = z.object({
  estilos_preferidos: z.array(inferenciaSchema).default([]),
  estilos_rechazados: z.array(inferenciaSchema).default([]),
  colores_favoritos: z.array(inferenciaSchema).default([]),
  colores_vetados: z.array(inferenciaSchema).default([]),
  combinaciones_exitosas: z.array(inferenciaSchema).default([]),
  ocasiones_frecuentes: z.array(inferenciaSchema).default([]),
  notas_libres: z.string().default(""),
});

export type StyleProfile = z.infer<typeof styleProfileSchema>;

export const PERFIL_VACIO: StyleProfile = {
  estilos_preferidos: [],
  estilos_rechazados: [],
  colores_favoritos: [],
  colores_vetados: [],
  combinaciones_exitosas: [],
  ocasiones_frecuentes: [],
  notas_libres: "",
};

/** Límite del Apéndice A3: 40 entradas en total, las de mayor confianza. */
const MAX_ENTRADAS = 40;

export function recortarPerfil(perfil: StyleProfile): StyleProfile {
  const listas = [
    "estilos_preferidos",
    "estilos_rechazados",
    "colores_favoritos",
    "colores_vetados",
    "combinaciones_exitosas",
    "ocasiones_frecuentes",
  ] as const;

  const total = listas.reduce((n, k) => n + perfil[k].length, 0);
  if (total <= MAX_ENTRADAS) return perfil;

  // Se recorta proporcionalmente, conservando siempre lo de mayor confianza.
  const factor = MAX_ENTRADAS / total;
  const recortado = { ...perfil };
  for (const k of listas) {
    const cupo = Math.max(1, Math.floor(perfil[k].length * factor));
    recortado[k] = [...perfil[k]].sort((a, b) => b.confianza - a.confianza).slice(0, cupo);
  }
  return recortado;
}

export function parseStyleProfile(raw: string): StyleProfile | null {
  try {
    const limpio = raw.trim().replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```$/, "");
    const validado = styleProfileSchema.safeParse(JSON.parse(limpio));
    return validado.success ? recortarPerfil(validado.data) : null;
  } catch {
    return null;
  }
}

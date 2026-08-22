import { z } from "zod";

/** Un hueco detectado en el clóset (Apéndice A4). */
export const huecoSchema = z.object({
  prenda: z.string().trim().min(1).max(120),
  porque: z.string().trim().min(1),
  desbloquea: z.number().int().min(0).max(99),
  con_ids: z.array(z.string()).default([]),
  busqueda: z.string().trim().min(1).max(120),
});

export const gapsSchema = z.object({
  huecos: z.array(huecoSchema).min(0).max(5),
});

export type Hueco = z.infer<typeof huecoSchema>;

export function parseGaps(raw: string, idsValidos: Set<string>): Hueco[] | null {
  try {
    const limpio = raw.trim().replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```$/, "");
    let datos = JSON.parse(limpio);
    if (Array.isArray(datos)) datos = { huecos: datos };

    const validado = gapsSchema.safeParse(datos);
    if (!validado.success) return null;

    // Los ids inventados se descartan en silencio: la recomendación sigue
    // siendo válida aunque el modelo se haya equivocado al citar prendas.
    return validado.data.huecos.map((h) => ({
      ...h,
      con_ids: h.con_ids.filter((id) => idsValidos.has(id)),
    }));
  } catch {
    return null;
  }
}

/**
 * Tiendas donde ClosetAI busca lo que recomienda.
 *
 * El tag de afiliado se lee de variables de entorno y puede no existir: el
 * enlace funciona igual, solo que sin comisión. Eso permite recomendar desde el
 * día uno y dar de alta los programas de afiliados después, sin redeploy (§3.3 M6).
 */
export const TIENDAS = {
  amazon: {
    nombre: "Amazon México",
    url: (q: string) => {
      const base = `https://www.amazon.com.mx/s?k=${encodeURIComponent(q)}`;
      const tag = process.env.AMAZON_AFFILIATE_TAG;
      return tag ? `${base}&tag=${encodeURIComponent(tag)}` : base;
    },
  },
  mercadolibre: {
    nombre: "Mercado Libre",
    url: (q: string) => `https://listado.mercadolibre.com.mx/${encodeURIComponent(q).replace(/%20/g, "-")}`,
  },
  shein: {
    nombre: "Shein",
    url: (q: string) => `https://mx.shein.com/pdsearch/${encodeURIComponent(q)}`,
  },
} as const;

export type TiendaId = keyof typeof TIENDAS;

export function esTiendaValida(id: string): id is TiendaId {
  return id in TIENDAS;
}

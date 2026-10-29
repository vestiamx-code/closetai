import { z } from "zod";

import type { Seccion } from "@/lib/chat";

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
    nombre: "Amazon Mexico",
    url: (q: string) => {
      const base = `https://www.amazon.com.mx/s?k=${encodeURIComponent(q)}`;
      const tag = process.env.AMAZON_AFFILIATE_TAG;
      return tag ? `${base}&tag=${encodeURIComponent(tag)}` : base;
    },
  },
  mercadolibre: {
    nombre: "Mercado Libre",
    url: (q: string) =>
      `https://listado.mercadolibre.com.mx/${encodeURIComponent(q).replace(/%20/g, "-")}`,
  },
  shein: {
    nombre: "Shein",
    url: (q: string) => `https://mx.shein.com/pdsearch/${encodeURIComponent(q)}`,
  },
  // The three below are the /chat stores (Week 5). Each search address was
  // opened in a browser on Oct 29, 2026 and lands on results with photos. Zara
  // and Bershka were tried too and dropped: their search links redirect to the
  // homepage, which would leave the person with nothing.
  mango: {
    nombre: "Mango",
    // Mango splits its results by section in the path.
    url: (q: string, seccion?: Seccion) =>
      `https://shop.mango.com/mx/es/search/${seccion === "hombre" ? "hombre" : "mujer"}?q=${encodeURIComponent(q)}`,
  },
  hm: {
    nombre: "H&M",
    url: (q: string) =>
      `https://www2.hm.com/es_mx/search-results.html?q=${encodeURIComponent(q)}`,
  },
  liverpool: {
    nombre: "Liverpool",
    url: (q: string) =>
      `https://www.liverpool.com.mx/tienda?s=${encodeURIComponent(q).replace(/%20/g, "+")}`,
  },
} satisfies Record<string, { nombre: string; url: (q: string, seccion?: Seccion) => string }>;

/** Stores offered under each garment in /chat. Mango only when the section is known. */
export function tiendasDelChat(seccion: Seccion | null): TiendaId[] {
  return seccion === "mujer" || seccion === "hombre" ? ["mango", "hm", "liverpool"] : ["hm", "liverpool"];
}

/** Stores offered in /buy/recommendations, as before Week 5. */
export const TIENDAS_RECOMENDACIONES: TiendaId[] = ["amazon", "mercadolibre", "shein"];

export type TiendaId = keyof typeof TIENDAS;

export function esTiendaValida(id: string): id is TiendaId {
  return id in TIENDAS;
}

/**
 * /dashboard maths (Week 6). Pure functions, so they can be tested with empty
 * tables, test rows and odd values without touching the database.
 */

/** What each `api_costs.operation` is called on the page. */
export const OPERACIONES: Record<string, string> = {
  catalog_garment: "Cataloging garments",
  remove_background: "Cutting out garments",
  suggest_outfits: "Stylist outfits",
  update_style_profile: "Learning her style",
  analyze_gaps: "Shopping advice",
  validate_avatar: "Checking base photos",
  tryon: "Virtual try-on",
  extract_core: "Style cores",
  research_report: "Research answers",
  marketing_post: "Marketing posts",
  chat_reply: "Public chat answers",
};

/** A whole-number percentage, or null when there is nothing to divide. */
export function porcentaje(parte: number, total: number): number | null {
  if (!Number.isFinite(parte) || !Number.isFinite(total) || total <= 0) return null;
  return Math.round((Math.max(0, parte) / total) * 100);
}

export type FilaCosto = { operation: string; est_cost_usd: number | string | null };

export type CostoPorOperacion = { operacion: string; nombre: string; llamadas: number; usd: number };

/**
 * Groups the AI spend by operation, most expensive first. Only the operation
 * and the amount are read: older rows keep a connection in another column,
 * and that column never reaches this page.
 */
export function costosPorOperacion(filas: FilaCosto[]): { total: number; llamadas: number; filas: CostoPorOperacion[] } {
  const grupos = new Map<string, CostoPorOperacion>();
  for (const f of filas) {
    const usd = Number(f.est_cost_usd);
    if (!Number.isFinite(usd) || usd < 0) continue;
    const g = grupos.get(f.operation) ?? {
      operacion: f.operation,
      nombre: OPERACIONES[f.operation] ?? f.operation.replaceAll("_", " "),
      llamadas: 0,
      usd: 0,
    };
    g.llamadas += 1;
    g.usd += usd;
    grupos.set(f.operation, g);
  }
  const lista = [...grupos.values()].sort((a, b) => b.usd - a.usd || b.llamadas - a.llamadas);
  return {
    total: lista.reduce((n, g) => n + g.usd, 0),
    llamadas: lista.reduce((n, g) => n + g.llamadas, 0),
    filas: lista,
  };
}

export type SesionChat = { es_prueba: boolean; needs_review: boolean; revisado_at: string | null };

/** Chat totals without test traffic. */
export function resumenChat(sesiones: SesionChat[], calificaciones: number[]) {
  const reales = sesiones.filter((s) => !s.es_prueba);
  const marcadas = reales.filter((s) => s.needs_review);
  const arriba = calificaciones.filter((r) => r === 1).length;
  const abajo = calificaciones.filter((r) => r === -1).length;
  return {
    conversaciones: reales.length,
    marcadas: marcadas.length,
    revisadas: marcadas.filter((s) => s.revisado_at).length,
    pendientes: marcadas.filter((s) => !s.revisado_at).length,
    arriba,
    abajo,
    utiles: porcentaje(arriba, arriba + abajo),
  };
}

/** Accepted vs rejected outfits: what the stylist's own users said. */
export function resumenOutfits(estados: string[]) {
  const aceptados = estados.filter((e) => e === "accepted" || e === "favorite" || e === "worn").length;
  const rechazados = estados.filter((e) => e === "rejected").length;
  return {
    sugeridos: estados.length,
    aceptados,
    rechazados,
    tasaAceptacion: porcentaje(aceptados, aceptados + rechazados),
  };
}

/** Views and clicks per variant of the homepage experiment. */
export function resumenAB(eventos: { variante: string; evento: string }[]) {
  const de = (v: string) => {
    const vistas = eventos.filter((e) => e.variante === v && e.evento === "vista").length;
    const clics = eventos.filter((e) => e.variante === v && e.evento === "clic").length;
    return { vistas, clics, conversion: porcentaje(clics, vistas) };
  };
  return { a: de("a"), b: de("b") };
}

/** "$0.67" for amounts that matter, "$0.0040" for fractions of a cent. */
export function dolares(usd: number): string {
  if (!Number.isFinite(usd)) return "$0.00";
  return usd >= 0.1 || usd === 0 ? `$${usd.toFixed(2)}` : `$${usd.toFixed(4)}`;
}

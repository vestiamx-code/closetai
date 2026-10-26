import "server-only";

import { createAdminClient } from "./supabase/admin";

/**
 * Límites de uso por usuaria (§4.4).
 *
 * Se calculan contando `api_costs`, la tabla donde ya queda registro de cada
 * llamada facturable. Sin tabla nueva y sin contador aparte que pueda
 * desincronizarse del gasto real.
 *
 * Protegen dos cosas distintas: que una sola persona no queme la cuota
 * compartida de Gemini, y que un error en el código (o un script) no genere
 * miles de llamadas antes de que alguien lo note.
 */

const LIMITES = {
  catalog_garment: { cantidad: 40, ventanaHoras: 1, mensaje: "You uploaded a lot of garments very fast. Wait an hour and keep going." },
  suggest_outfits: { cantidad: 15, ventanaHoras: 24, mensaje: "You've asked for a lot of outfits today. I'll suggest more tomorrow." },
  analyze_gaps: { cantidad: 5, ventanaHoras: 24, mensaje: "We've analyzed your closet several times today. Again tomorrow." },
  tryon: { cantidad: 30, ventanaHoras: 24, mensaje: "You've reached the daily maximum of virtual try-ons." },
} as const;

export type Operacion = keyof typeof LIMITES;

export type ResultadoLimite = { permitido: true } | { permitido: false; motivo: string };

export async function revisarLimite(
  userId: string,
  operacion: Operacion,
): Promise<ResultadoLimite> {
  const limite = LIMITES[operacion];
  const desde = new Date(Date.now() - limite.ventanaHoras * 60 * 60 * 1000).toISOString();

  const admin = createAdminClient();
  const { count } = await admin
    .from("api_costs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("operation", operacion)
    .gte("created_at", desde);

  if ((count ?? 0) >= limite.cantidad) {
    return { permitido: false, motivo: limite.mensaje };
  }
  return { permitido: true };
}

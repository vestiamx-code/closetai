import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { costosPorOperacion, resumenAB, resumenChat, resumenOutfits, type FilaCosto } from "@/lib/tablero";

/**
 * Reads every module's records for /dashboard (Week 6).
 *
 * Uses the service key because every table is closed to the public key, so
 * the rule is the reverse of usual: only counts and amounts leave this file.
 * No row with a name, an email, a photo, a message or a connection is returned.
 */
export async function leerTablero() {
  const db = createAdminClient();
  const contar = async (tabla: string, filtro?: { eq?: [string, unknown]; neq?: [string, unknown] }) => {
    let q = db.from(tabla).select("*", { count: "exact", head: true });
    if (filtro?.eq) q = q.eq(...filtro.eq);
    if (filtro?.neq) q = q.neq(...filtro.neq);
    const { count, error } = await q;
    if (error) throw new Error(`${tabla}: ${error.message}`);
    return count ?? 0;
  };

  const [
    cuentas,
    prendas,
    pruebasVirtuales,
    reacciones,
    recomendaciones,
    nucleos,
    informes,
    fuentes,
    riesgos,
    entrevistas,
    piezas,
    piezasAprobadas,
    resumenesTesters,
    outfits,
    ab,
    sesiones,
    calificaciones,
    costos,
  ] = await Promise.all([
    contar("profiles"),
    contar("garments", { neq: ["status", "failed"] }),
    contar("tryon_renders", { eq: ["status", "done"] }),
    contar("feedback_events"),
    contar("shopping_recs"),
    contar("core_outputs"),
    contar("research_outputs"),
    contar("research_sources"),
    contar("research_risks"),
    contar("validation_conversations"),
    contar("marketing_assets"),
    contar("marketing_assets", { eq: ["aprobado", true] }),
    db.from("chat_test_summaries").select("tester, chat_sessions!inner(es_prueba)").eq("chat_sessions.es_prueba", false),
    db.from("outfits").select("status"),
    db.from("ab_events").select("variante, evento"),
    db.from("chat_sessions").select("es_prueba, needs_review, revisado_at"),
    db
      .from("chat_ratings")
      .select("rating, chat_messages!inner(chat_sessions!inner(es_prueba))")
      .eq("chat_messages.chat_sessions.es_prueba", false),
    // Only these two columns: older rows keep a connection in `provider`.
    db.from("api_costs").select("operation, est_cost_usd").range(0, 49_999),
  ]);

  for (const r of [resumenesTesters, outfits, ab, sesiones, calificaciones, costos]) {
    if (r.error) throw new Error(r.error.message);
  }

  return {
    leidoEl: new Date(),
    cuentas,
    app: {
      prendas,
      pruebasVirtuales,
      reacciones,
      recomendaciones,
      outfits: resumenOutfits((outfits.data ?? []).map((o) => o.status ?? "suggested")),
    },
    publico: { nucleos, informes, fuentes, riesgos, entrevistas, piezas, piezasAprobadas },
    ab: resumenAB(ab.data ?? []),
    chat: {
      ...resumenChat(sesiones.data ?? [], (calificaciones.data ?? []).map((c) => c.rating)),
      resumenesTesters: resumenesTesters.data?.length ?? 0,
    },
    costos: costosPorOperacion((costos.data ?? []) as FilaCosto[]),
  };
}

export type Tablero = Awaited<ReturnType<typeof leerTablero>>;

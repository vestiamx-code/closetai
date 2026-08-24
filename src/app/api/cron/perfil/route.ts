import { NextResponse, type NextRequest } from "next/server";

import { actualizarPerfilSiToca } from "@/lib/perfil-estilo";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Red de seguridad del aprendizaje de gustos.
 *
 * El perfil se reescribe al reaccionar (ver `perfil-estilo.ts`). Este cron
 * atrapa lo que se quedó fuera: quien acumuló eventos sin llegar al umbral de 5
 * y ya pasó de 24 horas, y cualquier actualización que haya fallado en el
 * momento. Antes esto era el único camino, y por eso "cada 5 eventos" tardaba
 * hasta un día en cumplirse.
 *
 * Protegido con CRON_SECRET: sin eso, cualquiera podría dispararlo y quemar
 * cuota de Gemini a costa del proyecto.
 */

/** Techo de usuarias por corrida, para que el gasto por ejecución sea acotado. */
const MAX_USUARIAS = 50;

export async function GET(request: NextRequest) {
  const esperado = process.env.CRON_SECRET;
  const recibido = request.headers.get("authorization")?.replace("Bearer ", "");

  if (!esperado || recibido !== esperado) {
    return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: pendientes } = await admin
    .from("feedback_events")
    .select("user_id")
    .eq("processed", false)
    .order("created_at", { ascending: true })
    .limit(500);

  if (!pendientes?.length) {
    return NextResponse.json({ procesadas: 0, motivo: "sin eventos pendientes" });
  }

  const usuarias = [...new Set(pendientes.map((e) => e.user_id))].slice(0, MAX_USUARIAS);

  const resultados: Array<{ user_id: string; ok: boolean; motivo?: string }> = [];
  for (const userId of usuarias) {
    const r = await actualizarPerfilSiToca(userId);
    resultados.push(
      r.actualizado ? { user_id: userId, ok: true } : { user_id: userId, ok: false, motivo: r.motivo },
    );
  }

  return NextResponse.json({
    procesadas: resultados.filter((r) => r.ok).length,
    revisadas: resultados.length,
    resultados,
  });
}

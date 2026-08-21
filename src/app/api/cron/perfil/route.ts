import { NextResponse, type NextRequest } from "next/server";

import { updateStyleProfile } from "@/lib/ai/gemini";
import { PERFIL_VACIO, styleProfileSchema } from "@/lib/ai/outfits";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Reescribe el perfil de estilo de quienes tengan feedback sin procesar.
 *
 * Corre por cron (§3.3 M4: cada 5 eventos o 24 h, lo que ocurra primero).
 * Protegido con CRON_SECRET: sin eso, cualquiera podría dispararlo y quemar
 * cuota de Gemini a costa del proyecto.
 */

/** Eventos acumulados que justifican reescribir el perfil. */
const UMBRAL_EVENTOS = 5;
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
    .select("user_id, type, payload, garment_id, outfit_id, created_at")
    .eq("processed", false)
    .order("created_at", { ascending: true })
    .limit(500);

  if (!pendientes?.length) {
    return NextResponse.json({ procesadas: 0, motivo: "sin eventos pendientes" });
  }

  // Agrupar por usuaria: un solo perfil reescrito por persona, no uno por evento.
  const porUsuaria = new Map<string, typeof pendientes>();
  for (const evento of pendientes) {
    const lista = porUsuaria.get(evento.user_id) ?? [];
    lista.push(evento);
    porUsuaria.set(evento.user_id, lista);
  }

  const resultados: Array<{ user_id: string; ok: boolean }> = [];
  let procesadas = 0;

  for (const [userId, eventos] of porUsuaria) {
    if (procesadas >= MAX_USUARIAS) break;

    const masViejo = new Date(eventos[0].created_at).getTime();
    const hanPasado24h = Date.now() - masViejo > 24 * 60 * 60 * 1000;
    if (eventos.length < UMBRAL_EVENTOS && !hanPasado24h) continue;

    const { data: fila } = await admin
      .from("style_profiles")
      .select("profile, version")
      .eq("user_id", userId)
      .single();

    const validado = styleProfileSchema.safeParse(fila?.profile ?? {});
    const actual = validado.success ? validado.data : PERFIL_VACIO;

    const { perfil, estCostUsd, model } = await updateStyleProfile(
      actual,
      eventos.map((e) => ({
        tipo: e.type,
        detalle: e.payload,
        cuando: e.created_at,
      })),
    );

    await admin.from("api_costs").insert({
      user_id: userId,
      provider: "google",
      operation: "update_style_profile",
      est_cost_usd: estCostUsd,
    });

    if (perfil) {
      await admin
        .from("style_profiles")
        .update({
          profile: perfil,
          version: (fila?.version ?? 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
    }

    // Los eventos se marcan aunque el modelo falle: reintentar indefinidamente
    // sobre los mismos eventos gastaría cuota sin aprender nada nuevo.
    await admin
      .from("feedback_events")
      .update({ processed: true })
      .eq("user_id", userId)
      .eq("processed", false);

    resultados.push({ user_id: userId, ok: Boolean(perfil) });
    procesadas += 1;
    void model;
  }

  return NextResponse.json({ procesadas, resultados });
}

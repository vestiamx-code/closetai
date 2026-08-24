import "server-only";

import { updateStyleProfile } from "@/lib/ai/gemini";
import { PERFIL_VACIO, styleProfileSchema } from "@/lib/ai/outfits";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Reescribe el perfil de estilo de una usuaria si ya toca.
 *
 * La regla es la del documento (§3.3 M4): cada 5 eventos o 24 horas, lo que
 * ocurra primero. Vivía dentro del cron, y por eso "cada 5 eventos" nunca se
 * cumplía a tiempo: había que esperar al cron de las 8am. Alguien que se
 * registraba, subía ropa y reaccionaba a diez outfits veía "Todavía no te
 * conozco" hasta el día siguiente — justo en el rato en que decide si la app
 * le sirve.
 *
 * Ahora esto se llama en dos lados: al reaccionar (con `after()`, después de
 * responderle a la usuaria) y desde el cron, que queda como red de seguridad
 * para quien acumuló eventos sin llegar al umbral.
 */

/** Eventos acumulados que justifican reescribir el perfil. */
export const UMBRAL_EVENTOS = 5;

const VENTANA_MS = 24 * 60 * 60 * 1000;

export type ResultadoPerfil =
  | { actualizado: true }
  | { actualizado: false; motivo: "sin_eventos" | "aun_no_toca" | "modelo_fallo" };

export async function actualizarPerfilSiToca(userId: string): Promise<ResultadoPerfil> {
  const admin = createAdminClient();

  const { data: eventos } = await admin
    .from("feedback_events")
    .select("type, payload, created_at")
    .eq("user_id", userId)
    .eq("processed", false)
    .order("created_at", { ascending: true });

  if (!eventos?.length) return { actualizado: false, motivo: "sin_eventos" };

  const masViejo = new Date(eventos[0].created_at).getTime();
  const venció = Date.now() - masViejo > VENTANA_MS;
  if (eventos.length < UMBRAL_EVENTOS && !venció) {
    return { actualizado: false, motivo: "aun_no_toca" };
  }

  const { data: fila } = await admin
    .from("style_profiles")
    .select("profile, version")
    .eq("user_id", userId)
    .single();

  const validado = styleProfileSchema.safeParse(fila?.profile ?? {});
  const actual = validado.success ? validado.data : PERFIL_VACIO;

  const { perfil, estCostUsd } = await updateStyleProfile(
    actual,
    eventos.map((e) => ({ tipo: e.type, detalle: e.payload, cuando: e.created_at })),
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

  return perfil ? { actualizado: true } : { actualizado: false, motivo: "modelo_fallo" };
}

/**
 * Lo mismo, pero sin dejar que un fallo tumbe la acción que lo disparó.
 *
 * Se usa desde `after()`: la usuaria ya recibió su respuesta y no debe enterarse
 * de que el perfil no se pudo reescribir. Pero sí queda en el log: si esto falla
 * en silencio, M4 no aprende nada y nadie se entera.
 */
export async function actualizarPerfilEnSegundoPlano(userId: string): Promise<void> {
  try {
    const r = await actualizarPerfilSiToca(userId);
    if (!r.actualizado && r.motivo === "modelo_fallo") {
      console.error("[perfil] el modelo no devolvió un perfil válido", { userId });
    }
  } catch (error) {
    console.error("[perfil] falló la actualización en segundo plano", { userId, error });
  }
}

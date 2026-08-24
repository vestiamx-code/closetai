"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth";
import { suggestOutfits, type PrendaParaEstilista } from "@/lib/ai/gemini";
import { PERFIL_VACIO, styleProfileSchema } from "@/lib/ai/outfits";
import { obtenerClima } from "@/lib/clima";
import { revisarLimite } from "@/lib/limites";
import { createAdminClient } from "@/lib/supabase/admin";
import { actualizarPerfilEnSegundoPlano } from "@/lib/perfil-estilo";
import { createClient } from "@/lib/supabase/server";

export type ResultadoOutfits = { ok: true; cuantos: number } | { ok: false; motivo: string };

/** Mínimo de prendas para que valga la pena proponer algo (§3.2: valor en 10 minutos). */
const MINIMO_PRENDAS = 4;

export async function generarOutfits(ocasion?: string): Promise<ResultadoOutfits> {
  const user = await requireUser();

  const limite = await revisarLimite(user.id, "suggest_outfits");
  if (!limite.permitido) return { ok: false, motivo: limite.motivo };

  const supabase = await createClient();

  const { data: prendas } = await supabase
    .from("garments")
    .select("id, subcategory, category, colors, styles, seasons, occasions")
    .eq("status", "active");

  if (!prendas || prendas.length < MINIMO_PRENDAS) {
    return {
      ok: false,
      motivo: `Necesito al menos ${MINIMO_PRENDAS} prendas para armarte algo que valga la pena. Llevas ${prendas?.length ?? 0}.`,
    };
  }

  const [{ data: perfilRow }, { data: perfilUsuaria }] = await Promise.all([
    supabase.from("style_profiles").select("profile").eq("user_id", user.id).single(),
    supabase.from("profiles").select("city").eq("id", user.id).single(),
  ]);

  const perfilValidado = styleProfileSchema.safeParse(perfilRow?.profile ?? {});
  const perfil = perfilValidado.success ? perfilValidado.data : PERFIL_VACIO;

  // Los rechazos recientes van al prompt para no volver a proponer lo mismo.
  const { data: rechazos } = await supabase
    .from("feedback_events")
    .select("payload")
    .eq("type", "reject")
    .order("created_at", { ascending: false })
    .limit(5);

  const feedbackReciente = (rechazos ?? [])
    .map((r) => String((r.payload as Record<string, unknown>)?.motivo ?? ""))
    .filter(Boolean);

  const clima = await obtenerClima(perfilUsuaria?.city ?? "Ciudad de México");

  const resultado = await suggestOutfits({
    prendas: prendas.map(
      (p): PrendaParaEstilista => ({
        id: p.id,
        subcategoria: p.subcategory,
        categoria: p.category,
        colores: p.colors ?? [],
        estilos: p.styles ?? [],
        temporadas: p.seasons ?? [],
        ocasiones: p.occasions ?? [],
      }),
    ),
    perfil,
    clima,
    ocasion: ocasion?.trim() || null,
    feedbackReciente,
  });

  const admin = createAdminClient();
  await admin.from("api_costs").insert({
    user_id: user.id,
    provider: "google",
    operation: "suggest_outfits",
    est_cost_usd: resultado.meta.estCostUsd,
  });

  if (!resultado.ok) {
    return { ok: false, motivo: "El estilista no pudo armar nada esta vez. Intenta de nuevo." };
  }

  // Los outfits anteriores que siguen sin responder se archivan: la pantalla
  // muestra la propuesta de hoy, no un historial de sugerencias ignoradas.
  await supabase
    .from("outfits")
    .update({ status: "rejected" })
    .eq("user_id", user.id)
    .eq("status", "suggested");

  for (const outfit of resultado.response.outfits) {
    const { data: creado } = await supabase
      .from("outfits")
      .insert({
        user_id: user.id,
        title: outfit.title,
        occasion: ocasion?.trim() || null,
        weather: clima ? { ...clima } : null,
        explanation: `${outfit.explanation}\n\n${outfit.tip}`,
        source: "ai",
        status: "suggested",
      })
      .select("id")
      .single();

    if (!creado) continue;

    await supabase.from("outfit_items").insert(
      outfit.garment_ids.map((garment_id) => ({ outfit_id: creado.id, garment_id })),
    );
  }

  revalidatePath("/hoy");
  return { ok: true, cuantos: resultado.response.outfits.length };
}

const feedbackSchema = z.object({
  outfit_id: z.string().uuid(),
  tipo: z.enum(["accept", "reject", "favorite", "wear"]),
  motivo: z.string().trim().max(200).optional(),
});

const NUEVO_ESTADO = {
  accept: "accepted",
  reject: "rejected",
  favorite: "favorite",
  wear: "worn",
} as const;

/**
 * Registra la reacción de la usuaria a un outfit.
 *
 * Cada acción crea un `feedback_event` — no solo cambia el estado del outfit.
 * Esa tabla es la materia prima del aprendizaje de gustos (M4): sin ella, el
 * estilista propondría lo mismo para siempre.
 */
export async function reaccionar(formData: FormData): Promise<{ error?: string }> {
  const user = await requireUser();

  const datos = feedbackSchema.safeParse({
    outfit_id: formData.get("outfit_id"),
    tipo: formData.get("tipo"),
    motivo: formData.get("motivo") || undefined,
  });
  if (!datos.success) return { error: "Acción inválida." };

  const supabase = await createClient();

  const { error } = await supabase
    .from("outfits")
    .update({ status: NUEVO_ESTADO[datos.data.tipo] })
    .eq("id", datos.data.outfit_id)
    .eq("user_id", user.id);

  if (error) {
    console.error("[reaccionar] no se pudo actualizar el outfit", error);
    return { error: "No pudimos guardar tu respuesta." };
  }

  const { error: errorEvento } = await supabase.from("feedback_events").insert({
    user_id: user.id,
    type: datos.data.tipo,
    outfit_id: datos.data.outfit_id,
    payload: datos.data.motivo ? { motivo: datos.data.motivo } : {},
  });

  if (errorEvento) {
    // Sin este evento, M4 no aprende nada. Falla ruidosamente en el log.
    console.error("[reaccionar] no se pudo registrar el feedback", errorEvento);
    return { error: "Guardamos tu respuesta, pero no pudimos registrarla para el aprendizaje." };
  }

  // El perfil se reescribe después de responderle a la usuaria: aprender no debe
  // hacerla esperar, pero tampoco debe esperar al cron de mañana.
  after(() => actualizarPerfilEnSegundoPlano(user.id));

  revalidatePath("/hoy");
  revalidatePath("/estilo");
  return {};
}

/** Comentario libre sobre un outfit. Pesa más que un tap en el aprendizaje (A3). */
export async function comentar(formData: FormData): Promise<{ error?: string }> {
  const user = await requireUser();

  const datos = z
    .object({ outfit_id: z.string().uuid(), texto: z.string().trim().min(1).max(500) })
    .safeParse({ outfit_id: formData.get("outfit_id"), texto: formData.get("texto") });

  if (!datos.success) return { error: "Escribe algo primero." };

  const supabase = await createClient();
  await supabase.from("feedback_events").insert({
    user_id: user.id,
    type: "comment",
    outfit_id: datos.data.outfit_id,
    payload: { texto: datos.data.texto },
  });

  after(() => actualizarPerfilEnSegundoPlano(user.id));

  revalidatePath("/hoy");
  return {};
}

"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { analizarHuecos, type PrendaParaEstilista } from "@/lib/ai/gemini";
import { PERFIL_VACIO, styleProfileSchema } from "@/lib/ai/outfits";
import { revisarLimite } from "@/lib/limites";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type ResultadoHuecos = { ok: true; cuantos: number } | { ok: false; motivo: string };

/** Con menos de esto, "qué te falta" es toda la respuesta y no hace falta la IA. */
const MINIMO_PRENDAS = 6;

export async function analizarClosetc(): Promise<ResultadoHuecos> {
  const user = await requireUser();

  const limite = await revisarLimite(user.id, "analyze_gaps");
  if (!limite.permitido) return { ok: false, motivo: limite.motivo };

  const supabase = await createClient();

  const { data: prendas } = await supabase
    .from("garments")
    .select("id, subcategory, category, colors, styles, seasons, occasions")
    .eq("status", "active");

  if (!prendas || prendas.length < MINIMO_PRENDAS) {
    return {
      ok: false,
      motivo: `Con ${prendas?.length ?? 0} prendas todavía no puedo decirte qué te falta sin inventar. Sube al menos ${MINIMO_PRENDAS}.`,
    };
  }

  const { data: perfilRow } = await supabase
    .from("style_profiles")
    .select("profile")
    .eq("user_id", user.id)
    .single();

  const validado = styleProfileSchema.safeParse(perfilRow?.profile ?? {});

  const { huecos, estCostUsd } = await analizarHuecos(
    prendas.map(
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
    validado.success ? validado.data : PERFIL_VACIO,
  );

  const admin = createAdminClient();
  await admin.from("api_costs").insert({
    user_id: user.id,
    provider: "google",
    operation: "analyze_gaps",
    est_cost_usd: estCostUsd,
  });

  if (!huecos) return { ok: false, motivo: "No pudimos analizar tu clóset. Intenta de nuevo." };

  if (huecos.length === 0) {
    return {
      ok: false,
      motivo: "Tu clóset está bien cubierto. No te voy a inventar cosas que comprar.",
    };
  }

  // El análisis anterior se reemplaza: la usuaria ve el estado de hoy.
  await admin.from("shopping_recs").delete().eq("user_id", user.id);
  await admin.from("shopping_recs").insert(
    huecos.map((hueco) => ({ user_id: user.id, gap: hueco, products: [] })),
  );

  revalidatePath("/comprar/recomendaciones");
  return { ok: true, cuantos: huecos.length };
}

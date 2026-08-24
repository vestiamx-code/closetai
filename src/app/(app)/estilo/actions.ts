"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth";
import { PERFIL_VACIO, styleProfileSchema, type StyleProfile } from "@/lib/ai/outfits";
import { actualizarPerfilEnSegundoPlano } from "@/lib/perfil-estilo";
import { createClient } from "@/lib/supabase/server";

const LISTAS = [
  "estilos_preferidos",
  "estilos_rechazados",
  "colores_favoritos",
  "colores_vetados",
  "combinaciones_exitosas",
  "ocasiones_frecuentes",
] as const;

/**
 * Borra una inferencia que la usuaria dice que está mal.
 *
 * La corrección no solo quita el dato: también genera un `feedback_event` de
 * tipo `profile_fix`. Que la usuaria diga explícitamente "esto no soy yo" es la
 * señal más fuerte que existe, y el modelo debe verla en la siguiente pasada.
 */
export async function corregirInferencia(formData: FormData): Promise<{ error?: string }> {
  const user = await requireUser();

  const datos = z
    .object({
      lista: z.enum(LISTAS),
      valor: z.string().trim().min(1).max(120),
    })
    .safeParse({ lista: formData.get("lista"), valor: formData.get("valor") });

  if (!datos.success) return { error: "Corrección inválida." };

  const supabase = await createClient();
  const { data: fila } = await supabase
    .from("style_profiles")
    .select("profile, version")
    .eq("user_id", user.id)
    .single();

  const validado = styleProfileSchema.safeParse(fila?.profile ?? {});
  const perfil: StyleProfile = validado.success ? validado.data : PERFIL_VACIO;

  const nuevo: StyleProfile = {
    ...perfil,
    [datos.data.lista]: perfil[datos.data.lista].filter((i) => i.valor !== datos.data.valor),
  };

  // El perfil lo escribe el servidor: la política RLS de style_profiles es
  // solo lectura para la usuaria, a propósito.
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  await admin
    .from("style_profiles")
    .update({ profile: nuevo, version: (fila?.version ?? 0) + 1, updated_at: new Date().toISOString() })
    .eq("user_id", user.id);

  await supabase.from("feedback_events").insert({
    user_id: user.id,
    type: "profile_fix",
    payload: { lista: datos.data.lista, valor_rechazado: datos.data.valor },
  });

  after(() => actualizarPerfilEnSegundoPlano(user.id));

  revalidatePath("/estilo");
  return {};
}

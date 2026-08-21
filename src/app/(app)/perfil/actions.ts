"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const perfilSchema = z.object({
  display_name: z.string().trim().min(1, "¿Cómo te llamas?").max(60),
  city: z.string().trim().max(80).optional(),
  size_top: z.string().trim().max(12).optional(),
  size_bottom: z.string().trim().max(12).optional(),
  size_shoes: z.string().trim().max(12).optional(),
});

export async function guardarPerfil(formData: FormData): Promise<{ error?: string; ok?: boolean }> {
  const user = await requireUser();

  const datos = perfilSchema.safeParse(Object.fromEntries(formData));
  if (!datos.success) return { error: datos.error.issues[0]?.message ?? "Revisa los datos." };

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update(datos.data).eq("id", user.id);

  if (error) return { error: "No pudimos guardar los cambios." };

  revalidatePath("/perfil");
  return { ok: true };
}

/**
 * Borrado real de la cuenta (§3.2 y §4.4): base de datos **y** archivos.
 *
 * Las filas se van solas por las cascadas del esquema, pero los archivos de
 * Storage no: hay que enumerarlos y borrarlos a mano o quedan ocupando espacio
 * y, peor, siguen existiendo fotos de una persona que pidió que se borraran.
 */
export async function borrarCuenta(formData: FormData): Promise<{ error?: string }> {
  const user = await requireUser();

  const confirmacion = String(formData.get("confirmacion") ?? "").trim().toUpperCase();
  if (confirmacion !== "BORRAR") {
    return { error: 'Escribe BORRAR para confirmar.' };
  }

  const admin = createAdminClient();

  for (const bucket of ["garments", "avatars", "renders"]) {
    const { data: archivos } = await admin.storage.from(bucket).list(user.id, { limit: 1000 });
    const rutas = (archivos ?? []).map((a) => `${user.id}/${a.name}`);
    if (rutas.length) await admin.storage.from(bucket).remove(rutas);
  }

  // Borrar la usuaria de auth arrastra en cascada profiles y todo lo que cuelga.
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { error: "No pudimos borrar la cuenta. Escríbenos y lo hacemos a mano." };

  const supabase = await createClient();
  await supabase.auth.signOut();

  redirect("/");
}

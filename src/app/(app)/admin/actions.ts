"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth";
import { abonar } from "@/lib/credits";
import { createAdminClient } from "@/lib/supabase/admin";

function esAdmin(email: string | undefined): boolean {
  if (!email) return false;
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase());
}

/**
 * Abona créditos a mano, para soporte.
 *
 * Vuelve a comprobar que quien llama sea admin: esta acción es alcanzable por
 * POST directo sin pasar por la página, y regalar créditos es exactamente el
 * tipo de cosa que alguien intentaría.
 */
export async function abonarManual(formData: FormData): Promise<{ error?: string; ok?: string }> {
  const user = await requireUser();
  if (!esAdmin(user.email)) return { error: "No tienes permiso." };

  const datos = z
    .object({
      correo: z.string().trim().email(),
      cantidad: z.coerce.number().int().min(1).max(100),
      nota: z.string().trim().max(120).optional(),
    })
    .safeParse({
      correo: formData.get("correo"),
      cantidad: formData.get("cantidad"),
      nota: formData.get("nota") || undefined,
    });

  if (!datos.success) return { error: "Revisa el correo y la cantidad (1 a 100)." };

  const admin = createAdminClient();
  const { data: lista } = await admin.auth.admin.listUsers();
  const destino = lista?.users.find(
    (u) => u.email?.toLowerCase() === datos.data.correo.toLowerCase(),
  );

  if (!destino) return { error: "No existe una cuenta con ese correo." };

  const resultado = await abonar(
    destino.id,
    datos.data.cantidad,
    `soporte:${datos.data.nota ?? "sin nota"}`,
    `manual:${destino.id}:${Date.now()}`,
  );

  if (!resultado.ok) return { error: "No se pudo abonar." };

  revalidatePath("/admin");
  return { ok: `Abonados ${datos.data.cantidad} créditos a ${datos.data.correo}.` };
}

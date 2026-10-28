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
  if (!esAdmin(user.email)) return { error: "You don't have permission." };

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

  if (!datos.success) return { error: "Check the email and the amount (1 to 100)." };

  const admin = createAdminClient();
  const { data: lista } = await admin.auth.admin.listUsers();
  const destino = lista?.users.find(
    (u) => u.email?.toLowerCase() === datos.data.correo.toLowerCase(),
  );

  if (!destino) return { error: "There is no account with that email." };

  const resultado = await abonar(
    destino.id,
    datos.data.cantidad,
    `soporte:${datos.data.nota ?? "no note"}`,
    `manual:${destino.id}:${Date.now()}`,
  );

  if (!resultado.ok) return { error: "Credits could not be added." };

  revalidatePath("/admin");
  return { ok: `Added ${datos.data.cantidad} credits to ${datos.data.correo}.` };
}

/**
 * The human checkpoint of /chat (Week 5): Tamara marks a flagged conversation
 * as reviewed. Admin only, checked again here for the same reason as above.
 */
export async function marcarRevisada(sessionId: string): Promise<{ error?: string }> {
  const user = await requireUser();
  if (!esAdmin(user.email)) return { error: "You don't have permission." };
  const id = z.string().uuid().safeParse(sessionId);
  if (!id.success) return { error: "Invalid conversation." };

  const { error } = await createAdminClient()
    .from("chat_sessions")
    .update({ revisado_at: new Date().toISOString() })
    .eq("id", id.data)
    .eq("needs_review", true);
  if (error) return { error: "Couldn't mark it as reviewed." };
  revalidatePath("/admin");
  return {};
}


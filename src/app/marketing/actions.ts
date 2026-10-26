"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { generarPostMarketing } from "@/lib/ai/gemini";
import { huellaDeQuienPide } from "@/lib/ip";
import { CANALES, revisarPost, type PostGenerado } from "@/lib/marketing";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * `/marketing` Server Actions.
 *
 * Same defense model as `/core` and `/research`: the page is public, so the brake
 * is per requester fingerprint and writes only go through the server. And what
 * gets saved is checked again here, because it comes from the browser: if someone
 * edits the post before saving it and slips in an invented figure, it does not
 * get in.
 */

const PEDIDO = z.object({
  tema: z
    .string()
    .trim()
    .min(8, "Write a slightly longer topic: with fewer than 8 characters there is nothing to write about.")
    .max(200, "200 characters is enough."),
  canal: z.enum(CANALES),
});

/** Posts a single fingerprint can generate per hour. */
const TOPE_POR_HORA = 10;
const OPERACION = "marketing_post";

export type EstadoGenerador =
  | { estado: "vacio" }
  | { estado: "error"; mensaje: string }
  | { estado: "listo"; post: PostGenerado; canal: (typeof CANALES)[number]; tema: string; modelo: string };

export async function generarPost(_previo: EstadoGenerador, formData: FormData): Promise<EstadoGenerador> {
  const pedido = PEDIDO.safeParse({ tema: formData.get("tema"), canal: formData.get("canal") });
  if (!pedido.success) {
    return { estado: "error", mensaje: pedido.error.issues[0]?.message ?? "Check the topic and the channel." };
  }

  const huella = await huellaDeQuienPide();
  const admin = createAdminClient();
  const desde = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await admin
    .from("api_costs")
    .select("id", { count: "exact", head: true })
    .eq("operation", OPERACION)
    .eq("provider", `ip:${huella}`)
    .gte("created_at", desde);

  if ((count ?? 0) >= TOPE_POR_HORA) {
    return {
      estado: "error",
      mensaje: "You have generated several posts in the last hour. Wait a while and try again.",
    };
  }

  const resultado = await generarPostMarketing(pedido.data.tema, pedido.data.canal);

  // The cost is logged no matter what: it is what the limit counts.
  await admin.from("api_costs").insert({
    provider: `ip:${huella}`,
    operation: OPERACION,
    est_cost_usd: resultado.estCostUsd,
  });

  if (!resultado.ok) return { estado: "error", mensaje: resultado.message };

  return {
    estado: "listo",
    post: resultado.post,
    canal: pedido.data.canal,
    tema: pedido.data.tema,
    modelo: resultado.model,
  };
}

const GUARDAR = z.object({
  canal: z.enum(CANALES),
  tema: z.string().trim().min(8).max(200),
  post: z.unknown(),
});

export type EstadoGuardado = { ok: true; id: string } | { ok: false; mensaje: string };

export async function guardarPost(datos: { canal: string; tema: string; post: unknown }): Promise<EstadoGuardado> {
  const d = GUARDAR.safeParse(datos);
  if (!d.success) return { ok: false, mensaje: "Could not save: data is missing." };

  // Checked again: what arrives here came from the browser.
  const revision = revisarPost(d.data.post);
  if (!revision.ok) return { ok: false, mensaje: revision.mensaje };
  const { post } = revision;

  const id = `gen-${randomUUID()}`;
  const admin = createAdminClient();
  const { error } = await admin.from("marketing_assets").insert({
    id,
    tipo: "post",
    canal: d.data.canal,
    formato: post.formato,
    titulo: post.titulo,
    cuerpo: post.cuerpo,
    detalle: { hashtags: post.hashtags, tema: d.data.tema },
    origen: "generado_ia",
    aprobado: false,
    orden: 100,
  });

  if (error) {
    console.error("[marketing] could not save the post", error);
    return { ok: false, mensaje: "Could not save. Please try again." };
  }

  revalidatePath("/marketing");
  return { ok: true, id };
}

"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { generarPostMarketing } from "@/lib/ai/gemini";
import { huellaDeQuienPide } from "@/lib/ip";
import { CANALES, revisarPost, type PostGenerado } from "@/lib/marketing";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Server Actions de `/marketing`.
 *
 * Mismo modelo de defensa que `/core` y `/research`: la página es pública, así
 * que el freno va por la huella de quien pide y la escritura pasa solo por el
 * servidor. Y lo que se guarda se vuelve a revisar aquí, porque llega del
 * navegador: si alguien edita el post antes de guardarlo y le mete una cifra
 * inventada, no entra.
 */

const PEDIDO = z.object({
  tema: z
    .string()
    .trim()
    .min(8, "Escribe un tema un poco más largo: con menos de 8 caracteres no hay de qué escribir.")
    .max(200, "Con 200 caracteres alcanza."),
  canal: z.enum(CANALES),
});

/** Posts que puede generar una misma huella en una hora. */
const TOPE_POR_HORA = 10;
const OPERACION = "marketing_post";

export type EstadoGenerador =
  | { estado: "vacio" }
  | { estado: "error"; mensaje: string }
  | { estado: "listo"; post: PostGenerado; canal: (typeof CANALES)[number]; tema: string; modelo: string };

export async function generarPost(_previo: EstadoGenerador, formData: FormData): Promise<EstadoGenerador> {
  const pedido = PEDIDO.safeParse({ tema: formData.get("tema"), canal: formData.get("canal") });
  if (!pedido.success) {
    return { estado: "error", mensaje: pedido.error.issues[0]?.message ?? "Revisa el tema y el canal." };
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
      mensaje: "Ya generaste varios posts en la última hora. Espera un rato e inténtalo de nuevo.",
    };
  }

  const resultado = await generarPostMarketing(pedido.data.tema, pedido.data.canal);

  // El costo se registra pase lo que pase: es lo que hace de contador del límite.
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
  if (!d.success) return { ok: false, mensaje: "No se pudo guardar: faltan datos." };

  // Se revisa otra vez: lo que llega aquí salió del navegador.
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
    console.error("[marketing] no se pudo guardar el post", error);
    return { ok: false, mensaje: "No se pudo guardar. Inténtalo de nuevo." };
  }

  revalidatePath("/marketing");
  return { ok: true, id };
}

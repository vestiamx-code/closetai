"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { extraerNucleo } from "@/lib/ai/gemini";
import type { StyleCore } from "@/lib/ai/schemas";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Server Actions de `/core`.
 *
 * La página es pública a propósito —el punto es dar valor antes de pedir
 * registro— y eso obliga a defenderla de otra forma: sin sesión no hay a quién
 * limitarle nada, así que el freno va por IP y el guardado pasa solo por el
 * servidor. La tabla revoca `insert` a `anon`, de modo que nadie puede escribir
 * saltándose el contrato zod.
 */

const entradaSchema = z
  .string()
  .trim()
  .min(40, "Escribe un poco más — con menos de 40 caracteres no alcanzo a deducir nada.")
  .max(1000, "Con mil caracteres me sobra. Recorta un poco.");

export type EstadoCore =
  | { estado: "vacio" }
  | { estado: "error"; mensaje: string }
  | { estado: "listo"; core: StyleCore; entrada: string; modelo: string; versionPrompt: number };

/** Generaciones permitidas por IP en una hora. */
const TOPE_POR_HORA = 10;

async function ipDeQuienPide(): Promise<string> {
  const h = await headers();
  // Detrás del proxy de Vercel la IP real llega en x-forwarded-for.
  return (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || "desconocida";
}

async function pasaElLimite(ip: string): Promise<boolean> {
  const admin = createAdminClient();
  const desde = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await admin
    .from("api_costs")
    .select("id", { count: "exact", head: true })
    .eq("operation", "extract_core")
    .eq("provider", `ip:${ip}`)
    .gte("created_at", desde);
  return (count ?? 0) < TOPE_POR_HORA;
}

export async function generarNucleo(_previo: EstadoCore, formData: FormData): Promise<EstadoCore> {
  const datos = entradaSchema.safeParse(formData.get("texto"));
  if (!datos.success) {
    return { estado: "error", mensaje: datos.error.issues[0]?.message ?? "Revisa lo que escribiste." };
  }

  const ip = await ipDeQuienPide();
  if (!(await pasaElLimite(ip))) {
    return {
      estado: "error",
      mensaje: "Ya generaste varios núcleos en la última hora. Espera un rato e inténtalo de nuevo.",
    };
  }

  const resultado = await extraerNucleo(datos.data);

  // El costo se registra pase lo que pase: es lo que hace de contador del límite,
  // y sin él una llamada fallida saldría gratis del presupuesto.
  const admin = createAdminClient();
  await admin.from("api_costs").insert({
    provider: `ip:${ip}`,
    operation: "extract_core",
    est_cost_usd: resultado.estCostUsd,
  });

  if (!resultado.ok) {
    return {
      estado: "error",
      mensaje:
        resultado.reason === "rejected"
          ? resultado.message
          : "No pude leer bien lo que escribiste. Cuéntame cómo te gusta vestirte, con tus palabras.",
    };
  }

  return {
    estado: "listo",
    core: resultado.core,
    entrada: datos.data,
    modelo: resultado.model,
    versionPrompt: resultado.promptVersion,
  };
}

export async function guardarNucleo(formData: FormData): Promise<{ error?: string }> {
  const payload = formData.get("payload");
  if (typeof payload !== "string") return { error: "No hay nada que guardar." };

  let datos: { core: StyleCore; entrada: string; modelo: string; versionPrompt: number };
  try {
    datos = JSON.parse(payload);
  } catch {
    return { error: "No pudimos leer el núcleo." };
  }

  // Se vuelve a validar lo que llega del navegador. El payload viaja por el
  // cliente y una Server Action se puede llamar por POST directo: confiar en
  // que sigue siendo lo que generamos sería dejar la puerta abierta.
  const entrada = entradaSchema.safeParse(datos.entrada);
  if (!entrada.success) return { error: "La entrada ya no es válida." };

  const admin = createAdminClient();
  const { error } = await admin.from("core_outputs").insert({
    entrada: entrada.data,
    nucleo: datos.core,
    modelo: datos.modelo,
    version_prompt: datos.versionPrompt,
  });

  if (error) {
    console.error("[core] no se pudo guardar", error);
    return { error: "No pudimos guardarlo. Inténtalo otra vez." };
  }

  revalidatePath("/core");
  return {};
}

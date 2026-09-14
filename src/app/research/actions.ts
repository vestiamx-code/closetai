"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { generarInforme } from "@/lib/ai/gemini";
import { parseResearchReport, type ResearchReport } from "@/lib/ai/schemas";
import type { FuenteParaInforme, RiesgoParaInforme } from "@/lib/research";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Server Actions de `/research`.
 *
 * Mismo modelo de defensa que `/core`: la página es pública, así que el freno va
 * por IP y la escritura pasa solo por el servidor. Aquí hay una defensa extra:
 * al guardar se vuelven a comprobar las citas contra la base, porque un informe
 * con una fuente inventada se mostraría en la página como investigación verificada.
 */

const preguntaSchema = z
  .string()
  .trim()
  .min(20, "Escribe la pregunta completa — con menos de 20 caracteres no hay qué investigar.")
  .max(500, "Con 500 caracteres alcanza. Recórtala un poco.");

export type EstadoInvestigacion =
  | { estado: "vacio" }
  | { estado: "error"; mensaje: string }
  | { estado: "listo"; informe: ResearchReport; pregunta: string; modelo: string; versionPrompt: number };

/** Informes permitidos por IP en una hora. */
const TOPE_POR_HORA = 10;
const OPERACION = "research_report";

async function ipDeQuienPide(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || "desconocida";
}

async function pasaElLimite(ip: string): Promise<boolean> {
  const admin = createAdminClient();
  const desde = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await admin
    .from("api_costs")
    .select("id", { count: "exact", head: true })
    .eq("operation", OPERACION)
    .eq("provider", `ip:${ip}`)
    .gte("created_at", desde);
  return (count ?? 0) < TOPE_POR_HORA;
}

async function leerDatosVerificados(): Promise<{ fuentes: FuenteParaInforme[]; riesgos: RiesgoParaInforme[] }> {
  const admin = createAdminClient();
  const [fuentes, riesgos] = await Promise.all([
    admin.from("research_sources").select("id, nombre, tipo, pais, dato_clave, precio, leccion").order("orden"),
    admin.from("research_risks").select("riesgo, probabilidad, impacto, evidencia"),
  ]);
  if (fuentes.error || riesgos.error) {
    throw new Error(fuentes.error?.message ?? riesgos.error?.message);
  }
  return { fuentes: fuentes.data ?? [], riesgos: riesgos.data ?? [] };
}

export async function generarInvestigacion(
  _previo: EstadoInvestigacion,
  formData: FormData,
): Promise<EstadoInvestigacion> {
  const pregunta = preguntaSchema.safeParse(formData.get("pregunta"));
  if (!pregunta.success) {
    return { estado: "error", mensaje: pregunta.error.issues[0]?.message ?? "Revisa la pregunta." };
  }

  const ip = await ipDeQuienPide();
  if (!(await pasaElLimite(ip))) {
    return {
      estado: "error",
      mensaje: "Ya generaste varios informes en la última hora. Espera un rato e inténtalo de nuevo.",
    };
  }

  let datos: Awaited<ReturnType<typeof leerDatosVerificados>>;
  try {
    datos = await leerDatosVerificados();
  } catch (error) {
    console.error("[research] no se pudieron leer los datos", error);
    return { estado: "error", mensaje: "No pude leer los datos de investigación. Inténtalo en un momento." };
  }

  const resultado = await generarInforme(pregunta.data, datos.fuentes, datos.riesgos);

  // El costo se registra pase lo que pase: es el contador del límite por IP.
  const admin = createAdminClient();
  await admin.from("api_costs").insert({
    provider: `ip:${ip}`,
    operation: OPERACION,
    est_cost_usd: resultado.estCostUsd,
  });

  if (!resultado.ok) {
    const mensaje =
      resultado.reason === "invented_source"
        ? "El modelo citó algo que no está en los datos verificados, así que no muestro ese informe. Vuelve a intentarlo."
        : resultado.reason === "rejected" || resultado.reason === "unavailable"
          ? resultado.message
          : "No pude armar un informe confiable con esa pregunta. Prueba a formularla de otra forma.";
    return { estado: "error", mensaje };
  }

  return {
    estado: "listo",
    informe: resultado.informe,
    pregunta: pregunta.data,
    modelo: resultado.model,
    versionPrompt: resultado.promptVersion,
  };
}

export async function guardarInvestigacion(formData: FormData): Promise<{ error?: string }> {
  const payload = formData.get("payload");
  if (typeof payload !== "string") return { error: "No hay nada que guardar." };

  let datos: { informe?: unknown; pregunta?: unknown; modelo?: unknown; versionPrompt?: unknown };
  try {
    datos = JSON.parse(payload);
  } catch {
    return { error: "No pudimos leer el informe." };
  }

  const pregunta = preguntaSchema.safeParse(datos.pregunta);
  if (!pregunta.success) return { error: "La pregunta ya no es válida." };

  // Se revalida el informe completo —citas incluidas— contra la base. Una Server
  // Action se puede llamar por POST directo: sin esto, cualquiera guardaría un
  // "informe" con fuentes inventadas y la página lo mostraría como verificado.
  const admin = createAdminClient();
  const { data: ids, error: errorIds } = await admin.from("research_sources").select("id");
  if (errorIds) return { error: "No pudimos comprobar las fuentes. Inténtalo otra vez." };

  const validado = parseResearchReport(
    JSON.stringify(datos.informe ?? null),
    new Set((ids ?? []).map((f: { id: string }) => f.id)),
  );
  if (!validado.ok) return { error: "El informe ya no es válido." };

  const { error } = await admin.from("research_outputs").insert({
    pregunta: pregunta.data,
    informe: validado.informe,
    modelo: typeof datos.modelo === "string" ? datos.modelo : null,
    version_prompt: typeof datos.versionPrompt === "number" ? datos.versionPrompt : null,
  });

  if (error) {
    console.error("[research] no se pudo guardar", error);
    return { error: "No pudimos guardarlo. Inténtalo otra vez." };
  }

  revalidatePath("/research");
  return {};
}

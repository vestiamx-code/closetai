"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { generarInforme } from "@/lib/ai/gemini";
import { parseResearchReport, type ResearchReport } from "@/lib/ai/schemas";
import type { FuenteParaInforme, RiesgoParaInforme } from "@/lib/research";
import { huellaDeQuienPide } from "@/lib/ip";
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
  .min(20, "Write the full question — with fewer than 20 characters there is nothing to research.")
  .max(500, "500 characters is enough. Shorten it a little.");

export type EstadoInvestigacion =
  | { estado: "vacio" }
  | { estado: "error"; mensaje: string }
  | { estado: "listo"; informe: ResearchReport; pregunta: string; modelo: string; versionPrompt: number };

/** Informes permitidos por IP en una hora. */
const TOPE_POR_HORA = 10;
const OPERACION = "research_report";

async function pasaElLimite(huella: string): Promise<boolean> {
  const admin = createAdminClient();
  const desde = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await admin
    .from("api_costs")
    .select("id", { count: "exact", head: true })
    .eq("operation", OPERACION)
    .eq("provider", `ip:${huella}`)
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

  const huella = await huellaDeQuienPide();
  if (!(await pasaElLimite(huella))) {
    return {
      estado: "error",
      mensaje: "You have generated several reports in the last hour. Wait a while and try again.",
    };
  }

  let datos: Awaited<ReturnType<typeof leerDatosVerificados>>;
  try {
    datos = await leerDatosVerificados();
  } catch (error) {
    console.error("[research] no se pudieron leer los datos", error);
    return { estado: "error", mensaje: "I couldn't read the research data. Try again in a moment." };
  }

  const resultado = await generarInforme(pregunta.data, datos.fuentes, datos.riesgos);

  // El costo se registra pase lo que pase: es el contador del límite por IP.
  const admin = createAdminClient();
  await admin.from("api_costs").insert({
    provider: `ip:${huella}`,
    operation: OPERACION,
    est_cost_usd: resultado.estCostUsd,
  });

  if (!resultado.ok) {
    const mensaje =
      resultado.reason === "invented_source"
        ? "The model cited something that is not in the verified data, so I am not showing that report. Please try again."
        : resultado.reason === "rejected" || resultado.reason === "unavailable"
          ? resultado.message
          : "I couldn't build a reliable report for that question. Try phrasing it another way.";
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
  if (!pregunta.success) return { error: "The question is no longer valid." };

  // Se revalida el informe completo —citas incluidas— contra la base. Una Server
  // Action se puede llamar por POST directo: sin esto, cualquiera guardaría un
  // "informe" con fuentes inventadas y la página lo mostraría como verificado.
  const admin = createAdminClient();
  const { data: ids, error: errorIds } = await admin.from("research_sources").select("id");
  if (errorIds) return { error: "We couldn't check the sources. Please try again." };

  const validado = parseResearchReport(
    JSON.stringify(datos.informe ?? null),
    new Set((ids ?? []).map((f: { id: string }) => f.id)),
  );
  if (!validado.ok) return { error: "The report is no longer valid." };

  const { error } = await admin.from("research_outputs").insert({
    pregunta: pregunta.data,
    informe: validado.informe,
    modelo: typeof datos.modelo === "string" ? datos.modelo : null,
    version_prompt: typeof datos.versionPrompt === "number" ? datos.versionPrompt : null,
  });

  if (error) {
    console.error("[research] no se pudo guardar", error);
    return { error: "We couldn't save it. Please try again." };
  }

  revalidatePath("/research");
  return {};
}

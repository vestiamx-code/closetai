"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { huellaDeQuienPide } from "@/lib/ip";
import { calcular, type Supuestos } from "@/lib/precios";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Save a simulator scenario.
 *
 * Two rules that are not obvious from the screen:
 *
 * 1. **The server recalculates.** What the browser sends are the assumptions,
 *    not the result. If someone edits the JavaScript and sends an income of a
 *    million, what gets saved is still what the math gives for those
 *    assumptions. The screen asks; the server decides.
 * 2. **The IP is not stored.** The hourly limit needs to *tell IPs apart*, not
 *    know them, so a salted hash is stored. The salt is a key that already exists
 *    in the environment —no new variable was added— and without it an IP's hash
 *    could be guessed by trying all 4 billion.
 */

const SUPUESTOS = z.object({
  registros: z.object({
    nucleo: z.number().int().min(0).max(1_000_000),
    mayores: z.number().int().min(0).max(1_000_000),
  }),
  compranCompleto: z.object({
    nucleo: z.number().min(0).max(1),
    mayores: z.number().min(0).max(1),
  }),
  compranRecarga: z.object({
    nucleo: z.number().min(0).max(1),
    mayores: z.number().min(0).max(1),
  }),
  creditosAlMes: z.number().min(0).max(200),
  escenario: z.enum(["conservador", "base", "optimista"]),
});

const NOMBRE = z
  .string()
  .trim()
  .min(2, "Give the scenario a name, even a short one.")
  .max(60, "60 characters is enough.");

/** Scenarios a single IP can save per hour. */
const TOPE_POR_HORA = 20;

export type EstadoGuardado =
  | { estado: "vacio" }
  | { estado: "error"; mensaje: string }
  | { estado: "guardado"; nombre: string; ingresoNeto: number };

export async function guardarEscenario(
  _previo: EstadoGuardado,
  formData: FormData,
): Promise<EstadoGuardado> {
  const nombre = NOMBRE.safeParse(formData.get("nombre"));
  if (!nombre.success) {
    return { estado: "error", mensaje: nombre.error.issues[0]?.message ?? "Check the name." };
  }

  let supuestos: Supuestos;
  try {
    supuestos = SUPUESTOS.parse(JSON.parse(String(formData.get("supuestos") ?? "")));
  } catch {
    return { estado: "error", mensaje: "The assumptions could not be read. Please try again." };
  }

  const ip_hash = await huellaDeQuienPide();

  const admin = createAdminClient();
  const desde = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await admin
    .from("pricing_scenarios")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ip_hash)
    .gte("created_at", desde);

  if ((count ?? 0) >= TOPE_POR_HORA) {
    return {
      estado: "error",
      mensaje: "You have saved several scenarios in the last hour. Wait a while and try again.",
    };
  }

  // This is the point: the result that gets saved comes from this call, not from
  // the form.
  const resultado = calcular(supuestos);

  const { error } = await admin.from("pricing_scenarios").insert({
    nombre: nombre.data,
    escenario: supuestos.escenario,
    supuestos,
    resultado: {
      ingresoBruto: resultado.total.ingresoBruto,
      ingresoCobrado: resultado.total.ingresoCobrado,
      costoVariable: resultado.total.costoVariable,
      ingresoNeto: resultado.total.ingresoNeto,
      margen: resultado.total.margen,
      anualNeto: resultado.anual.ingresoNeto,
      porSegmento: resultado.porSegmento.map((s) => ({
        segmento: s.segmento,
        ingresoNeto: s.ingresoNeto,
        compradores: s.compradores,
      })),
    },
    ip_hash,
  });

  if (error) {
    console.error("[pricing] could not save the scenario", error);
    return { estado: "error", mensaje: "Could not save. Please try again." };
  }

  revalidatePath("/pricing");
  return { estado: "guardado", nombre: nombre.data, ingresoNeto: resultado.total.ingresoNeto };
}

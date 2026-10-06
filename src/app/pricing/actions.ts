"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { huellaDeQuienPide } from "@/lib/ip";
import { calcular, type Supuestos } from "@/lib/precios";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Guardar un escenario del simulador.
 *
 * Dos reglas que no son obvias desde la pantalla:
 *
 * 1. **El servidor recalcula.** Lo que manda el navegador son los supuestos, no
 *    el resultado. Si alguien edita el JavaScript y manda un ingreso de un
 *    millón, lo que se guarda sigue siendo lo que da la cuenta con esos
 *    supuestos. La pantalla pide; el servidor decide.
 * 2. **La IP no se guarda.** El límite por hora necesita *distinguir* IPs, no
 *    conocerlas, así que se guarda un hash con sal. La sal es una llave que ya
 *    existe en el entorno —no se agregó ninguna variable nueva— y sin ella el
 *    hash de una IP se podría adivinar probando las 4 mil millones.
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
  .min(2, "Ponle un nombre al escenario, aunque sea corto.")
  .max(60, "Con 60 caracteres alcanza.");

/** Escenarios que puede guardar una misma IP en una hora. */
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
    return { estado: "error", mensaje: nombre.error.issues[0]?.message ?? "Revisa el nombre." };
  }

  let supuestos: Supuestos;
  try {
    supuestos = SUPUESTOS.parse(JSON.parse(String(formData.get("supuestos") ?? "")));
  } catch {
    return { estado: "error", mensaje: "Los supuestos no se entendieron. Vuelve a intentarlo." };
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
      mensaje: "Ya guardaste varios escenarios en la última hora. Espera un rato e inténtalo de nuevo.",
    };
  }

  // Aquí está el punto: el resultado que se guarda sale de esta llamada, no del
  // formulario.
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
    console.error("[pricing] no se pudo guardar el escenario", error);
    return { estado: "error", mensaje: "No se pudo guardar. Inténtalo de nuevo." };
  }

  revalidatePath("/pricing");
  return { estado: "guardado", nombre: nombre.data, ingresoNeto: resultado.total.ingresoNeto };
}

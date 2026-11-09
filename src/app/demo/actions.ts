"use server";

import { headers } from "next/headers";

import { leerFormulario, pruebaSitioSchema } from "@/lib/prueba-sitio";
import { createAdminClient } from "@/lib/supabase/admin";

export type ResultadoPrueba = { ok: true } | { ok: false; error: string };

/**
 * Saves a full-site tester's summary (Week 6). No name is stored: the tester
 * number, the consent time and what they wrote to be shown on /demo.
 */
export async function guardarPruebaSitio(fd: FormData): Promise<ResultadoPrueba> {
  const datos = pruebaSitioSchema.safeParse(leerFormulario(fd));
  if (!datos.success) return { ok: false, error: datos.error.issues[0]?.message ?? "Check the form." };

  const esPrueba = (await headers()).get("x-cai-prueba") === "1";
  // Consent is required by the schema; what is stored is when it was given.
  const { tester, paginas, funciono, confuso, puntaje, lo_usaria } = datos.data;

  const { error } = await createAdminClient()
    .from("site_test_summaries")
    .insert({ tester, paginas, funciono, confuso, puntaje, lo_usaria, consentimiento_at: new Date().toISOString(), es_prueba: esPrueba });

  if (error?.code === "23505") {
    return { ok: false, error: "This tester link already has a summary. Thank you — there’s nothing else to do." };
  }
  if (error) {
    console.error("[demo] site test summary:", error.message);
    return { ok: false, error: "We couldn’t save your summary. Please try again in a minute." };
  }
  return { ok: true };
}

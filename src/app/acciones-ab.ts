"use server";

import { headers } from "next/headers";
import { z } from "zod";

import { traficoAutomatico, varianteDe } from "@/lib/ab";
import { huella } from "@/lib/ip";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Registrar una vista o un clic del experimento de la portada.
 *
 * Tres defensas, cada una por una razón concreta:
 *  1. La variante se recalcula aquí a partir del id. El navegador manda cuál vio,
 *     pero si no coincide con la que le toca, el evento se descarta: si no, se
 *     podría inflar una variante mandando eventos a mano.
 *  2. Una vista y un clic por visitante, impuesto por la base (unique). Recargar
 *     diez veces no cuenta diez veces.
 *  3. El tráfico de las pruebas automáticas lleva la cabecera `x-cai-prueba` y no
 *     se cuenta (ver playwright.config.ts). Sin esto, cada corrida de la suite
 *     contra producción ensuciaría el experimento con visitas que no son de nadie.
 *  4. Tampoco cuentan los navegadores automáticos ni los bots (ver
 *     `traficoAutomatico`): Vercel abre la portada después de cada despliegue, y
 *     cada vez sumaba visitantes. Se registra en el log qué tipo se descartó —solo
 *     la categoría, nunca el user-agent completo— para poder confirmarlo.
 */

const EVENTO = z.object({
  experimento: z.literal("titular"),
  variante: z.enum(["a", "b"]),
  visitante: z.string().uuid(),
  evento: z.enum(["vista", "clic"]),
});

export async function registrarEvento(datos: z.infer<typeof EVENTO>): Promise<void> {
  const e = EVENTO.safeParse(datos);
  if (!e.success) return;

  const h = await headers();
  if (h.get("x-cai-prueba") === "1") return;
  const automatico = traficoAutomatico(h.get("user-agent"));
  if (automatico) {
    console.info(`[ab] visita descartada: ${automatico}`);
    return;
  }

  const { experimento, variante, visitante, evento } = e.data;
  if (varianteDe(visitante, experimento) !== variante) return;

  const admin = createAdminClient();
  const { error } = await admin
    .from("ab_events")
    .upsert(
      { experimento, variante, evento, visitante_hash: huella(visitante) },
      { onConflict: "experimento,visitante_hash,evento", ignoreDuplicates: true },
    );
  if (error) console.error("[ab] no se pudo registrar el evento", error);
}

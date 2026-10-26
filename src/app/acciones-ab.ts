"use server";

import { headers } from "next/headers";
import { z } from "zod";

import { traficoAutomatico, varianteDe } from "@/lib/ab";
import { huella } from "@/lib/ip";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Record a view or a click in the homepage experiment.
 *
 * Four defenses, each for a concrete reason:
 *  1. The variant is recomputed here from the id. The browser says which one it
 *     saw, but if it doesn't match the one it should have, the event is dropped:
 *     otherwise a variant could be inflated by sending events by hand.
 *  2. One view and one click per visitor, enforced by the database (unique).
 *     Reloading ten times doesn't count ten times.
 *  3. Automated test traffic carries the `x-cai-prueba` header and is not counted
 *     (see playwright.config.ts). Without this, every run of the suite against
 *     production would pollute the experiment with visits that are nobody's.
 *  4. Automated browsers and bots are not counted either (see
 *     `traficoAutomatico`): Vercel opens the homepage after every deployment,
 *     and each time it added visitors. Only the discarded category is logged
 *     —never the full user agent— so the cause can be confirmed.
 */

const EVENTO = z.object({
  experimento: z.literal("headline"),
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
    console.info(`[ab] discarded visit: ${automatico}`);
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
  if (error) console.error("[ab] could not record the event", error);
}

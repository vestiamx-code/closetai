import "server-only";

import { createAdminClient } from "./supabase/admin";

/**
 * Control de gasto en APIs (§4.4).
 *
 * Dos frenos sobre el try-on, que es lo único que cuesta dinero de verdad:
 *
 *  1. **Automático**: si el gasto del día supera `MAX_DAILY_API_SPEND_USD`, el
 *     try-on se apaga solo. No depende de que alguien esté mirando.
 *  2. **Manual**: `TRYON_KILL_SWITCH=true` lo apaga a mano.
 *
 * El gasto se calcula sumando `api_costs`, que es la tabla donde cada llamada
 * facturable deja su registro. No hay un contador aparte que se pueda
 * desincronizar.
 */

export function topeDiarioUsd(): number {
  const valor = Number(process.env.MAX_DAILY_API_SPEND_USD);
  return Number.isFinite(valor) && valor > 0 ? valor : 5;
}

export async function gastoDeHoy(): Promise<number> {
  const admin = createAdminClient();
  const inicio = new Date();
  inicio.setHours(0, 0, 0, 0);

  const { data } = await admin
    .from("api_costs")
    .select("est_cost_usd")
    .gte("created_at", inicio.toISOString());

  return (data ?? []).reduce((suma, fila) => suma + Number(fila.est_cost_usd ?? 0), 0);
}

export type EstadoTryon =
  | { habilitado: true }
  | { habilitado: false; motivo: string; automatico: boolean };

export async function estadoTryon(): Promise<EstadoTryon> {
  if (process.env.TRYON_KILL_SWITCH === "true") {
    return {
      habilitado: false,
      automatico: false,
      motivo: "Virtual try-on is paused for maintenance. Come back later.",
    };
  }

  const gasto = await gastoDeHoy();
  if (gasto >= topeDiarioUsd()) {
    return {
      habilitado: false,
      automatico: true,
      motivo:
        "We reached today's virtual try-on limit. It will be available again tomorrow, and no credit was charged.",
    };
  }

  return { habilitado: true };
}

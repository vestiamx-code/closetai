import "server-only";

import { createAdminClient } from "./supabase/admin";

/**
 * Créditos: la moneda interna del try-on. 1 crédito = 1 render (§2.3).
 *
 * Todo pasa por el servidor con la llave de servicio, nunca desde el navegador.
 * El saldo no se guarda en ninguna columna: es la suma del ledger. Un saldo
 * almacenado se desincroniza; una suma no puede.
 */

export async function saldo(userId: string): Promise<number> {
  const admin = createAdminClient();
  const { data } = await admin.rpc("credit_balance", { p_user: userId });
  return Number(data ?? 0);
}

export type ResultadoDebito =
  | { ok: true; saldoRestante: number }
  | { ok: false; motivo: "sin_saldo" | "error" };

/**
 * Cobra créditos de forma atómica.
 *
 * La función de Postgres toma un lock por usuaria antes de leer el saldo: dos
 * renders disparados al mismo tiempo no pueden gastar el mismo crédito dos veces.
 * `ref` es único en la tabla, así que un reintento del mismo render tampoco
 * cobra dos veces.
 */
export async function cobrar(
  userId: string,
  cantidad: number,
  motivo: string,
  ref?: string,
): Promise<ResultadoDebito> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("debit_credits", {
    p_user: userId,
    p_amount: cantidad,
    p_reason: motivo,
    p_ref: ref ?? null,
  });

  if (error) {
    if (error.message.includes("insufficient_credits")) return { ok: false, motivo: "sin_saldo" };
    console.error("[creditos] falló el cobro", error);
    return { ok: false, motivo: "error" };
  }

  return { ok: true, saldoRestante: Number(data ?? 0) };
}

/**
 * Abona créditos. Solo lo llama el webhook de Stripe y el panel de soporte.
 *
 * `ref` lleva el id de la sesión de Stripe: el índice único sobre esa columna
 * es lo que impide que un webhook reenviado abone la compra dos veces.
 */
export async function abonar(
  userId: string,
  cantidad: number,
  motivo: string,
  ref: string,
): Promise<{ ok: boolean; duplicado?: boolean }> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("credit_ledger")
    .insert({ user_id: userId, delta: cantidad, reason: motivo, ref });

  if (error) {
    // 23505 = violación de índice único. Es el caso feliz de la idempotencia:
    // significa que este pago ya se había abonado.
    if (error.code === "23505") return { ok: true, duplicado: true };
    console.error("[creditos] falló el abono", error);
    return { ok: false };
  }

  return { ok: true };
}

import "server-only";

import Stripe from "stripe";

/**
 * Cliente de Stripe. Perezoso a propósito, igual que Supabase: el build de
 * producción corre sin secretos y no debe reventar al importar este módulo.
 */
let cliente: Stripe | null = null;

export function stripe(): Stripe {
  if (!cliente) {
    const llave = process.env.STRIPE_SECRET_KEY;
    if (!llave) throw new Error("Falta STRIPE_SECRET_KEY");
    cliente = new Stripe(llave);
  }
  return cliente;
}

/** Qué vende ClosetAI (§2.3). Los ids de precio viven en variables de entorno. */
export const PRODUCTOS = {
  lifetime: {
    price: () => process.env.STRIPE_PRICE_LIFETIME,
    creditos: 30,
    nombre: "ClosetAI Completo",
  },
  credits_20: {
    price: () => process.env.STRIPE_PRICE_CREDITS_20,
    creditos: 20,
    nombre: "Recarga de 20 créditos",
  },
} as const;

export type ProductoId = keyof typeof PRODUCTOS;

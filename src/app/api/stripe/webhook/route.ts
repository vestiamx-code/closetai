import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";

import { abonar } from "@/lib/credits";
import { PRODUCTOS, stripe, type ProductoId } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Webhook de Stripe: activa el plan y abona los créditos tras un pago.
 *
 * Tres cosas que este archivo tiene que hacer bien o se pierde dinero:
 *
 * 1. **Verificar la firma.** Sin eso, cualquiera podría mandar un POST fingiendo
 *    un pago y regalarse créditos.
 * 2. **Ser idempotente.** Stripe reenvía el evento si no recibe 200 rápido. El
 *    índice único en `credit_ledger.ref` y el `stripe_session_id` único en
 *    `purchases` son lo que impide abonar dos veces.
 * 3. **Responder 200 aunque algo interno falle**, si el pago ya se registró.
 *    Un 500 hace que Stripe reintente para siempre.
 */
export async function POST(request: NextRequest) {
  const firma = request.headers.get("stripe-signature");
  const secreto = process.env.STRIPE_WEBHOOK_SECRET;

  if (!firma || !secreto) {
    return NextResponse.json({ error: "sin firma" }, { status: 400 });
  }

  const cuerpo = await request.text();

  let evento: Stripe.Event;
  try {
    evento = stripe().webhooks.constructEvent(cuerpo, firma, secreto);
  } catch (error) {
    console.error("[webhook] firma inválida", error);
    return NextResponse.json({ error: "firma inválida" }, { status: 400 });
  }

  if (evento.type !== "checkout.session.completed") {
    return NextResponse.json({ recibido: true, ignorado: evento.type });
  }

  const sesion = evento.data.object as Stripe.Checkout.Session;
  const userId = sesion.metadata?.user_id;
  const productoId = sesion.metadata?.producto as ProductoId | undefined;

  if (!userId || !productoId || !(productoId in PRODUCTOS)) {
    // Se responde 200 a propósito: reintentar no va a arreglar unos metadatos
    // que nunca llegaron. Queda en el log para revisarlo a mano.
    console.error("[webhook] pago sin metadata utilizable", {
      session: sesion.id,
      metadata: sesion.metadata,
    });
    return NextResponse.json({ recibido: true, error: "sin metadata" });
  }

  const producto = PRODUCTOS[productoId];
  const admin = createAdminClient();

  const { error: errorCompra } = await admin.from("purchases").insert({
    user_id: userId,
    stripe_session_id: sesion.id,
    product: productoId,
    amount_mxn: Math.round((sesion.amount_total ?? 0) / 100),
    status: "paid",
  });

  // 23505 = ya estaba registrada. Es un reintento de Stripe: no hay nada que hacer.
  if (errorCompra && errorCompra.code === "23505") {
    return NextResponse.json({ recibido: true, duplicado: true });
  }
  if (errorCompra) {
    console.error("[webhook] no se pudo registrar la compra", errorCompra);
    return NextResponse.json({ error: "no se registró" }, { status: 500 });
  }

  const abono = await abonar(userId, producto.creditos, `compra:${productoId}`, sesion.id);
  if (!abono.ok) {
    console.error("[webhook] compra registrada pero créditos no abonados", { session: sesion.id });
    return NextResponse.json({ error: "créditos no abonados" }, { status: 500 });
  }

  if (productoId === "lifetime") {
    await admin.from("profiles").update({ plan: "lifetime" }).eq("id", userId);
  }

  return NextResponse.json({ recibido: true, creditos: producto.creditos });
}

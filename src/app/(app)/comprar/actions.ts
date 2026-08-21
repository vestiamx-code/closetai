"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";

import { requireUser } from "@/lib/auth";
import { PRODUCTOS, stripe, type ProductoId } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

async function urlDelSitio(): Promise<string> {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  return `${host.startsWith("localhost") ? "http" : "https"}://${host}`;
}

/**
 * Abre el checkout de Stripe.
 *
 * `metadata.user_id` va SIEMPRE. El documento lo marca como regla dura (§3.3 M7)
 * y la razón es simple: el webhook llega desde Stripe, no desde la sesión del
 * navegador. Sin ese dato, un pago recibido es dinero que no se sabe a quién
 * abonarle — dinero invisible.
 */
export async function iniciarCompra(formData: FormData): Promise<{ error?: string }> {
  const user = await requireUser();

  const parsed = z
    .object({ producto: z.enum(["lifetime", "credits_20"]) })
    .safeParse({ producto: formData.get("producto") });

  if (!parsed.success) return { error: "Producto inválido." };

  const producto = PRODUCTOS[parsed.data.producto as ProductoId];
  const price = producto.price();
  if (!price) return { error: "Ese producto no está configurado todavía." };

  // Quien ya compró el desbloqueo no lo vuelve a comprar: se le venden recargas.
  if (parsed.data.producto === "lifetime") {
    const supabase = await createClient();
    const { data: perfil } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .single();
    if (perfil?.plan === "lifetime") {
      return { error: "Ya tienes ClosetAI Completo. Lo que puedes comprar son recargas." };
    }
  }

  const base = await urlDelSitio();
  let url: string | null = null;

  try {
    const sesion = await stripe().checkout.sessions.create({
      mode: "payment",
      line_items: [{ price, quantity: 1 }],
      customer_email: user.email,
      success_url: `${base}/comprar/gracias?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/comprar`,
      locale: "es",
      metadata: {
        user_id: user.id,
        producto: parsed.data.producto,
      },
    });
    url = sesion.url;
  } catch (error) {
    console.error("[comprar] no se pudo crear la sesión", error);
    return { error: "No pudimos abrir el pago. Intenta de nuevo." };
  }

  if (!url) return { error: "No pudimos abrir el pago. Intenta de nuevo." };
  redirect(url);
}

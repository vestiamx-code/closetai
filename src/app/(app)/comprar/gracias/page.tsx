import type { Metadata } from "next";
import Link from "next/link";

import { requireUser } from "@/lib/auth";
import { saldo } from "@/lib/credits";

export const metadata: Metadata = { title: "Gracias" };

export default async function GraciasPage() {
  const user = await requireUser();
  const creditos = await saldo(user.id);

  return (
    <div className="mx-auto w-full max-w-lg px-6 py-20 text-center">
      <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        Listo, ya eres parte
      </h1>
      <p className="mt-4 leading-relaxed text-text-muted text-pretty">
        Tienes <strong className="text-text">{creditos} créditos</strong> de prueba virtual y el
        estilista completo desbloqueado.
      </p>
      <p className="mt-3 text-sm text-text-muted text-pretty">
        Si el saldo todavía dice cero, dale unos segundos y recarga: el pago se confirma con
        Stripe y a veces tarda un momento en llegar.
      </p>
      <Link
        href="/hoy"
        className="mt-8 inline-block rounded-lg bg-accent px-6 py-3 font-medium text-accent-contrast transition hover:opacity-90"
      >
        Ver mis outfits
      </Link>
    </div>
  );
}

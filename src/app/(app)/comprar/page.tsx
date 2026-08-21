import type { Metadata } from "next";

import { BotonComprar } from "./interacciones";
import { requireUser } from "@/lib/auth";
import { saldo } from "@/lib/credits";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "ClosetAI Completo" };

export default async function ComprarPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const [{ data: perfil }, creditos] = await Promise.all([
    supabase.from("profiles").select("plan").eq("id", user.id).single(),
    saldo(user.id),
  ]);

  const yaCompro = perfil?.plan === "lifetime";

  return (
    <div className="mx-auto w-full max-w-lg px-6 py-10">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        {yaCompro ? "Ya tienes ClosetAI Completo" : "Tu clóset siempre será gratis"}
      </h1>
      <p className="mt-2 text-text-muted">
        {yaCompro
          ? `Te quedan ${creditos} ${creditos === 1 ? "crédito" : "créditos"} de prueba virtual.`
          : "Esto es lo que se paga una sola vez."}
      </p>

      {!yaCompro ? (
        <div className="mt-8 rounded-xl border border-border bg-surface p-6">
          <p className="flex items-baseline gap-2">
            <span className="font-display text-5xl font-semibold text-accent">$100</span>
            <span className="text-sm text-text-muted">MXN · pago único</span>
          </p>

          <ul className="mt-6 space-y-3">
            {[
              "Estilista IA ilimitado",
              "30 créditos de prueba virtual",
              "Analiza qué le falta a tu clóset",
              "Sin mensualidades, para siempre",
            ].map((linea) => (
              <li key={linea} className="flex gap-3">
                <span aria-hidden className="text-accent">
                  ✓
                </span>
                <span>{linea}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6">
            <BotonComprar producto="lifetime" texto="Desbloquear ClosetAI Completo" />
          </div>
        </div>
      ) : null}

      <div className="mt-6 rounded-xl border border-border bg-surface p-6">
        <h2 className="font-display text-lg font-semibold">Recarga de créditos</h2>
        <p className="mt-1 text-sm text-text-muted">
          20 pruebas virtuales más, por <strong>$49 MXN</strong>.
        </p>
        <div className="mt-4">
          <BotonComprar producto="credits_20" texto="Recargar 20 créditos" variante="secundario" />
        </div>
      </div>

      <p className="mt-8 text-center text-sm text-text-muted text-pretty">
        Tus prendas y tus fotos siguen siendo tuyas, pagues o no. El clóset es gratis e ilimitado
        para siempre.
      </p>
    </div>
  );
}

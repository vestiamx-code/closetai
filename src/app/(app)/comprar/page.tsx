import type { Metadata } from "next";

import { BotonComprar } from "./interacciones";
import { requireUser } from "@/lib/auth";
import { saldo } from "@/lib/credits";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "ClosetAI Completo" };

export default async function ComprarPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const [{ data: perfil }, creditos, { data: movimientos }] = await Promise.all([
    supabase.from("profiles").select("plan").eq("id", user.id).single(),
    saldo(user.id),
    // El historial es de la usuaria y no se mostraba en ningún lado. Si cobramos
    // por crédito, tiene derecho a ver en qué se fueron sin preguntarnos.
    supabase
      .from("credit_ledger")
      .select("id, delta, reason, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
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

      {movimientos && movimientos.length > 0 ? (
        <section className="mt-10">
          <h2 className="font-display text-lg font-semibold">Tus movimientos</h2>
          <ul className="mt-3 divide-y divide-border border-t border-border">
            {movimientos.map((m) => (
              <li key={m.id} className="flex items-baseline justify-between gap-4 py-2.5 text-sm">
                <span className="text-text-muted">
                  {NOMBRE_MOVIMIENTO[m.reason] ?? m.reason}
                  <span className="ml-2 text-xs">{fecha(m.created_at)}</span>
                </span>
                <span className={m.delta > 0 ? "font-medium text-accent" : "text-text-muted"}>
                  {m.delta > 0 ? `+${m.delta}` : m.delta}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="mt-10 text-center text-sm text-text-muted text-pretty">
        Tus prendas y tus fotos siguen siendo tuyas, pagues o no. El clóset es gratis e ilimitado
        para siempre.
      </p>
    </div>
  );
}

/** Los motivos se guardan en clave; a la usuaria se le muestran en su idioma. */
const NOMBRE_MOVIMIENTO: Record<string, string> = {
  "compra:lifetime": "Desbloqueo de ClosetAI Completo",
  "compra:credits_20": "Recarga de 20 créditos",
  tryon: "Prueba virtual",
};

function fecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AbonarCreditos } from "./interacciones";
import { requireUser } from "@/lib/auth";
import { estadoTryon, gastoDeHoy, topeDiarioUsd } from "@/lib/gasto";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Panel" };

/** Quién puede entrar. Lista blanca por correo, en variable de entorno (§3.3 M8). */
function esAdmin(email: string | undefined): boolean {
  if (!email) return false;
  const permitidos = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean);
  return permitidos.includes(email.toLowerCase());
}

async function contar(tabla: string, desdeHoy = false): Promise<number> {
  const admin = createAdminClient();
  let q = admin.from(tabla).select("*", { count: "exact", head: true });
  if (desdeHoy) {
    const inicio = new Date();
    inicio.setHours(0, 0, 0, 0);
    q = q.gte("created_at", inicio.toISOString());
  }
  const { count } = await q;
  return count ?? 0;
}

export default async function AdminPage() {
  const user = await requireUser();

  // 404 en vez de "no tienes permiso": no se le confirma a nadie que /admin existe.
  if (!esAdmin(user.email)) notFound();

  const admin = createAdminClient();
  const inicio = new Date();
  inicio.setHours(0, 0, 0, 0);

  const [
    usuarias,
    prendas,
    prendasHoy,
    outfits,
    outfitsHoy,
    renders,
    rendersHoy,
    gasto,
    estado,
    { data: ledger },
    { data: clics },
  ] = await Promise.all([
    contar("profiles"),
    contar("garments"),
    contar("garments", true),
    contar("outfits"),
    contar("outfits", true),
    contar("tryon_renders"),
    contar("tryon_renders", true),
    gastoDeHoy(),
    estadoTryon(),
    admin.from("credit_ledger").select("delta, reason"),
    admin.from("affiliate_clicks").select("retailer"),
  ]);

  const vendidos = (ledger ?? [])
    .filter((m) => Number(m.delta) > 0)
    .reduce((s, m) => s + Number(m.delta), 0);
  const quemados = (ledger ?? [])
    .filter((m) => Number(m.delta) < 0)
    .reduce((s, m) => s + Math.abs(Number(m.delta)), 0);

  const tope = topeDiarioUsd();
  const porcentaje = Math.min(100, Math.round((gasto / tope) * 100));

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Panel</h1>
      <p className="mt-1 text-text-muted">
        {new Date().toLocaleDateString("es-MX", { dateStyle: "full" })}
      </p>

      <section className="mt-8 rounded-xl border border-border bg-surface p-5">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-display text-lg font-semibold">Gasto de hoy</h2>
          <span className="font-display text-2xl font-semibold">
            ${gasto.toFixed(4)} <span className="text-sm text-text-muted">de ${tope} USD</span>
          </span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2">
          <div
            className={`h-full rounded-full ${porcentaje > 80 ? "bg-red-500" : "bg-accent"}`}
            style={{ width: `${porcentaje}%` }}
          />
        </div>
        <p className="mt-3 text-sm">
          Prueba virtual:{" "}
          {estado.habilitado ? (
            <span className="text-accent">activa</span>
          ) : (
            <span className="text-red-600 dark:text-red-400">
              apagada — {estado.automatico ? "por límite de gasto" : "a mano"}
            </span>
          )}
        </p>
        {!estado.habilitado ? (
          <p className="mt-1 text-xs text-text-muted text-pretty">{estado.motivo}</p>
        ) : null}
      </section>

      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Metrica titulo="Usuarias" valor={usuarias} />
        <Metrica titulo="Prendas" valor={prendas} hoy={prendasHoy} />
        <Metrica titulo="Outfits" valor={outfits} hoy={outfitsHoy} />
        <Metrica titulo="Renders" valor={renders} hoy={rendersHoy} />
        <Metrica titulo="Créditos vendidos" valor={vendidos} />
        <Metrica titulo="Créditos usados" valor={quemados} />
        <Metrica titulo="Clics a tiendas" valor={(clics ?? []).length} />
      </section>

      <section className="mt-8 rounded-xl border border-border bg-surface p-5">
        <h2 className="font-display text-lg font-semibold">Abonar créditos a mano</h2>
        <p className="mt-1 text-sm text-text-muted text-pretty">
          Para soporte: cuando a alguien le falló un render y hay que devolverle el crédito.
        </p>
        <AbonarCreditos />
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold">Apagar la prueba virtual</h2>
        <p className="mt-1 text-sm leading-relaxed text-text-muted text-pretty">
          Se apaga sola al llegar a ${tope} USD de gasto en el día. Para apagarla a mano, pon{" "}
          <code className="rounded bg-surface-2 px-1.5 py-0.5 text-xs">TRYON_KILL_SWITCH=true</code>{" "}
          en Vercel y redespliega — tarda un par de minutos, y por eso el corte automático es el
          freno que de verdad importa.
        </p>
      </section>
    </div>
  );
}

function Metrica({ titulo, valor, hoy }: { titulo: string; valor: number; hoy?: number }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-xs text-text-muted">{titulo}</p>
      <p className="mt-1 font-display text-2xl font-semibold">{valor}</p>
      {hoy !== undefined ? <p className="text-xs text-text-muted">+{hoy} hoy</p> : null}
    </div>
  );
}

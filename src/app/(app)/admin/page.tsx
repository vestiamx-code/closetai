import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AbonarCreditos, MarcarRevisada } from "./interacciones";
import { NOMBRE_MOTIVO, type MotivoGuardrail } from "@/lib/chat";
import { requireUser } from "@/lib/auth";
import { estadoTryon, gastoDeHoy, topeDiarioUsd } from "@/lib/gasto";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Admin" };

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
    { data: porRevisar },
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
    // The /chat human checkpoint: flagged and not reviewed yet, with the messages
    // the person wrote, so the reason can be judged in context.
    admin
      .from("chat_sessions")
      .select("id, created_at, motivo_revision, es_prueba, tester, chat_messages(rol, contenido, created_at)")
      .eq("needs_review", true)
      .is("revisado_at", null)
      .order("created_at", { ascending: false })
      .limit(30),
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
      <h1 className="font-display text-3xl font-semibold tracking-tight">Admin</h1>
      <p className="mt-1 text-text-muted">
        {new Date().toLocaleDateString("en-US", { dateStyle: "full" })}
      </p>

      <section className="mt-8 rounded-xl border border-border bg-surface p-5">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-display text-lg font-semibold">Today’s spend</h2>
          <span className="font-display text-2xl font-semibold">
            ${gasto.toFixed(4)} <span className="text-sm text-text-muted">of ${tope} USD</span>
          </span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2">
          <div
            className={`h-full rounded-full ${porcentaje > 80 ? "bg-red-500" : "bg-accent"}`}
            style={{ width: `${porcentaje}%` }}
          />
        </div>
        <p className="mt-3 text-sm">
          Virtual try-on:{" "}
          {estado.habilitado ? (
            <span className="text-accent">on</span>
          ) : (
            <span className="text-red-600 dark:text-red-400">
              off — {estado.automatico ? "spend limit reached" : "turned off by hand"}
            </span>
          )}
        </p>
        {!estado.habilitado ? (
          <p className="mt-1 text-xs text-text-muted text-pretty">{estado.motivo}</p>
        ) : null}
      </section>

      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Metrica titulo="Users" valor={usuarias} />
        <Metrica titulo="Garments" valor={prendas} hoy={prendasHoy} />
        <Metrica titulo="Outfits" valor={outfits} hoy={outfitsHoy} />
        <Metrica titulo="Renders" valor={renders} hoy={rendersHoy} />
        <Metrica titulo="Credits sold" valor={vendidos} />
        <Metrica titulo="Credits used" valor={quemados} />
        <Metrica titulo="Store clicks" valor={(clics ?? []).length} />
      </section>

      <section data-testid="por-revisar" className="mt-8 rounded-xl border border-border bg-surface p-5">
        <h2 className="font-display text-lg font-semibold">
          /chat conversations to review · {porRevisar?.length ?? 0}
        </h2>
        <p className="mt-1 text-sm text-text-muted text-pretty">
          The human checkpoint: the assistant stopped these and told the person someone would look at them.
        </p>
        {porRevisar && porRevisar.length > 0 ? (
          <ul className="mt-4 space-y-3">
            {porRevisar.map((s) => {
              const escritos = ((s.chat_messages ?? []) as Array<{ rol: string; contenido: string; created_at: string }>)
                .filter((m) => m.rol === "usuaria")
                .sort((a, b) => a.created_at.localeCompare(b.created_at));
              return (
                <li key={s.id} className="rounded-lg border border-border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
                      <span className="rounded-full border border-current px-2 py-0.5" style={{ color: "var(--barro)" }}>
                        {NOMBRE_MOTIVO[s.motivo_revision as MotivoGuardrail] ?? s.motivo_revision}
                      </span>
                      {new Date(s.created_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                      {s.tester ? <span>· tester {s.tester}</span> : null}
                      {s.es_prueba ? <span>· automated test</span> : null}
                    </span>
                    <MarcarRevisada sessionId={s.id} />
                  </div>
                  <ol className="mt-2 space-y-1 text-sm">
                    {escritos.map((m, i) => (
                      <li key={i} className="text-pretty">“{m.contenido}”</li>
                    ))}
                  </ol>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-text-muted">Nothing to review.</p>
        )}
      </section>

      <section className="mt-8 rounded-xl border border-border bg-surface p-5">
        <h2 className="font-display text-lg font-semibold">Add credits by hand</h2>
        <p className="mt-1 text-sm text-text-muted text-pretty">
          For support: when someone’s render failed and the credit has to be returned.
        </p>
        <AbonarCreditos />
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold">Turn off virtual try-on</h2>
        <p className="mt-1 text-sm leading-relaxed text-text-muted text-pretty">
          It turns itself off when the day’s spend reaches ${tope} USD. To turn it off by hand, set{" "}
          <code className="rounded bg-surface-2 px-1.5 py-0.5 text-xs">TRYON_KILL_SWITCH=true</code>{" "}
          in Vercel and redeploy — it takes a couple of minutes, which is why the automatic cutoff is
          the brake that really matters.
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
      {hoy !== undefined ? <p className="text-xs text-text-muted">+{hoy} today</p> : null}
    </div>
  );
}

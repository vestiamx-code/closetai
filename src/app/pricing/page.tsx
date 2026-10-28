import type { Metadata } from "next";
import Link from "next/link";

import { EN_INGLES_DESDE } from "@/lib/marketing";
import { ESCENARIOS, pesos } from "@/lib/precios";
import { createAdminClient } from "@/lib/supabase/admin";

import { Simulador } from "./simulador";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "ClosetAI's three plans, what each one costs to run, and a simulator where every assumption says where it came from.",
};

// Saved scenarios have to reflect what just happened.
export const dynamic = "force-dynamic";

const PACKET =
  "https://github.com/vestiamx-code/closetai/blob/main/docs/SEMANA-3-PACKET.md";

type Plan = {
  id: string;
  nombre: string;
  precio_mxn: number;
  cobro: "gratis" | "unico" | "recarga";
  resumen: string;
  incluye: string[];
  costo_nota: string;
};

type Supuesto = {
  id: string;
  concepto: string;
  valor: string;
  origen: string;
  fuente_url: string | null;
  verificado: boolean;
  verificado_el: string | null;
  en_el_calculo: boolean;
};

type EscenarioGuardado = {
  id: string;
  nombre: string;
  escenario: string;
  resultado: { ingresoNeto?: number; anualNeto?: number; margen?: number } | null;
  created_at: string;
};

const COMO_SE_COBRA: Record<Plan["cobro"], string> = {
  gratis: "Forever",
  unico: "One payment",
  recarga: "When you run out",
};

/**
 * `/pricing` — Week 3.
 *
 * The three plans with their cost alongside, and a revenue simulator where every
 * assumption says whether it is verified or a bet. The arithmetic lives in
 * `src/lib/precios.ts` and is tested separately: here it is only displayed.
 */
export default async function Pricing() {
  const admin = createAdminClient();

  const [planesR, supuestosR, guardadosR] = await Promise.all([
    admin.from("pricing_plans").select("*").order("orden"),
    admin.from("pricing_assumptions").select("*").order("orden"),
    // Scenarios are read here, with the service key: the table stores the hash of
    // the IP of whoever simulated, so it is not open to the public key.
    admin
      .from("pricing_scenarios")
      .select("id, nombre, escenario, resultado, created_at")
      .gte("created_at", EN_INGLES_DESDE)
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  if (planesR.error || supuestosR.error) {
    console.error("[pricing] could not read the data", planesR.error ?? supuestosR.error);
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-20">
        <h1 className="font-display text-3xl font-semibold">Pricing</h1>
        <p className="mt-4 text-text-muted">Pricing is not available right now.</p>
      </main>
    );
  }

  const planes = (planesR.data ?? []) as Plan[];
  const supuestos = (supuestosR.data ?? []) as Supuesto[];
  const guardados = (guardadosR.data ?? []) as EscenarioGuardado[];
  const enElCalculo = supuestos.filter((s) => s.en_el_calculo);
  const contexto = supuestos.filter((s) => !s.en_el_calculo);
  const verificados = enElCalculo.filter((s) => s.verificado).length;

  return (
    <main className="flex-1">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <Link href="/" className="font-display text-xl font-semibold tracking-tight">
          ClosetAI
        </Link>
        <Link
          href="/product"
          className="rounded-full border border-border px-5 py-2 text-sm transition hover:border-text"
        >
          What each plan includes
        </Link>
      </header>

      <div className="mx-auto w-full max-w-5xl px-6 pb-24">
        <p className="text-xs tracking-[0.2em] text-text-muted uppercase">Pricing</p>
        <h1 className="mt-4 max-w-3xl font-display text-[clamp(2.25rem,6vw,3.75rem)] leading-[0.98] font-semibold tracking-[-0.03em] text-balance">
          One payment.{" "}
          <span className="italic" style={{ color: "var(--barro)" }}>
            And the full math.
          </span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-text-muted text-pretty">
          Each plan shows what it costs us to run, not just what it costs to buy. Below, you can move the
          assumptions yourself: how many people sign up, how many pay, how often they try clothes on. Of
          the {enElCalculo.length} assumptions in the calculation, {verificados} are verified; the rest are
          labelled for what they are.
        </p>

        {/* ------------------------------------------------------------ Planes */}
        <section aria-label="Plans" data-testid="planes" className="mt-12 grid gap-4 md:grid-cols-3">
          {planes.map((p) => (
            <article
              key={p.id}
              data-plan={p.id}
              className={`flex flex-col rounded-2xl border bg-surface p-6 ${
                p.cobro === "unico" ? "border-2" : "border-border"
              }`}
              style={p.cobro === "unico" ? { borderColor: "var(--barro)" } : undefined}
            >
              <p className="text-xs tracking-[0.14em] text-text-muted uppercase">{COMO_SE_COBRA[p.cobro]}</p>
              <h2 className="mt-2 font-display text-xl font-semibold">{p.nombre}</h2>
              <p className="mt-2 font-display text-3xl font-semibold tabular-nums">
                {p.precio_mxn === 0 ? "$0" : pesos(p.precio_mxn)}
              </p>
              <p className="mt-3 leading-relaxed">{p.resumen}</p>
              <ul className="mt-4 flex-1 space-y-2 text-sm">
                {p.incluye.map((i) => (
                  <li key={i} className="flex gap-2">
                    <span aria-hidden>·</span>
                    <span>{i}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-5 border-t border-border pt-3 text-sm text-text-muted">{p.costo_nota}</p>
            </article>
          ))}
        </section>

        {/* ------------------------------------------------------------ Simulador */}
        <Seccion
          id="simulador"
          titulo="Revenue simulator"
          bajada="Two segments, three scenarios. It models one typical month and repeats it twelve times: it does not invent retention, because ClosetAI does not have a single paying customer to learn it from yet."
        >
          <Simulador />
        </Seccion>

        {/* ------------------------------------------------------------ Supuestos */}
        <Seccion
          id="supuestos"
          titulo="Where every number comes from"
          bajada="Verified and assumed are never mixed. It is the same rule as the research page."
        >
          <div className="mt-6 overflow-x-auto">
            <table data-testid="tabla-supuestos" className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs tracking-[0.1em] text-text-muted uppercase">
                  <th scope="col" className="py-2">Assumption</th>
                  <th scope="col" className="py-2">Value</th>
                  <th scope="col" className="py-2">Where it comes from</th>
                  <th scope="col" className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {enElCalculo.map((s) => (
                  <tr key={s.id} data-supuesto={s.id} className="border-b border-border align-top">
                    <td className="py-3 pr-3 font-medium">{s.concepto}</td>
                    <td className="py-3 pr-3 tabular-nums">{s.valor}</td>
                    <td className="py-3 pr-3 text-text-muted">
                      {s.origen}
                      {s.fuente_url ? (
                        <>
                          {" "}
                          <a
                            href={s.fuente_url}
                            target="_blank"
                            rel="noreferrer"
                            className="underline underline-offset-4 hover:text-text"
                          >
                            source
                          </a>
                        </>
                      ) : null}
                    </td>
                    <td className="py-3">
                      <Sello verificado={s.verificado} fecha={s.verificado_el} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="mt-10 font-display text-xl font-semibold">Context that is not part of the calculation</h3>
          <ul className="mt-4 space-y-3 text-sm">
            {contexto.map((s) => (
              <li key={s.id} data-supuesto={s.id} className="rounded-xl border border-border bg-surface p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{s.concepto}:</span>
                  <span>{s.valor}</span>
                  <Sello verificado={s.verificado} fecha={s.verificado_el} />
                </div>
                <p className="mt-2 text-text-muted">
                  {s.origen}
                  {s.fuente_url ? (
                    <>
                      {" "}
                      <a
                        href={s.fuente_url}
                        target="_blank"
                        rel="noreferrer"
                        className="underline underline-offset-4 hover:text-text"
                      >
                        source
                      </a>
                    </>
                  ) : null}
                </p>
              </li>
            ))}
          </ul>
        </Seccion>

        {/* ------------------------------------------------------------ Guardados */}
        <Seccion
          id="guardados"
          titulo="Saved scenarios"
          bajada="What other people —and I— have simulated. The number is the one the server calculated."
        >
          {guardados.length === 0 ? (
            <p data-testid="sin-escenarios" className="mt-6 text-text-muted">
              No saved scenarios yet. The first one could be yours.
            </p>
          ) : (
            <ul data-testid="lista-escenarios" className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {guardados.map((g) => (
                <li key={g.id} data-escenario-guardado={g.id} className="rounded-xl border border-border bg-surface p-5">
                  <p className="text-xs tracking-[0.14em] text-text-muted uppercase">{ESCENARIOS.find((e) => e.id === g.escenario)?.nombre ?? g.escenario}</p>
                  <p className="mt-2 leading-snug font-medium">{g.nombre}</p>
                  <p className="mt-3 font-display text-2xl font-semibold tabular-nums">
                    {pesos(g.resultado?.ingresoNeto ?? 0)}
                  </p>
                  <p className="text-sm text-text-muted">net per month</p>
                  <p className="mt-3 border-t border-border pt-3 text-sm text-text-muted">
                    {pesos(g.resultado?.anualNeto ?? 0)} over twelve months ·{" "}
                    {new Date(g.created_at).toLocaleDateString("en-US", { day: "numeric", month: "long" })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Seccion>

        <p className="mt-16 border-t border-border pt-6 text-sm text-text-muted">
          This week’s plan, written before the code, is in{" "}
          <a href={PACKET} className="underline underline-offset-4 hover:text-text">
            SEMANA-3-PACKET.md
          </a>
          . The arithmetic lives in a single file, <code>src/lib/precios.ts</code>, and has its own
          tests.
        </p>
      </div>
    </main>
  );
}

function Sello({ verificado, fecha }: { verificado: boolean; fecha: string | null }) {
  if (!verificado) {
    return (
      <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-text-muted">assumption</span>
    );
  }
  return (
    <span
      className="rounded-full border px-2.5 py-0.5 text-xs"
      style={{ borderColor: "var(--verde, #2f6b43)", color: "var(--verde, #2f6b43)" }}
      title={fecha ? `Verified on ${fecha}` : undefined}
    >
      verified
    </span>
  );
}

function Seccion({
  id,
  titulo,
  bajada,
  children,
}: {
  id: string;
  titulo: string;
  bajada?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-titulo`} className="mt-20 border-t border-border pt-10">
      <h2 id={`${id}-titulo`} className="font-display text-3xl font-semibold tracking-tight">
        {titulo}
      </h2>
      {bajada ? <p className="mt-2 max-w-2xl text-text-muted">{bajada}</p> : null}
      {children}
    </section>
  );
}

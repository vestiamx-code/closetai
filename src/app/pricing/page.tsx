import type { Metadata } from "next";
import Link from "next/link";

import { pesos } from "@/lib/precios";
import { createAdminClient } from "@/lib/supabase/admin";

import { Simulador } from "./simulador";

export const metadata: Metadata = {
  title: "Precios · ClosetAI",
  description:
    "Los tres planes de ClosetAI, lo que cuesta servir cada uno, y un simulador donde cada supuesto dice de dónde salió.",
};

// Los escenarios guardados tienen que reflejar lo que acaba de pasar.
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
  gratis: "Para siempre",
  unico: "Un solo pago",
  recarga: "Cuando se te acaben",
};

/**
 * `/pricing` — Semana 3.
 *
 * Los tres planes con su costo al lado, y un simulador de ingresos donde cada
 * supuesto dice si está verificado o si es una apuesta. La aritmética vive en
 * `src/lib/precios.ts` y está probada aparte: aquí solo se muestra.
 */
export default async function Pricing() {
  const admin = createAdminClient();

  const [planesR, supuestosR, guardadosR] = await Promise.all([
    admin.from("pricing_plans").select("*").order("orden"),
    admin.from("pricing_assumptions").select("*").order("orden"),
    // Los escenarios se leen aquí, con la llave de servicio: la tabla guarda el
    // hash de la IP de quien simuló y no se abre a la llave pública.
    admin
      .from("pricing_scenarios")
      .select("id, nombre, escenario, resultado, created_at")
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  if (planesR.error || supuestosR.error) {
    console.error("[pricing] no se pudieron leer los datos", planesR.error ?? supuestosR.error);
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-20">
        <h1 className="font-display text-3xl font-semibold">Precios</h1>
        <p className="mt-4 text-text-muted">Los precios no están disponibles en este momento.</p>
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
          Qué incluye cada plan
        </Link>
      </header>

      <div className="mx-auto w-full max-w-5xl px-6 pb-24">
        <p className="text-xs tracking-[0.2em] text-text-muted uppercase">Precios</p>
        <h1 className="mt-4 max-w-3xl font-display text-[clamp(2.25rem,6vw,3.75rem)] leading-[0.98] font-semibold tracking-[-0.03em] text-balance">
          Un pago.{" "}
          <span className="italic" style={{ color: "var(--barro)" }}>
            Y la cuenta completa.
          </span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-text-muted text-pretty">
          Cada plan dice lo que cuesta servirlo, no solo lo que cuesta comprarlo. Y abajo puedes mover
          los supuestos tú misma: cuántas personas se registran, cuántas pagan, cuánto se prueban ropa.
          De los {enElCalculo.length} supuestos que entran en la cuenta, {verificados} están
          verificados; los demás están marcados como lo que son.
        </p>

        {/* ------------------------------------------------------------ Planes */}
        <section aria-label="Planes" data-testid="planes" className="mt-12 grid gap-4 md:grid-cols-3">
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
          titulo="Simulador de ingresos"
          bajada="Dos segmentos, tres escenarios. Modela un mes típico y lo repite doce veces: no inventa retención, porque ClosetAI todavía no tiene un solo cliente de pago del cual aprenderla."
        >
          <Simulador />
        </Seccion>

        {/* ------------------------------------------------------------ Supuestos */}
        <Seccion
          id="supuestos"
          titulo="De dónde sale cada número"
          bajada="Lo verificado y lo supuesto no se mezclan. Es la misma regla de la página de investigación."
        >
          <div className="mt-6 overflow-x-auto">
            <table data-testid="tabla-supuestos" className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs tracking-[0.1em] text-text-muted uppercase">
                  <th scope="col" className="py-2">Supuesto</th>
                  <th scope="col" className="py-2">Valor</th>
                  <th scope="col" className="py-2">De dónde sale</th>
                  <th scope="col" className="py-2">Estado</th>
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
                            fuente
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

          <h3 className="mt-10 font-display text-xl font-semibold">Contexto que no entra en la cuenta</h3>
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
                        fuente
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
          titulo="Escenarios guardados"
          bajada="Lo que otras personas —y yo— hemos simulado. El número es el que calculó el servidor."
        >
          {guardados.length === 0 ? (
            <p data-testid="sin-escenarios" className="mt-6 text-text-muted">
              Todavía no hay escenarios guardados. El primero puede ser el tuyo.
            </p>
          ) : (
            <ul data-testid="lista-escenarios" className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {guardados.map((g) => (
                <li key={g.id} data-escenario-guardado={g.id} className="rounded-xl border border-border bg-surface p-5">
                  <p className="text-xs tracking-[0.14em] text-text-muted uppercase">{g.escenario}</p>
                  <p className="mt-2 leading-snug font-medium">{g.nombre}</p>
                  <p className="mt-3 font-display text-2xl font-semibold tabular-nums">
                    {pesos(g.resultado?.ingresoNeto ?? 0)}
                  </p>
                  <p className="text-sm text-text-muted">neto al mes</p>
                  <p className="mt-3 border-t border-border pt-3 text-sm text-text-muted">
                    {pesos(g.resultado?.anualNeto ?? 0)} a doce meses ·{" "}
                    {new Date(g.created_at).toLocaleDateString("es-MX", { day: "numeric", month: "long" })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Seccion>

        <p className="mt-16 border-t border-border pt-6 text-sm text-text-muted">
          El plan de esta semana, escrito antes del código, está en{" "}
          <a href={PACKET} className="underline underline-offset-4 hover:text-text">
            SEMANA-3-PACKET.md
          </a>
          . La aritmética vive en un solo archivo, <code>src/lib/precios.ts</code>, y tiene sus propias
          pruebas.
        </p>
      </div>
    </main>
  );
}

function Sello({ verificado, fecha }: { verificado: boolean; fecha: string | null }) {
  if (!verificado) {
    return (
      <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-text-muted">supuesto</span>
    );
  }
  return (
    <span
      className="rounded-full border px-2.5 py-0.5 text-xs"
      style={{ borderColor: "var(--verde, #2f6b43)", color: "var(--verde, #2f6b43)" }}
      title={fecha ? `Verificado el ${fecha}` : undefined}
    >
      verificado
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

import type { Metadata } from "next";
import Link from "next/link";

import { PruebaSitio } from "./prueba-sitio";
import { SitioNav } from "@/components/sitio-nav";
import { precarga } from "@/lib/rutas";
import { AGENTES, type Agente } from "@/lib/agentes";
import { SEMANAS } from "@/lib/bitacora";
import { PASOS, REGRESION, RIESGOS, ROADMAP, VIDEO_FINAL } from "@/lib/demo";
import { esVistaPrevia, testerSitioDe } from "@/lib/prueba-sitio";
import { dolares } from "@/lib/tablero";
import { leerTablero } from "@/lib/tablero-datos";
import { leerTesters, type Tester } from "@/lib/testers";

export const metadata: Metadata = {
  title: "Demo",
  description:
    "A guided walkthrough of ClosetAI: try every module live, see its AI agents, five external users, the impact check and the Version 2 roadmap.",
};

// The testing summary and the live figures are read on every visit.
export const dynamic = "force-dynamic";

const LO_USARIA: Record<string, string> = { si: "Would use it", tal_vez: "Maybe", no: "Wouldn’t use it" };

function Seccion({
  id,
  titulo,
  bajada,
  children,
}: {
  id: string;
  titulo: string;
  bajada: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`t-${id}`} className="mt-20 scroll-mt-6">
      <h2 id={`t-${id}`} className="font-display text-3xl font-semibold tracking-tight">
        {titulo}
      </h2>
      <p className="mt-3 max-w-2xl leading-relaxed text-text-muted">{bajada}</p>
      {children}
    </section>
  );
}

function CajaAgente({ a }: { a: Agente }) {
  return (
    <li data-agente={a.id} className="flex flex-col rounded-2xl border border-text/80 bg-surface p-5">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-display text-lg font-semibold">{a.nombre}</h3>
        <Link href={a.ruta} prefetch={precarga(a.ruta)} className="shrink-0 text-xs text-text-muted underline underline-offset-4">
          {a.ruta}
        </Link>
      </div>
      <ol className="mt-3 space-y-1.5 text-sm">
        <li>
          <span className="text-text-muted">In · </span>
          {a.entrada}
        </li>
        <li className="text-xs text-text-muted">↓ {a.modelo}</li>
        <li>
          <span className="text-text-muted">Out · </span>
          {a.salida}
        </li>
      </ol>
      <div className="mt-4 space-y-2 border-t border-border pt-3 text-xs leading-relaxed">
        <p>
          <span className="font-medium" style={{ color: "var(--barro)" }}>
            Guardrail ·{" "}
          </span>
          {a.guardrail}
        </p>
        <p>
          <span className="font-medium text-emerald-800 dark:text-emerald-300">Human · </span>
          {a.humano}
        </p>
      </div>
    </li>
  );
}

function FilaTester({ t }: { t: Tester }) {
  return (
    <li data-tester={t.numero} data-estado={t.resumen ? "hecho" : "pendiente"} className="py-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-medium">Tester {t.numero}</span>
        <span className="text-sm text-text-muted">
          {t.semana} · {t.alcance}
        </span>
        {t.resumen ? (
          <span className="ml-auto text-sm tabular-nums" aria-label={`${t.resumen.puntaje} out of 5`}>
            <span style={{ color: "var(--barro)" }}>{"★".repeat(t.resumen.puntaje)}</span>
            <span className="text-border">{"★".repeat(5 - t.resumen.puntaje)}</span>
          </span>
        ) : (
          <span className="ml-auto rounded-full border border-border px-2.5 py-0.5 text-xs text-text-muted">
            Pending
          </span>
        )}
      </div>
      {t.resumen ? (
        <dl className="mt-2 grid gap-1 text-sm sm:grid-cols-2 sm:gap-4">
          <div>
            <dt className="text-xs text-text-muted">What worked</dt>
            <dd>“{t.resumen.funciono}”</dd>
          </div>
          <div>
            <dt className="text-xs text-text-muted">What was confusing</dt>
            <dd>{t.resumen.confuso ? `“${t.resumen.confuso}”` : "—"}</dd>
          </div>
          {t.resumen.loUsaria ? (
            <div className="sm:col-span-2 text-xs text-text-muted">
              {LO_USARIA[t.resumen.loUsaria]} · tried {t.resumen.paginas?.length ?? 0} of {PASOS.length} steps
            </div>
          ) : null}
        </dl>
      ) : (
        <p className="mt-1 text-sm text-text-muted">Not tested yet. This row fills itself when they send their summary.</p>
      )}
    </li>
  );
}

/**
 * /demo (Week 6): the guided walkthrough of the whole venture.
 *
 * Top to bottom like a tour: what it is, the steps to try it, the agents behind
 * it, who tested it, what it could do wrong and what stops it, and what comes
 * next. The Week 0 video moved to /demo/week-0.
 */
export default async function Demo({ searchParams }: PageProps<"/demo">) {
  const { test } = await searchParams;
  const vistaPrevia = esVistaPrevia(test);
  const tester = testerSitioDe(test) ?? (vistaPrevia ? 4 : null);

  const [tablero, testers] = await Promise.all([
    leerTablero().catch((e) => {
      console.error("[demo] dashboard figures:", e);
      return null;
    }),
    leerTesters().catch((e) => {
      console.error("[demo] testers:", e);
      return null;
    }),
  ]);

  const conResumen = (testers ?? []).flatMap((t) => (t.resumen ? [t.resumen.puntaje] : []));
  const promedio = conResumen.length ? conResumen.reduce((a, b) => a + b, 0) / conResumen.length : null;
  const chatReply = tablero?.costos.filas.find((f) => f.operacion === "chat_reply");

  return (
    <main className="flex-1">
      <SitioNav />

      <div className="mx-auto w-full max-w-5xl px-6 pb-24">
        <p className="text-xs tracking-[0.2em] text-text-muted uppercase">Demo · Week 6</p>
        <h1 className="mt-4 max-w-3xl font-display text-[clamp(2.25rem,6vw,3.75rem)] leading-[0.98] font-semibold tracking-[-0.03em] text-balance">
          Your closet, styled by AI.{" "}
          <span className="italic" style={{ color: "var(--barro)" }}>
            See it work in ten minutes.
          </span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-text-muted text-pretty">
          ClosetAI helps a woman in Mexico decide what to wear from the clothes she already owns. This page walks
          you through the whole product, live: nothing below is a mock-up, and every number is read from the
          database as you open it.
        </p>

        <nav aria-label="On this page" className="mt-8 flex flex-wrap gap-2 text-sm">
          {[
            ["#walkthrough", "Walkthrough"],
            ["#agents", "Agent map"],
            ["#testing", "Testing"],
            ["#impact", "Impact check"],
            ["#roadmap", "Version 2"],
          ].map(([href, texto]) => (
            <a key={href} href={href} className="rounded-full border border-border px-4 py-1.5 transition hover:border-text">
              {texto}
            </a>
          ))}
        </nav>

        {tester ? <PruebaSitio tester={tester} vistaPrevia={vistaPrevia} /> : null}

        {VIDEO_FINAL ? (
          <figure className="mt-10">
            <video
              controls
              preload="metadata"
              playsInline
              className="w-full rounded-2xl border border-border bg-black"
              data-testid="video-final"
            >
              <source src={VIDEO_FINAL.src} type="video/mp4" />
              Your browser can’t play this video.{" "}
              <a href={VIDEO_FINAL.src} className="underline">
                Download the file
              </a>
              .
            </video>
            <figcaption className="mt-2 text-sm text-text-muted">
              The {VIDEO_FINAL.duracion} walkthrough, narrated by Tamara.
            </figcaption>
          </figure>
        ) : null}

        {/* ---------------------------------------------------------- Walkthrough */}
        <Seccion
          id="walkthrough"
          titulo="The walkthrough"
          bajada="Nine steps, in order. Each one opens a live page and says what to notice. Only step 7 needs an account, and it is free."
        >
          <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="pasos">
            {PASOS.map((p, i) => (
              <li key={p.id} data-paso={p.id} className="flex flex-col rounded-2xl border border-border bg-surface p-5">
                <p className="text-xs tracking-[0.14em] text-text-muted uppercase">
                  Step {i + 1} · {p.tipo}
                </p>
                <h3 className="mt-2 font-display text-lg font-semibold leading-snug">{p.titulo}</h3>
                <p className="mt-2 text-sm leading-relaxed">{p.hacer}</p>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-text-muted">
                  <span className="font-medium text-text">Notice: </span>
                  {p.notar}
                </p>
                <Link
                  href={p.ruta}
                  prefetch={precarga(p.ruta)}
                  className="mt-4 inline-flex w-fit items-center gap-1 rounded-full border border-border px-4 py-1.5 text-sm transition hover:border-text"
                >
                  Open {p.ruta} →
                </Link>
              </li>
            ))}
          </ol>
        </Seccion>

        {/* ------------------------------------------------------------ Agent map */}
        <Seccion
          id="agents"
          titulo="Agent map"
          bajada={`ClosetAI runs ${AGENTES.length} AI agents. Each box shows what goes in, which model works on it, what comes out, what stops it from doing harm, and where a person decides instead of the model.`}
        >
          {(
            [
              ["app", "Inside the app — for signed-in users"],
              ["publico", "On the public site — no account needed"],
            ] as const
          ).map(([donde, titulo]) => (
            <div key={donde} className="mt-8">
              <h3 className="text-sm font-medium tracking-wide text-text-muted uppercase">{titulo}</h3>
              <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid={`agentes-${donde}`}>
                {AGENTES.filter((a) => a.donde === donde).map((a) => (
                  <CajaAgente key={a.id} a={a} />
                ))}
              </ul>
            </div>
          ))}
          <p className="mt-4 text-sm text-text-muted">
            The prompt behind each agent is in the{" "}
            <Link href="/docs#prompts" className="underline underline-offset-4">
              prompt library
            </Link>
            , read from the same file as this map.
          </p>
        </Seccion>

        {/* -------------------------------------------------------------- Testing */}
        <Seccion
          id="testing"
          titulo="Testing summary"
          bajada="Five external users — people who didn’t build ClosetAI, on their own phones — plus automated tests against the live site. Testers’ words are shown as they wrote them."
        >
          <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="rounded-2xl border border-border p-5">
              <h3 className="font-display text-xl font-semibold">External users</h3>
              {testers ? (
                <ul className="mt-2 divide-y divide-border" data-testid="testers">
                  {testers.map((t) => (
                    <FilaTester key={t.numero} t={t} />
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-text-muted">The database didn’t answer; the summaries can’t be shown right now.</p>
              )}
            </div>
            <div className="space-y-4">
              <div className="rounded-2xl border border-border p-5">
                <h3 className="font-display text-xl font-semibold">Full-site regression</h3>
                {REGRESION ? (
                  <div data-testid="regresion">
                    <p className="mt-2 font-display text-3xl font-semibold tabular-nums">
                      {REGRESION.pasaron} passed
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-text-muted">{REGRESION.detalle}</p>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-text-muted" data-testid="regresion">
                    The final run against the live site happens at the end of the week; its result goes here.
                  </p>
                )}
              </div>
              <div className="rounded-2xl border border-border p-5 text-sm leading-relaxed text-text-muted">
                <h3 className="font-display text-xl font-semibold text-text">Want to be a tester?</h3>
                <p className="mt-2">
                  Tester links are personal: Tamara sends them. Results never include names.
                </p>
              </div>
            </div>
          </div>
        </Seccion>

        {/* --------------------------------------------------------- Impact check */}
        <Seccion
          id="impact"
          titulo="Practical impact check"
          bajada="Does it create value, does it pay for itself, and could it hurt someone? The figures are live; the risks are the ones a stylist app with AI really runs."
        >
          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4" data-testid="valor">
            {[
              {
                v: tablero ? (tablero.chat.utiles === null ? "—" : `${tablero.chat.utiles}%`) : "—",
                t: "Chat answers rated helpful",
                d: tablero ? `${tablero.chat.arriba} 👍 · ${tablero.chat.abajo} 👎` : "",
              },
              {
                v: promedio === null ? "—" : `${promedio.toFixed(1)} / 5`,
                t: "Average tester score",
                d: `${conResumen.length} of 5 testers so far`,
              },
              {
                v: tablero?.app.outfits.tasaAceptacion == null ? "—" : `${tablero.app.outfits.tasaAceptacion}%`,
                t: "App outfits accepted",
                d: "The weakest number — see Version 2",
              },
              {
                v: chatReply ? dolares(chatReply.usd / chatReply.llamadas) : "—",
                t: "AI cost of one chat answer",
                d: tablero ? `${dolares(tablero.costos.total)} spent on AI since August` : "",
              },
            ].map((c) => (
              <div key={c.t} className="rounded-2xl border border-border bg-surface p-5">
                <p className="font-display text-3xl font-semibold tabular-nums">{c.v}</p>
                <p className="mt-1 text-sm font-medium">{c.t}</p>
                <p className="mt-1 text-xs text-text-muted">{c.d}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-border p-5">
              <h3 className="font-medium">Who it helps</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">
                A woman aged 24–30 in Mexico City who owns enough clothes but loses time and money deciding what to
                wear, and buys what she doesn’t need. ClosetAI answers from her own closet first and only suggests
                buying to fill a real gap.
              </p>
            </div>
            <div className="rounded-2xl border border-border p-5">
              <h3 className="font-medium">Does it pay for itself</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">
                Text answers cost fractions of a cent. The only expensive call is the virtual try-on
                {(() => {
                  const t = tablero?.costos.filas.find((f) => f.operacion === "tryon");
                  return t && t.llamadas ? ` (${dolares(t.usd / t.llamadas)} each)` : "";
                })()}
                , which is why it is paid with credits.{" "}
                <Link href="/pricing" className="underline underline-offset-4">
                  The plans and their math
                </Link>
                .
              </p>
            </div>
            <div className="rounded-2xl border border-border p-5">
              <h3 className="font-medium">What it can’t claim yet</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">
                That it saves anyone money or time: nobody has used it long enough to measure that. With{" "}
                {tablero ? tablero.cuentas : "a few"} accounts and five testers, every number here is a signal,
                not proof.
              </p>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
            <table className="w-full min-w-[640px] text-left text-sm" data-testid="riesgos">
              <thead className="text-xs tracking-wide text-text-muted uppercase">
                <tr className="border-b border-border">
                  <th className="p-4 font-medium">Risk</th>
                  <th className="p-4 font-medium">Guardrail</th>
                  <th className="p-4 font-medium">Proof</th>
                </tr>
              </thead>
              <tbody>
                {RIESGOS.map((r) => (
                  <tr key={r.riesgo} className="border-b border-border align-top last:border-0">
                    <td className="p-4 font-medium">{r.riesgo}</td>
                    <td className="p-4 leading-relaxed text-text-muted">{r.guardrail}</td>
                    <td className="p-4 text-xs">
                      {r.enlace ? (
                        <a href={r.enlace} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                          {r.prueba}
                        </a>
                      ) : (
                        r.prueba
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Seccion>

        {/* -------------------------------------------------------------- Roadmap */}
        <Seccion
          id="roadmap"
          titulo="Version 2 roadmap"
          bajada="What comes next, and the evidence that asked for each item. Nothing here is built yet."
        >
          <ol className="mt-8 space-y-3" data-testid="roadmap">
            {ROADMAP.map((r, i) => (
              <li key={r.idea} className="grid gap-1 rounded-2xl border border-border p-5 sm:grid-cols-[2.5rem_1fr_1.4fr] sm:gap-4">
                <span className="font-display text-xl font-semibold tabular-nums" style={{ color: "var(--barro)" }}>
                  {i + 1}
                </span>
                <span className="font-medium">{r.idea}</span>
                <span className="text-sm leading-relaxed text-text-muted">
                  <span className="sr-only">Why: </span>
                  {r.porque}
                </span>
              </li>
            ))}
          </ol>
        </Seccion>

        {/* --------------------------------------------------------- Weekly demos */}
        <section aria-labelledby="t-semanas" className="mt-20">
          <h2 id="t-semanas" className="font-display text-2xl font-semibold tracking-tight">
            Every week’s demo
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2 text-sm">
            {SEMANAS.filter((s) => s.demo !== "/demo").map((s) => (
              <li key={s.semana}>
                <Link href={s.demo} className="inline-block rounded-full border border-border px-4 py-1.5 transition hover:border-text">
                  {s.semana} · {s.titulo}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}


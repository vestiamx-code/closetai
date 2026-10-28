import { Fragment } from "react";
import type { Metadata } from "next";
import Link from "next/link";

import { researchReportSchema } from "@/lib/ai/schemas";
import { EN_INGLES_DESDE } from "@/lib/marketing";
import { resumir, severidad, type Fuente, type Riesgo } from "@/lib/research";
import { createAdminClient } from "@/lib/supabase/admin";

import { Investigacion, TablaCompetidores } from "./interacciones";

export const metadata: Metadata = {
  title: "Research",
  description:
    "Is the problem real? ClosetAI's competitors, substitutes, global benchmarks, Mexico and risks — every figure with its source.",
};

// Saved reports and the validation have to reflect what just happened.
export const dynamic = "force-dynamic";

/** Source types as shown on screen; the stored value stays as it was. */
const TIPO_LEGIBLE: Record<string, string> = {
  competidor: "competitor",
  sustituto: "substitute",
  referente: "benchmark",
  mercado: "market",
};

const DOCUMENTO_DE_VERIFICACION =
  "https://github.com/vestiamx-code/closetai/blob/main/docs/evidencia/INVESTIGACION-SEMANA-2.md";

type Validacion = {
  id: string;
  fecha: string;
  perfil: string;
  citas: string[];
  confirmo: string | null;
  contradijo: string | null;
  sorpresa: string | null;
};

/**
 * `/research` — Week 2.
 *
 * ClosetAI's market research, public and checkable. Every figure comes from
 * `research_sources`, with the source that backs it and the date it was verified.
 * What could not be verified does not appear as a fact: it appears at the end, in
 * the list of what was discarded.
 */
export default async function Research() {
  const admin = createAdminClient();

  const [fuentesR, riesgosR, validacionesR, informesR] = await Promise.all([
    admin.from("research_sources").select("*").order("orden"),
    admin.from("research_risks").select("*"),
    admin
      .from("validation_conversations")
      .select("id, fecha, perfil, citas, confirmo, contradijo, sorpresa")
      .order("fecha", { ascending: false }),
    admin
      .from("research_outputs")
      .select("id, pregunta, informe, created_at")
      .gte("created_at", EN_INGLES_DESDE)
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  if (fuentesR.error || riesgosR.error) {
    console.error("[research] could not read the data", fuentesR.error ?? riesgosR.error);
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-20">
        <h1 className="font-display text-3xl font-semibold">Research</h1>
        <p className="mt-4 text-text-muted">The research data is not available right now.</p>
      </main>
    );
  }

  const fuentes = (fuentesR.data ?? []) as Fuente[];
  const riesgos = ((riesgosR.data ?? []) as Riesgo[]).sort((a, b) => severidad(b) - severidad(a));
  const validaciones = (validacionesR.data ?? []) as Validacion[];
  const informes = (informesR.data ?? [])
    .map((f) => ({ id: f.id as string, pregunta: f.pregunta as string, parseado: researchReportSchema.safeParse(f.informe) }))
    .filter((f) => f.parseado.success)
    .map((f) => ({ id: f.id, pregunta: f.pregunta, informe: f.parseado.data! }));

  const resumen = resumir(fuentes, riesgos, validaciones.length, informes.length);
  const porId = new Map(fuentes.map((f) => [f.id, f]));
  const referentes = fuentes.filter((f) => f.referente_global);
  const mexico = fuentes.filter((f) => f.de_mexico);

  return (
    <main className="flex-1">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <Link href="/" className="font-display text-xl font-semibold tracking-tight">
          ClosetAI
        </Link>
        <Link href="/core" className="rounded-full border border-border px-5 py-2 text-sm transition hover:border-text">
          Try the style core
        </Link>
      </header>

      <div className="mx-auto w-full max-w-5xl px-6 pb-24">
        {/* ------------------------------------------------------------ Cover */}
        <p className="text-xs tracking-[0.2em] text-text-muted uppercase">Research</p>
        <h1 className="mt-4 max-w-3xl font-display text-[clamp(2.25rem,6vw,3.75rem)] leading-[0.98] font-semibold tracking-[-0.03em] text-balance">
          Is the problem real?{" "}
          <span className="italic" style={{ color: "var(--barro)" }}>
            With sources.
          </span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-text-muted text-pretty">
          Who else solves the same problem, what people use instead, what is happening in Mexico, and what
          could kill ClosetAI. Every figure links to its source; what we could not verify is at the end,
          outside the table.
        </p>
        <p className="mt-3 text-sm text-text-muted">
          Verified on September 14, 2026 ·{" "}
          <a href={DOCUMENTO_DE_VERIFICACION} className="underline underline-offset-4 hover:text-text">
            how each figure was verified
          </a>
        </p>

        {/* ------------------------------------------------------------ Panel */}
        <section aria-label="Research summary" className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Cifra valor={resumen.competidores} etiqueta="Competitors" />
          <Cifra valor={resumen.sustitutos} etiqueta="Substitutes" />
          <Cifra valor={resumen.referentesGlobales} etiqueta="Global benchmarks" />
          <Cifra valor={resumen.riesgos} etiqueta="Risks mapped" />
          <div className="col-span-2 rounded-xl border border-border bg-surface p-4">
            <p className="text-xs tracking-[0.14em] text-text-muted uppercase">Highest risk</p>
            <p className="mt-1.5 leading-snug font-medium">{resumen.riesgoMasAlto?.riesgo ?? "—"}</p>
          </div>
          <div className="col-span-2 rounded-xl border border-border bg-surface p-4">
            <p className="text-xs tracking-[0.14em] text-text-muted uppercase">Validation with people</p>
            <p className="mt-1.5 leading-snug font-medium">
              {resumen.validaciones === 0
                ? "Pending"
                : `${resumen.validaciones} ${resumen.validaciones === 1 ? "real conversation" : "real conversations"}`}
              <span className="text-text-muted"> · {resumen.informes} saved reports</span>
            </p>
          </div>
        </section>

        {/* ------------------------------------------------------------ Question */}
        <Seccion id="preguntar" titulo="Ask the research a question">
          <Investigacion fuentes={fuentes.map(({ id, nombre, fuente_url }) => ({ id, nombre, fuente_url }))} />
        </Seccion>

        {/* ------------------------------------------------------------ Benchmarks */}
        <Seccion
          id="referentes"
          titulo="5 global benchmarks"
          bajada="What already worked —or didn't— in other markets, and what it teaches ClosetAI."
        >
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {referentes.map((f) => (
              <li key={f.id} data-testid="referente" className="flex flex-col rounded-xl border border-border bg-surface p-5">
                <p className="text-xs tracking-[0.14em] text-text-muted uppercase">
                  {TIPO_LEGIBLE[f.tipo] ?? f.tipo}
                  {f.pais ? ` · ${f.pais}` : ""}
                </p>
                <p className="mt-2 font-display text-xl font-semibold">{f.nombre}</p>
                <p className="mt-2 leading-relaxed">{f.dato_clave}</p>
                {f.precio ? <p className="mt-2 text-sm text-text-muted">{f.precio}</p> : null}
                {f.leccion ? (
                  <p className="mt-4 border-t border-border pt-3 text-sm leading-relaxed">
                    <span className="text-text-muted">Lesson: </span>
                    {f.leccion}
                  </p>
                ) : null}
                <FuenteLink fuente={f} />
              </li>
            ))}
          </ul>
        </Seccion>

        {/* ------------------------------------------------------------ Mexico */}
        <Seccion
          id="mexico"
          titulo="Mexico"
          bajada="Translating is not localizing. What the data says about the market where ClosetAI can be first."
        >
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {mexico.map((f) => (
              <li key={f.id} className="rounded-xl border border-border bg-surface p-5">
                <p className="font-medium">{f.nombre}</p>
                <p className="mt-2 leading-relaxed">{f.dato_clave}</p>
                {f.leccion ? <p className="mt-3 text-sm text-text-muted">{f.leccion}</p> : null}
                <FuenteLink fuente={f} />
              </li>
            ))}
          </ul>
        </Seccion>

        {/* ------------------------------------------------------------ Tabla */}
        <Seccion
          id="competidores"
          titulo="Competitors and substitutes"
          bajada="Competitor: solves the same problem. Substitute: meets the need another way."
        >
          <TablaCompetidores fuentes={fuentes} />
        </Seccion>

        {/* ------------------------------------------------------------ Risks */}
        <Seccion
          id="riesgos"
          titulo="Risk map"
          bajada="Probability × impact. Each risk points to the evidence behind it."
        >
          <MapaDeRiesgos riesgos={riesgos} />
          <ul className="mt-8 divide-y divide-border rounded-xl border border-border">
            {riesgos.map((r) => (
              <li key={r.id} className="p-5">
                <p className="font-medium">{r.riesgo}</p>
                <p className="mt-1 text-xs text-text-muted">
                  Probability {r.probabilidad}/3 · Impact {r.impacto}/3
                </p>
                <p className="mt-3 text-sm leading-relaxed">
                  <span className="text-text-muted">Mitigation: </span>
                  {r.mitigacion}
                </p>
                {r.evidencia.length > 0 ? (
                  <p className="mt-2 flex flex-wrap gap-1.5 text-xs">
                    <span className="text-text-muted">Evidence:</span>
                    {r.evidencia.map((id) => {
                      const f = porId.get(id);
                      return f ? (
                        <a
                          key={id}
                          href={f.fuente_url}
                          target="_blank"
                          rel="noreferrer"
                          className="underline underline-offset-4 hover:text-text"
                        >
                          {f.nombre}
                        </a>
                      ) : null;
                    })}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </Seccion>

        {/* ------------------------------------------------------------ Validation */}
        <Seccion
          id="validacion"
          titulo="Validation with a real person"
          bajada="The data says what the market does. A conversation says what a person does."
        >
          <div data-testid="validacion">
            {validaciones.length === 0 ? (
              <p className="mt-6 rounded-xl border border-dashed border-border px-5 py-6 text-sm leading-relaxed">
                <strong>Pending.</strong> There is no recorded conversation yet. We will not simulate one: it
                appears here when it happens, with the person&apos;s consent and without their name.
              </p>
            ) : (
              validaciones.map((v) => (
                <article key={v.id} className="mt-6 rounded-xl border border-border bg-surface p-6">
                  <p className="text-sm text-text-muted">
                    {v.perfil} · {v.fecha}
                  </p>
                  <div className="mt-4 space-y-3">
                    {v.citas.map((c) => (
                      <blockquote key={c} className="border-l-2 border-text pl-4 font-display text-lg italic">
                        “{c}”
                      </blockquote>
                    ))}
                  </div>
                  <dl className="mt-6 grid gap-5 text-sm sm:grid-cols-3">
                    {v.confirmo ? <Par titulo="Confirmed" texto={v.confirmo} /> : null}
                    {v.contradijo ? <Par titulo="Contradicted" texto={v.contradijo} /> : null}
                    {v.sorpresa ? <Par titulo="Surprised us" texto={v.sorpresa} /> : null}
                  </dl>
                </article>
              ))
            )}
          </div>
        </Seccion>

        {/* ------------------------------------------------------------ Saved */}
        {informes.length > 0 ? (
          <Seccion id="guardados" titulo="Saved research">
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {informes.map((i) => (
                <li key={i.id} className="rounded-xl border border-border bg-surface p-5">
                  <p className="text-sm text-text-muted">{i.pregunta}</p>
                  <p className="mt-2 leading-relaxed">{i.informe.respuesta}</p>
                  <p className="mt-3 text-xs text-text-muted">
                    {i.informe.suficiente ? "Enough evidence" : "Not enough evidence"} ·{" "}
                    {new Set(i.informe.hallazgos.flatMap((h) => h.fuentes)).size} sources cited
                  </p>
                </li>
              ))}
            </ul>
          </Seccion>
        ) : null}

        {/* ------------------------------------------------------------ Discarded */}
        <Seccion
          id="descartado"
          titulo="What we discarded"
          bajada="They may be true, but we could not check them at their source. That is why they are not above."
        >
          <ul className="mt-6 space-y-2 text-sm text-text-muted">
            {[
              "That Chicisimo was the number one fashion app in Mexico in 2014.",
              "That 90% of GoTrendier users are women.",
              "That cataloging in Stylebook takes 6 to 8 hours per 100 garments.",
              "That Doji changed users' race in their avatars.",
              "The Daydream (USD 50 M) and Phia (USD 35 M) funding rounds.",
              "The average online fashion ticket in Mexico of MXN 1,300.",
            ].map((t) => (
              <li key={t} className="flex gap-3">
                <span aria-hidden>·</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </Seccion>
      </div>
    </main>
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

function Cifra({ valor, etiqueta }: { valor: number; etiqueta: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="font-display text-4xl font-semibold tracking-tight">{valor}</p>
      <p className="mt-1 text-sm text-text-muted">{etiqueta}</p>
    </div>
  );
}

function FuenteLink({ fuente }: { fuente: Fuente }) {
  return (
    <p className="mt-auto pt-4 text-xs text-text-muted">
      <a href={fuente.fuente_url} target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-text">
        {fuente.fuente_nombre} ↗
      </a>
      {fuente.fuente_extra_url ? (
        <>
          {" · "}
          <a
            href={fuente.fuente_extra_url}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4 hover:text-text"
          >
            another source ↗
          </a>
        </>
      ) : null}
      {" · "}verified on {fuente.verificado_el}
    </p>
  );
}

function Par({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div>
      <dt className="text-xs tracking-[0.14em] text-text-muted uppercase">{titulo}</dt>
      <dd className="mt-1.5 leading-relaxed">{texto}</dd>
    </div>
  );
}

const NIVEL = ["", "Low", "Medium", "High"];

/** Tint by probability × impact. Transparent, so it works in light and dark themes. */
function tinte(sev: number): string {
  if (sev >= 9) return "rgba(176, 58, 40, 0.24)";
  if (sev >= 6) return "rgba(196, 112, 52, 0.18)";
  if (sev >= 3) return "rgba(196, 160, 64, 0.12)";
  return "transparent";
}

function MapaDeRiesgos({ riesgos }: { riesgos: Riesgo[] }) {
  return (
    <div className="mt-6 overflow-x-auto">
      <div
        data-testid="mapa-riesgos"
        role="img"
        aria-label="Risk map by probability and impact. Each risk's detail is in the list below."
        className="grid min-w-[560px] grid-cols-[4.5rem_repeat(3,minmax(0,1fr))] gap-1.5 text-xs"
      >
        {[3, 2, 1].map((impacto) => (
          <Fragment key={impacto}>
            <div className="flex items-center pr-2 text-text-muted">
              Impact
              <br />
              {NIVEL[impacto].toLowerCase()}
            </div>
            {[1, 2, 3].map((probabilidad) => (
              <div
                key={probabilidad}
                className="min-h-24 rounded-lg border border-border p-2"
                style={{ background: tinte(impacto * probabilidad) }}
              >
                {riesgos
                  .filter((r) => r.impacto === impacto && r.probabilidad === probabilidad)
                  .map((r) => (
                    <p key={r.id} data-riesgo={r.id} className="mb-1.5 rounded-md bg-surface/85 px-2 py-1 leading-snug">
                      {r.riesgo}
                    </p>
                  ))}
              </div>
            ))}
          </Fragment>
        ))}
        <div />
        {[1, 2, 3].map((p) => (
          <div key={p} className="pt-1 text-center text-text-muted">
            Probability {NIVEL[p].toLowerCase()}
          </div>
        ))}
      </div>
    </div>
  );
}

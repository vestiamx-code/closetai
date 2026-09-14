import { Fragment } from "react";
import type { Metadata } from "next";
import Link from "next/link";

import { researchReportSchema } from "@/lib/ai/schemas";
import { resumir, severidad, type Fuente, type Riesgo } from "@/lib/research";
import { createAdminClient } from "@/lib/supabase/admin";

import { Investigacion, TablaCompetidores } from "./interacciones";

export const metadata: Metadata = {
  title: "Investigación · ClosetAI",
  description:
    "¿El problema es real? Competidores, sustitutos, referentes globales, México y riesgos de ClosetAI — cada dato con su fuente.",
};

// Los guardados y la validación tienen que reflejar lo que acaba de pasar.
export const dynamic = "force-dynamic";

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
 * `/research` — Semana 2.
 *
 * La investigación de mercado de ClosetAI, pública y comprobable. Cada dato
 * viene de `research_sources`, con la fuente que lo sostiene y la fecha en que
 * se verificó. Lo que no se pudo verificar no aparece como dato: aparece al
 * final, en la lista de lo descartado.
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
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  if (fuentesR.error || riesgosR.error) {
    console.error("[research] no se pudieron leer los datos", fuentesR.error ?? riesgosR.error);
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-20">
        <h1 className="font-display text-3xl font-semibold">Investigación</h1>
        <p className="mt-4 text-text-muted">Los datos de investigación no están disponibles en este momento.</p>
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
          Probar el núcleo de estilo
        </Link>
      </header>

      <div className="mx-auto w-full max-w-5xl px-6 pb-24">
        {/* ------------------------------------------------------------ Portada */}
        <p className="text-xs tracking-[0.2em] text-text-muted uppercase">Investigación</p>
        <h1 className="mt-4 max-w-3xl font-display text-[clamp(2.25rem,6vw,3.75rem)] leading-[0.98] font-semibold tracking-[-0.03em] text-balance">
          ¿El problema es real?{" "}
          <span className="italic" style={{ color: "var(--barro)" }}>
            Con fuentes.
          </span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-text-muted text-pretty">
          Quién más resuelve lo mismo, qué usa la gente en su lugar, qué pasa en México y qué podría
          matar a ClosetAI. Cada dato enlaza a su fuente; lo que no pudimos verificar está al final,
          fuera de la tabla.
        </p>
        <p className="mt-3 text-sm text-text-muted">
          Verificado el 14 de septiembre de 2026 ·{" "}
          <a href={DOCUMENTO_DE_VERIFICACION} className="underline underline-offset-4 hover:text-text">
            cómo se verificó cada dato
          </a>
        </p>

        {/* ------------------------------------------------------------ Panel */}
        <section aria-label="Resumen de la investigación" className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Cifra valor={resumen.competidores} etiqueta="Competidores" />
          <Cifra valor={resumen.sustitutos} etiqueta="Sustitutos" />
          <Cifra valor={resumen.referentesGlobales} etiqueta="Referentes globales" />
          <Cifra valor={resumen.riesgos} etiqueta="Riesgos mapeados" />
          <div className="col-span-2 rounded-xl border border-border bg-surface p-4">
            <p className="text-xs tracking-[0.14em] text-text-muted uppercase">Riesgo más alto</p>
            <p className="mt-1.5 leading-snug font-medium">{resumen.riesgoMasAlto?.riesgo ?? "—"}</p>
          </div>
          <div className="col-span-2 rounded-xl border border-border bg-surface p-4">
            <p className="text-xs tracking-[0.14em] text-text-muted uppercase">Validación con personas</p>
            <p className="mt-1.5 leading-snug font-medium">
              {resumen.validaciones === 0
                ? "Pendiente"
                : `${resumen.validaciones} ${resumen.validaciones === 1 ? "conversación real" : "conversaciones reales"}`}
              <span className="text-text-muted"> · {resumen.informes} informes guardados</span>
            </p>
          </div>
        </section>

        {/* ------------------------------------------------------------ Pregunta */}
        <Seccion id="preguntar" titulo="Hazle una pregunta a la investigación">
          <Investigacion fuentes={fuentes.map(({ id, nombre, fuente_url }) => ({ id, nombre, fuente_url }))} />
        </Seccion>

        {/* ------------------------------------------------------------ Referentes */}
        <Seccion
          id="referentes"
          titulo="5 referentes globales"
          bajada="Lo que ya funcionó —o no— en otros mercados, y lo que le enseña a ClosetAI."
        >
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {referentes.map((f) => (
              <li key={f.id} data-testid="referente" className="flex flex-col rounded-xl border border-border bg-surface p-5">
                <p className="text-xs tracking-[0.14em] text-text-muted uppercase">
                  {f.tipo}
                  {f.pais ? ` · ${f.pais}` : ""}
                </p>
                <p className="mt-2 font-display text-xl font-semibold">{f.nombre}</p>
                <p className="mt-2 leading-relaxed">{f.dato_clave}</p>
                {f.precio ? <p className="mt-2 text-sm text-text-muted">{f.precio}</p> : null}
                {f.leccion ? (
                  <p className="mt-4 border-t border-border pt-3 text-sm leading-relaxed">
                    <span className="text-text-muted">Lección: </span>
                    {f.leccion}
                  </p>
                ) : null}
                <FuenteLink fuente={f} />
              </li>
            ))}
          </ul>
        </Seccion>

        {/* ------------------------------------------------------------ México */}
        <Seccion
          id="mexico"
          titulo="México"
          bajada="Traducir no es localizar. Lo que dicen los datos sobre el mercado donde ClosetAI sí puede ser el primero."
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
          titulo="Competidores y sustitutos"
          bajada="Competidor: resuelve lo mismo. Sustituto: resuelve la necesidad de otra forma."
        >
          <TablaCompetidores fuentes={fuentes} />
        </Seccion>

        {/* ------------------------------------------------------------ Riesgos */}
        <Seccion
          id="riesgos"
          titulo="Mapa de riesgos"
          bajada="Probabilidad × impacto. Cada riesgo apunta a la evidencia que lo sostiene."
        >
          <MapaDeRiesgos riesgos={riesgos} />
          <ul className="mt-8 divide-y divide-border rounded-xl border border-border">
            {riesgos.map((r) => (
              <li key={r.id} className="p-5">
                <p className="font-medium">{r.riesgo}</p>
                <p className="mt-1 text-xs text-text-muted">
                  Probabilidad {r.probabilidad}/3 · Impacto {r.impacto}/3
                </p>
                <p className="mt-3 text-sm leading-relaxed">
                  <span className="text-text-muted">Mitigación: </span>
                  {r.mitigacion}
                </p>
                {r.evidencia.length > 0 ? (
                  <p className="mt-2 flex flex-wrap gap-1.5 text-xs">
                    <span className="text-text-muted">Evidencia:</span>
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

        {/* ------------------------------------------------------------ Validación */}
        <Seccion
          id="validacion"
          titulo="Validación con una persona real"
          bajada="Los datos dicen qué hace el mercado. Una conversación dice qué hace una persona."
        >
          <div data-testid="validacion">
            {validaciones.length === 0 ? (
              <p className="mt-6 rounded-xl border border-dashed border-border px-5 py-6 text-sm leading-relaxed">
                <strong>Pendiente.</strong> Todavía no hay una conversación registrada. No la vamos a simular:
                aparece aquí cuando ocurra, con permiso de la persona y sin su nombre.
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
                    {v.confirmo ? <Par titulo="Confirmó" texto={v.confirmo} /> : null}
                    {v.contradijo ? <Par titulo="Contradijo" texto={v.contradijo} /> : null}
                    {v.sorpresa ? <Par titulo="Sorprendió" texto={v.sorpresa} /> : null}
                  </dl>
                </article>
              ))
            )}
          </div>
        </Seccion>

        {/* ------------------------------------------------------------ Guardados */}
        {informes.length > 0 ? (
          <Seccion id="guardados" titulo="Investigaciones guardadas">
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {informes.map((i) => (
                <li key={i.id} className="rounded-xl border border-border bg-surface p-5">
                  <p className="text-sm text-text-muted">{i.pregunta}</p>
                  <p className="mt-2 leading-relaxed">{i.informe.respuesta}</p>
                  <p className="mt-3 text-xs text-text-muted">
                    {i.informe.suficiente ? "Con evidencia suficiente" : "Evidencia insuficiente"} ·{" "}
                    {new Set(i.informe.hallazgos.flatMap((h) => h.fuentes)).size} fuentes citadas
                  </p>
                </li>
              ))}
            </ul>
          </Seccion>
        ) : null}

        {/* ------------------------------------------------------------ Descartado */}
        <Seccion
          id="descartado"
          titulo="Lo que descartamos"
          bajada="Pueden ser ciertos, pero no los pudimos comprobar en su fuente. Por eso no están arriba."
        >
          <ul className="mt-6 space-y-2 text-sm text-text-muted">
            {[
              "Que Chicisimo haya sido la app de moda número uno en México en 2014.",
              "Que el 90% de las usuarias de GoTrendier sean mujeres.",
              "Que catalogar en Stylebook tome de 6 a 8 horas por cada 100 prendas.",
              "Que Doji haya cambiado la raza de usuarios en sus avatares.",
              "Las rondas de Daydream (50 M USD) y Phia (35 M USD).",
              "El ticket promedio de moda en línea en México de 1,300 MXN.",
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
            otra fuente ↗
          </a>
        </>
      ) : null}
      {" · "}verificado el {fuente.verificado_el}
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

const NIVEL = ["", "Baja", "Media", "Alta"];

/** Tinte según probabilidad × impacto. Transparencias, para que funcione en tema claro y oscuro. */
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
        aria-label="Mapa de riesgos por probabilidad e impacto. El detalle de cada riesgo está en la lista de abajo."
        className="grid min-w-[560px] grid-cols-[4.5rem_repeat(3,minmax(0,1fr))] gap-1.5 text-xs"
      >
        {[3, 2, 1].map((impacto) => (
          <Fragment key={impacto}>
            <div className="flex items-center pr-2 text-text-muted">
              Impacto
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
            Probabilidad {NIVEL[p].toLowerCase()}
          </div>
        ))}
      </div>
    </div>
  );
}

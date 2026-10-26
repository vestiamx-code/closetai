"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { filtrarFuentes, filasDeLaTabla, type FiltroTabla, type Fuente } from "@/lib/research";

import { generarInvestigacion, guardarInvestigacion, type EstadoInvestigacion } from "./actions";

const INICIAL: EstadoInvestigacion = { estado: "vacio" };

const EJEMPLOS = [
  "Are there competitors built for Mexico?",
  "Do people pay for closet apps, and how much?",
  "How big is online clothing shopping in Mexico?",
];

type FuenteCitable = Pick<Fuente, "id" | "nombre" | "fuente_url">;

// ---------------------------------------------------------------------------
// Research question → report → save
// ---------------------------------------------------------------------------

export function Investigacion({ fuentes }: { fuentes: FuenteCitable[] }) {
  const [estado, accion, generando] = useActionState(generarInvestigacion, INICIAL);
  const [pregunta, setPregunta] = useState("");

  return (
    <>
      <form action={accion} className="mt-6">
        <label htmlFor="pregunta" className="block text-sm font-medium">
          Research question
        </label>
        <p className="mt-1 text-sm text-text-muted">
          The answer comes only from the verified data on this page. The question and the report are
          published if you save them: don&apos;t include personal details.
        </p>

        <textarea
          id="pregunta"
          name="pregunta"
          rows={3}
          value={pregunta}
          onChange={(e) => setPregunta(e.target.value)}
          maxLength={500}
          placeholder={EJEMPLOS[0]}
          className="mt-3 w-full resize-y rounded-xl border border-border bg-surface px-4 py-3 leading-relaxed outline-none placeholder:text-text-muted/70 focus:border-accent"
        />

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-text-muted">
          {EJEMPLOS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setPregunta(e)}
              className="underline underline-offset-4 transition hover:text-text"
            >
              {e}
            </button>
          ))}
          <span className="ml-auto">{pregunta.trim().length} / 500</span>
        </div>

        <button
          type="submit"
          disabled={generando}
          className="mt-4 w-full rounded-full bg-text px-6 py-3.5 font-medium text-bg transition hover:opacity-90 disabled:opacity-60 sm:w-auto sm:px-10"
        >
          {generando ? "Reviewing the evidence…" : "Research"}
        </button>
      </form>

      {estado.estado === "error" ? (
        <p className="mt-5 rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm">{estado.mensaje}</p>
      ) : null}

      {estado.estado === "listo" ? <Informe datos={estado} fuentes={fuentes} /> : null}
    </>
  );
}

function Informe({
  datos,
  fuentes,
}: {
  datos: Extract<EstadoInvestigacion, { estado: "listo" }>;
  fuentes: FuenteCitable[];
}) {
  const { informe } = datos;
  const porId = useMemo(() => new Map(fuentes.map((f) => [f.id, f])), [fuentes]);
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState<string>();
  const [pendiente, iniciar] = useTransition();
  const router = useRouter();

  return (
    <article data-testid="informe" className="mt-8 overflow-hidden rounded-2xl border border-border bg-surface">
      <header className="border-b border-border px-6 py-5" style={{ background: "var(--arena)" }}>
        <p className="text-xs tracking-[0.16em] text-text-muted uppercase">Report</p>
        <p className="mt-2 text-sm text-text-muted">{datos.pregunta}</p>
        <p className="mt-3 font-display text-xl leading-snug font-semibold tracking-tight text-pretty">
          {informe.respuesta}
        </p>
      </header>

      {/*
        This line is always there, not only when it is convenient. A report that sounds
        just as confident when the data falls short is exactly what this page does not
        want to be.
      */}
      <p className="border-b border-border px-6 py-3 text-sm">
        {informe.suficiente ? (
          <>The verified data is enough to answer.</>
        ) : (
          <strong>The verified data is not enough to answer this.</strong>
        )}{" "}
        <span className="text-text-muted">AI synthesis from the cited sources.</span>
      </p>

      {informe.hallazgos.length > 0 ? (
        <ul className="space-y-4 px-6 py-6">
          {informe.hallazgos.map((h) => (
            <li key={h.afirmacion}>
              <p className="leading-relaxed">{h.afirmacion}</p>
              <p className="mt-1.5 flex flex-wrap gap-1.5">
                {h.fuentes.map((id) => {
                  const f = porId.get(id);
                  return f ? (
                    <a
                      key={id}
                      data-fuente={id}
                      href={f.fuente_url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-border px-2.5 py-0.5 text-xs text-text-muted transition hover:border-text hover:text-text"
                    >
                      {f.nombre} ↗
                    </a>
                  ) : null;
                })}
              </p>
            </li>
          ))}
        </ul>
      ) : null}

      <dl className="grid gap-5 border-t border-border px-6 py-5 text-sm sm:grid-cols-3">
        {informe.hueco ? <Dato titulo="Gap for ClosetAI" texto={informe.hueco} /> : null}
        {informe.riesgo ? <Dato titulo="Risk" texto={informe.riesgo} /> : null}
        <Dato titulo="Still to validate" texto={informe.falta_validar} />
      </dl>

      <div className="border-t border-border px-6 py-5">
        {guardado ? (
          <p className="text-sm">Saved. It now appears below, under saved research.</p>
        ) : (
          <form
            action={(fd) =>
              iniciar(async () => {
                const r = await guardarInvestigacion(fd);
                if (r.error) setError(r.error);
                else {
                  setGuardado(true);
                  router.refresh();
                }
              })
            }
          >
            <input
              type="hidden"
              name="payload"
              value={JSON.stringify({
                informe,
                pregunta: datos.pregunta,
                modelo: datos.modelo,
                versionPrompt: datos.versionPrompt,
              })}
            />
            <button
              type="submit"
              disabled={pendiente}
              className="rounded-full border border-text px-6 py-2.5 text-sm font-medium transition hover:bg-text hover:text-bg disabled:opacity-60"
            >
              {pendiente ? "Saving…" : "Save this report"}
            </button>
            {error ? <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p> : null}
          </form>
        )}
      </div>
    </article>
  );
}

function Dato({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div>
      <dt className="text-xs tracking-[0.16em] text-text-muted uppercase">{titulo}</dt>
      <dd className="mt-1.5 leading-relaxed">{texto}</dd>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Competitors and substitutes table, with filter and search
// ---------------------------------------------------------------------------

const OPCIONES: { valor: FiltroTabla["tipo"]; etiqueta: string }[] = [
  { valor: "todos", etiqueta: "All" },
  { valor: "competidor", etiqueta: "Competitors" },
  { valor: "sustituto", etiqueta: "Substitutes" },
];

export function TablaCompetidores({ fuentes }: { fuentes: Fuente[] }) {
  const [filtro, setFiltro] = useState<FiltroTabla>({ tipo: "todos", texto: "" });
  const visibles = useMemo(() => filtrarFuentes(fuentes, filtro), [fuentes, filtro]);
  const total = filasDeLaTabla(fuentes).length;

  return (
    <div>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2" role="group" aria-label="Filter by type">
          {OPCIONES.map((o) => (
            <button
              key={o.valor}
              type="button"
              aria-pressed={filtro.tipo === o.valor}
              onClick={() => setFiltro((f) => ({ ...f, tipo: o.valor }))}
              className="rounded-full border border-border px-4 py-1.5 text-sm transition hover:border-text aria-pressed:border-text aria-pressed:bg-text aria-pressed:text-bg"
            >
              {o.etiqueta}
            </button>
          ))}
        </div>
        <input
          type="search"
          aria-label="Search competitors and substitutes"
          placeholder="Search: name, country, price…"
          value={filtro.texto}
          onChange={(e) => setFiltro((f) => ({ ...f, texto: e.target.value }))}
          className="w-full rounded-full border border-border bg-surface px-4 py-2 text-sm outline-none focus:border-accent sm:w-72"
        />
      </div>

      <p className="mt-3 text-xs text-text-muted" aria-live="polite">
        {visibles.length} of {total}
      </p>

      {visibles.length === 0 ? (
        <p className="mt-4 rounded-xl border border-border bg-surface-2 px-4 py-6 text-center text-sm">
          No competitor or substitute matches “{filtro.texto}”.
        </p>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-xl border border-border">
          <table data-testid="tabla-competidores" className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-surface-2 text-xs tracking-[0.12em] text-text-muted uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Verified fact</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Threat</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((f) => (
                <tr key={f.id} data-tipo={f.tipo} className="border-t border-border align-top">
                  <td className="px-4 py-3">
                    <p className="font-medium">{f.nombre}</p>
                    {f.pais ? <p className="text-xs text-text-muted">{f.pais}</p> : null}
                  </td>
                  <td className="px-4 py-3 capitalize">{f.tipo === "competidor" ? "competitor" : f.tipo === "sustituto" ? "substitute" : f.tipo}</td>
                  <td className="px-4 py-3">
                    <p className="leading-relaxed">{f.dato_clave}</p>
                    <a
                      href={f.fuente_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-block text-xs text-text-muted underline underline-offset-4 hover:text-text"
                    >
                      {f.fuente_nombre} ↗
                    </a>
                  </td>
                  <td className="px-4 py-3 text-text-muted">{f.precio ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Amenaza nivel={f.amenaza} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Amenaza({ nivel }: { nivel: number | null }) {
  if (!nivel) return <span className="text-text-muted">—</span>;
  const etiqueta = ["", "Low", "Medium", "High"][nivel];
  return (
    <span className="whitespace-nowrap" aria-label={`${etiqueta} threat`}>
      <span aria-hidden>{"●".repeat(nivel)}</span>
      <span aria-hidden className="text-text-muted/40">{"●".repeat(3 - nivel)}</span>{" "}
      <span className="text-xs text-text-muted">{etiqueta}</span>
    </span>
  );
}

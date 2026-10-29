"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { PREGUNTAS, SEGUIMIENTOS_MAXIMOS, sugerenciasDe, type Seccion } from "@/lib/chat";
import { TIENDAS, tiendasDelChat } from "@/lib/compras";

import { calificar, enviar, guardarResumen, iniciarConversacion, type Mensaje } from "./actions";

/** The first question is shown before anything is saved: nothing to save yet. */
const PRIMERA: Mensaje = { id: 0, rol: "asistente", contenido: PREGUNTAS[0].texto, pregunta: 0 };

export function Chat({ tester }: { tester: 1 | 2 | 3 | null }) {
  const [sesion, setSesion] = useState<string | null>(null);
  const [consentimiento, setConsentimiento] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>([PRIMERA]);
  const [siguiente, setSiguiente] = useState<number | null>(0);
  const [restantes, setRestantes] = useState(SEGUIMIENTOS_MAXIMOS);
  const [revision, setRevision] = useState(false);
  const [texto, setTexto] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [calificados, setCalificados] = useState<Record<number, 1 | -1>>({});
  const [seccion, setSeccion] = useState<Seccion | null>(null);
  const [pendiente, iniciar] = useTransition();
  const fin = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fin.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [mensajes, pendiente]);

  const pregunta = siguiente === null ? null : PREGUNTAS[siguiente];
  const conSugerencia = mensajes.some((m) => m.outfit);
  const bloqueado = Boolean(tester && !consentimiento && !sesion);
  const agotado = siguiente === null && restantes <= 0;

  function mandar(valor: string) {
    const limpio = valor.trim();
    if (!limpio || pendiente) return;
    setError(null);
    iniciar(async () => {
      let id = sesion;
      if (!id) {
        const r = await iniciarConversacion({ tester, consentimiento });
        if (!r.ok) {
          setError(r.error);
          return;
        }
        id = r.id;
        setSesion(id);
      }
      const r = await enviar(id, limpio);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setTexto("");
      setMensajes((previos) => [...previos, ...r.mensajes]);
      setSiguiente(r.siguiente);
      setRestantes(r.seguimientosRestantes);
      setSeccion(r.seccion);
      if (r.revision) setRevision(true);
    });
  }

  function puntuar(id: number, valor: 1 | -1) {
    if (calificados[id]) return;
    setCalificados((c) => ({ ...c, [id]: valor }));
    void calificar(id, valor).then((r) => {
      if (!r.ok)
        setCalificados((c) => {
          const resto = { ...c };
          delete resto[id];
          return resto;
        });
    });
  }

  function empezarDeNuevo() {
    setSesion(null);
    setMensajes([PRIMERA]);
    setSiguiente(0);
    setRestantes(SEGUIMIENTOS_MAXIMOS);
    setRevision(false);
    setError(null);
    setCalificados({});
    setSeccion(null);
  }

  return (
    <div className="mt-10">
      {tester && !sesion ? (
        <label
          data-testid="consentimiento"
          className="mb-4 flex items-start gap-3 rounded-xl border border-border bg-surface p-4 text-sm"
        >
          <input
            type="checkbox"
            checked={consentimiento}
            onChange={(e) => setConsentimiento(e.target.checked)}
            className="mt-0.5 h-4 w-4"
          />
          <span>
            I agree that this conversation is saved without my name, for Tamara’s university project, and
            that the summary I write at the end is shown on this page.
          </span>
        </label>
      ) : null}

      <div
        data-testid="chat"
        aria-live="polite"
        className="rounded-3xl border border-border bg-surface p-4 shadow-[0_18px_40px_-28px_rgba(36,26,22,0.35)] sm:p-6"
      >
        <Progreso paso={siguiente ?? PREGUNTAS.length} />

        <ul className="mt-5 space-y-4">
          {mensajes.map((m, i) => (
            <li
              key={`${m.id}-${i}`}
              data-rol={m.rol}
              className={`llega ${m.rol === "usuaria" ? "flex justify-end" : "flex items-start gap-2.5"}`}
            >
              {m.rol === "asistente" ? <Avatar /> : null}
              {m.rol === "usuaria" ? (
                <p className="max-w-[80%] rounded-2xl rounded-br-md bg-tinta px-4 py-2.5 text-hueso">{m.contenido}</p>
              ) : m.guardrail ? (
                <div
                  data-testid="guardrail"
                  className="max-w-[90%] rounded-2xl border-2 border-dashed px-4 py-3"
                  style={{ borderColor: "var(--barro)" }}
                >
                  <p className="text-pretty">{m.contenido}</p>
                  <span
                    className="mt-2 inline-block rounded-full border px-2.5 py-0.5 text-xs"
                    style={{ borderColor: "var(--barro)", color: "var(--barro)" }}
                  >
                    flagged for review
                  </span>
                </div>
              ) : m.pregunta !== undefined ? (
                <p className="max-w-[85%] rounded-2xl rounded-tl-md bg-arena px-4 py-3">
                  <span className="block text-[11px] font-medium tracking-[0.14em] text-barro uppercase">
                    Question {m.pregunta + 1} of {PREGUNTAS.length}
                  </span>
                  <span className="mt-0.5 block font-display text-xl leading-snug font-semibold text-balance">
                    {m.contenido}
                  </span>
                </p>
              ) : (
                <div
                  data-testid={m.outfit ? "outfit" : "respuesta"}
                  className="max-w-[92%] rounded-2xl rounded-tl-md border border-border bg-hueso px-4 py-4 sm:px-5"
                >
                  {m.outfit ? (
                    <>
                      <p className="text-[11px] font-medium tracking-[0.14em] text-barro uppercase">Your outfit</p>
                      <p className="mt-0.5 font-display text-2xl leading-tight font-semibold">{m.outfit.titulo}</p>
                      <ul className="mt-3 space-y-1.5">
                        {m.outfit.prendas.map((p) => (
                          <li key={p.prenda} data-testid="prenda" className="rounded-xl bg-arena/70 px-3 py-2.5 text-sm">
                            <span className="flex items-center gap-2 font-medium">
                              <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-barro" />
                              {p.prenda}
                            </span>
                            <span className="mt-1.5 flex flex-wrap items-center gap-1.5 pl-3.5 text-xs text-text-muted">
                              Find something similar:
                              {tiendasDelChat(seccion).map((tienda) => (
                                <a
                                  key={tienda}
                                  data-tienda={tienda}
                                  href={`/go/${tienda}/${encodeURIComponent(p.busqueda)}${seccion ? `?s=${seccion}` : ""}`}
                                  target="_blank"
                                  rel="noopener noreferrer nofollow"
                                  className="rounded-full border border-border bg-bg px-2.5 py-0.5 font-medium text-text transition hover:border-barro"
                                >
                                  {TIENDAS[tienda].nombre} ↗
                                </a>
                              ))}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                  <p className={m.outfit ? "mt-3 text-pretty text-text-muted" : "text-pretty"}>{m.contenido}</p>
                  {m.outfit ? (
                    <>
                      <p className="mt-2 text-sm text-pretty">
                        <span className="text-text-muted">Tip: </span>
                        {m.outfit.tip}
                      </p>
                      <p className="mt-2 text-xs text-text-muted text-pretty">
                        Each store link opens that store’s own results, with photos and prices. ClosetAI doesn’t
                        sell anything and these aren’t ads.
                      </p>
                    </>
                  ) : null}
                  <div className="mt-3 flex items-center gap-2" data-testid="calificar">
                    {([1, -1] as const).map((v) => (
                      <button
                        key={v}
                        type="button"
                        aria-label={v === 1 ? "Helpful" : "Not helpful"}
                        aria-pressed={calificados[m.id] === v}
                        disabled={Boolean(calificados[m.id])}
                        onClick={() => puntuar(m.id, v)}
                        className={`rounded-lg border px-3 py-1 text-sm transition ${
                          calificados[m.id] === v ? "border-text bg-surface-2" : "border-border hover:border-text"
                        } disabled:cursor-default`}
                      >
                        {v === 1 ? "👍" : "👎"}
                      </button>
                    ))}
                    {calificados[m.id] ? <span className="text-xs text-text-muted">Thanks for rating</span> : null}
                  </div>
                </div>
              )}
            </li>
          ))}
          {pendiente ? (
            <li data-testid="pensando" className="llega flex items-center gap-2.5 text-sm text-text-muted">
              <Avatar />
              <span className="flex items-center gap-2 rounded-2xl rounded-tl-md bg-arena px-4 py-3">
                <Puntos />
                {siguiente === PREGUNTAS.length - 1 || siguiente === null ? "Putting an outfit together…" : null}
              </span>
            </li>
          ) : null}
        </ul>
        <div ref={fin} />

        {revision ? (
          <p data-testid="aviso-revision" className="mt-4 text-xs text-text-muted">
            This conversation is flagged for a person from ClosetAI to review.
          </p>
        ) : null}

        {error ? (
          <p role="alert" data-testid="error-chat" className="mt-4 rounded-lg border border-red-500/40 px-3 py-2 text-sm text-red-700 dark:text-red-300">
            {error}
          </p>
        ) : null}

        {pregunta ? (
          <div data-testid="sugerencias" className="llega mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {sugerenciasDe(pregunta, seccion).map((s) => (
              <button
                key={s.texto}
                type="button"
                disabled={pendiente || bloqueado}
                onClick={() => mandar(s.texto)}
                className="group flex items-center gap-3 rounded-2xl border border-border bg-bg px-3 py-3 text-left text-sm font-medium transition hover:-translate-y-0.5 hover:border-barro hover:shadow-[0_8px_20px_-14px_rgba(141,69,38,0.6)] disabled:pointer-events-none disabled:opacity-50"
              >
                <span
                  aria-hidden
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-arena text-lg transition group-hover:scale-110"
                >
                  {s.icono}
                </span>
                {s.texto}
              </button>
            ))}
          </div>
        ) : null}

        {pregunta && !pregunta.ejemplo ? null : agotado ? (
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-text-muted">
            That’s the limit for this conversation.
            <button type="button" onClick={empezarDeNuevo} className="underline underline-offset-4 hover:text-text">
              Start a new one
            </button>
          </div>
        ) : (
          <form
            className="mt-4 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              mandar(texto);
            }}
          >
            <label htmlFor="mensaje" className="sr-only">
              {pregunta ? pregunta.texto : "Ask a follow-up"}
            </label>
            <input
              id="mensaje"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              maxLength={pregunta ? 120 : 400}
              disabled={pendiente || bloqueado}
              placeholder={pregunta ? (pregunta.ejemplo ?? undefined) : `Ask a follow-up… (${restantes} left)`}
              className="min-w-0 flex-1 rounded-lg border border-border bg-bg px-3.5 py-2.5 outline-none focus:border-text disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={pendiente || bloqueado || !texto.trim()}
              className="rounded-lg bg-text px-4 py-2.5 font-medium text-bg transition hover:opacity-90 disabled:opacity-50"
            >
              Send
            </button>
          </form>
        )}
        {bloqueado ? (
          <p className="mt-2 text-xs text-text-muted">Tick the box above to start your test.</p>
        ) : null}
      </div>

      {sesion && siguiente === null ? (
        <button type="button" onClick={empezarDeNuevo} className="mt-3 text-sm text-text-muted underline underline-offset-4 hover:text-text">
          Start over
        </button>
      ) : null}

      {tester && sesion && conSugerencia ? <ResumenTester sesion={sesion} tester={tester} /> : null}
    </div>
  );
}

function ResumenTester({ sesion, tester }: { sesion: string; tester: 1 | 2 | 3 }) {
  const [estado, setEstado] = useState<"abierto" | "guardado">("abierto");
  const [error, setError] = useState<string | null>(null);
  const [puntaje, setPuntaje] = useState<number | null>(null);
  const [pendiente, iniciar] = useTransition();

  if (estado === "guardado") {
    return (
      <p data-testid="resumen-guardado" className="mt-8 rounded-xl border border-border bg-surface p-5">
        Thank you! Your summary is saved and appears below.
      </p>
    );
  }

  return (
    <form
      data-testid="resumen"
      className="mt-8 space-y-4 rounded-2xl border border-border bg-surface p-5"
      action={(fd) => {
        setError(null);
        fd.set("tester", String(tester));
        if (puntaje) fd.set("puntaje", String(puntaje));
        iniciar(async () => {
          const r = await guardarResumen(sesion, fd);
          if (r.ok) setEstado("guardado");
          else setError(r.error);
        });
      }}
    >
      <h2 className="font-display text-xl font-semibold">Before you go: your summary</h2>
      <div>
        <label htmlFor="funciono" className="block text-sm font-medium">What worked?</label>
        <textarea id="funciono" name="funciono" required rows={2} maxLength={600}
          className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 outline-none focus:border-text" />
      </div>
      <div>
        <label htmlFor="confuso" className="block text-sm font-medium">What was confusing or didn’t work?</label>
        <textarea id="confuso" name="confuso" rows={2} maxLength={600}
          className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 outline-none focus:border-text" />
      </div>
      <fieldset>
        <legend className="text-sm font-medium">From 1 to 5, how useful was it?</legend>
        <div className="mt-2 flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" aria-pressed={puntaje === n} onClick={() => setPuntaje(n)}
              className={`h-10 w-10 rounded-full border text-sm ${puntaje === n ? "border-text bg-text text-bg" : "border-border"}`}>
              {n}
            </button>
          ))}
        </div>
      </fieldset>
      {error ? <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p> : null}
      <button type="submit" disabled={pendiente || !puntaje}
        className="rounded-lg bg-text px-4 py-2.5 font-medium text-bg transition hover:opacity-90 disabled:opacity-50">
        {pendiente ? "Saving…" : "Save my summary"}
      </button>
    </form>
  );
}

/** The three steps at the top: done ones are ticked, the current one is filled. */
function Progreso({ paso }: { paso: number }) {
  return (
    <ol aria-label="Progress" className="flex items-center gap-1.5 sm:gap-2">
      {PREGUNTAS.map((p, i) => {
        const hecho = i < paso;
        const actual = i === paso;
        return (
          <li key={p.id} className="flex flex-1 items-center gap-1.5 sm:gap-2">
            <span
              aria-current={actual ? "step" : undefined}
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition ${
                hecho ? "bg-barro text-hueso" : actual ? "bg-tinta text-hueso" : "border border-border text-text-muted"
              }`}
            >
              {hecho ? "✓" : i + 1}
            </span>
            <span
              className={`text-xs sm:inline sm:text-sm ${actual ? "font-medium text-text" : "hidden text-text-muted"}`}
            >
              {p.paso}
            </span>
            {i < PREGUNTAS.length - 1 ? (
              <span aria-hidden className={`h-px flex-1 ${hecho ? "bg-barro" : "bg-border"}`} />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

/** The stylist's mark next to each of its messages. */
function Avatar() {
  return (
    <span
      aria-hidden
      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-barro font-display text-sm font-semibold text-hueso"
    >
      C
    </span>
  );
}

/** Three dots while the stylist thinks. */
function Puntos() {
  return (
    <span aria-label="Thinking" className="flex gap-1">
      {[0, 150, 300].map((d) => (
        <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-barro/70" style={{ animationDelay: `${d}ms` }} />
      ))}
    </span>
  );
}


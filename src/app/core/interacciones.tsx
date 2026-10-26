"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { generarNucleo, guardarNucleo, type EstadoCore } from "./actions";

const INICIAL: EstadoCore = { estado: "vacio" };

const EJEMPLO =
  "I like to be comfortable but look like I made an effort. I wear a lot of black and beige, wide jeans and sneakers. " +
  "I hate very tight clothes and big prints. For the office I just throw a blazer on top.";

export function Nucleo({ guardados }: { guardados: number }) {
  const [estado, accion, generando] = useActionState(generarNucleo, INICIAL);
  const [texto, setTexto] = useState("");

  return (
    <>
      <form action={accion} className="mt-8">
        <label htmlFor="texto" className="block text-sm font-medium">
          How do you like to dress?
        </label>
        <p className="mt-1 text-sm text-text-muted">
          Write it the way you&apos;d tell a friend. It doesn&apos;t have to sound nice.
        </p>

        <textarea
          id="texto"
          name="texto"
          rows={6}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          maxLength={1000}
          placeholder={EJEMPLO}
          className="mt-3 w-full resize-y rounded-xl border border-border bg-surface px-4 py-3 leading-relaxed outline-none placeholder:text-text-muted/70 focus:border-accent"
        />

        <div className="mt-2 flex items-center justify-between text-xs text-text-muted">
          <button
            type="button"
            onClick={() => setTexto(EJEMPLO)}
            className="underline underline-offset-4 transition hover:text-text"
          >
            Use an example
          </button>
          <span>{texto.trim().length} / 1000</span>
        </div>

        <button
          type="submit"
          disabled={generando}
          className="mt-4 w-full rounded-full bg-text px-6 py-3.5 font-medium text-bg transition hover:opacity-90 disabled:opacity-60 sm:w-auto sm:px-10"
        >
          {generando ? "Reading you…" : "Extract my core"}
        </button>
      </form>

      {estado.estado === "error" ? (
        <p className="mt-5 rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm">
          {estado.mensaje}
        </p>
      ) : null}

      {estado.estado === "listo" ? <Tarjeta datos={estado} guardados={guardados} /> : null}
    </>
  );
}

function Tarjeta({
  datos,
  guardados,
}: {
  datos: Extract<EstadoCore, { estado: "listo" }>;
  guardados: number;
}) {
  const { core } = datos;
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState<string>();
  const [pendiente, iniciar] = useTransition();
  const router = useRouter();

  return (
    <article className="mt-10 overflow-hidden rounded-2xl border border-border bg-surface">
      <header className="border-b border-border px-6 py-5" style={{ background: "var(--arena)" }}>
        <p className="text-xs tracking-[0.16em] text-text-muted uppercase">Your style core</p>
        <p className="mt-2 font-display text-2xl leading-snug font-semibold tracking-tight text-balance">
          {core.esencia}
        </p>
      </header>

      <div className="grid gap-6 px-6 py-6 sm:grid-cols-2">
        <Lista titulo="Principles" items={core.principios} />
        <Lista titulo="Palette" items={core.paleta} />
        <Lista titulo="Silhouettes" items={core.siluetas} />
        <Lista titulo="Avoid" items={core.evitar} />
      </div>

      <div className="border-t border-border px-6 py-5">
        <p className="text-xs tracking-[0.16em] text-text-muted uppercase">Your rule</p>
        <p className="mt-2 font-display text-lg italic">“{core.regla}”</p>
      </div>

      {/*
        Confidence and what was missing are always shown, not only when they are
        good. A core that sounds just as sure with three vague lines as with a
        detailed paragraph is exactly what this page does not want to be.
      */}
      <div className="border-t border-border px-6 py-4 text-sm text-text-muted">
        <p>
          How sure I am: <strong className="text-text">{Math.round(core.confianza * 100)}%</strong>
          {core.falta ? ` · What I didn’t get to know: ${core.falta}` : null}
        </p>
      </div>

      <div className="border-t border-border px-6 py-5">
        {guardado ? (
          <p className="text-sm">
            Saved. It now appears below, with the other {guardados > 0 ? guardados : ""} cores.
          </p>
        ) : (
          <form
            action={(fd) =>
              iniciar(async () => {
                const r = await guardarNucleo(fd);
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
                core,
                entrada: datos.entrada,
                modelo: datos.modelo,
                versionPrompt: datos.versionPrompt,
              })}
            />
            <button
              type="submit"
              disabled={pendiente}
              className="rounded-full border border-text px-6 py-2.5 text-sm font-medium transition hover:bg-text hover:text-bg disabled:opacity-60"
            >
              {pendiente ? "Saving…" : "Save this core"}
            </button>
            {error ? <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p> : null}
          </form>
        )}
      </div>
    </article>
  );
}

function Lista({ titulo, items }: { titulo: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-xs tracking-[0.16em] text-text-muted uppercase">{titulo}</p>
      <ul className="mt-2 space-y-1.5">
        {items.map((i) => (
          <li key={i} className="leading-relaxed first-letter:uppercase">
            {i}
          </li>
        ))}
      </ul>
    </div>
  );
}

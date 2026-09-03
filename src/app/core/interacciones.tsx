"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { generarNucleo, guardarNucleo, type EstadoCore } from "./actions";

const INICIAL: EstadoCore = { estado: "vacio" };

const EJEMPLO =
  "Me gusta andar cómoda pero que se vea que me arreglé. Uso mucho negro y beige, jeans anchos y tenis. " +
  "Odio la ropa muy entallada y los estampados grandes. Para la oficina le pongo un saco encima y ya.";

export function Nucleo({ guardados }: { guardados: number }) {
  const [estado, accion, generando] = useActionState(generarNucleo, INICIAL);
  const [texto, setTexto] = useState("");

  return (
    <>
      <form action={accion} className="mt-8">
        <label htmlFor="texto" className="block text-sm font-medium">
          ¿Cómo te gusta vestirte?
        </label>
        <p className="mt-1 text-sm text-text-muted">
          Escríbelo como se lo contarías a una amiga. No hace falta que suene bonito.
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
            Usar un ejemplo
          </button>
          <span>{texto.trim().length} / 1000</span>
        </div>

        <button
          type="submit"
          disabled={generando}
          className="mt-4 w-full rounded-full bg-text px-6 py-3.5 font-medium text-bg transition hover:opacity-90 disabled:opacity-60 sm:w-auto sm:px-10"
        >
          {generando ? "Leyéndote…" : "Extraer mi núcleo"}
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
        <p className="text-xs tracking-[0.16em] text-text-muted uppercase">Tu núcleo de estilo</p>
        <p className="mt-2 font-display text-2xl leading-snug font-semibold tracking-tight text-balance">
          {core.esencia}
        </p>
      </header>

      <div className="grid gap-6 px-6 py-6 sm:grid-cols-2">
        <Lista titulo="Principios" items={core.principios} />
        <Lista titulo="Paleta" items={core.paleta} />
        <Lista titulo="Siluetas" items={core.siluetas} />
        <Lista titulo="Evitar" items={core.evitar} />
      </div>

      <div className="border-t border-border px-6 py-5">
        <p className="text-xs tracking-[0.16em] text-text-muted uppercase">Tu regla</p>
        <p className="mt-2 font-display text-lg italic">“{core.regla}”</p>
      </div>

      {/*
        La confianza y lo que faltó se muestran siempre, no solo cuando son
        buenas. Un núcleo que se presenta igual de seguro con tres líneas vagas
        que con un párrafo detallado es exactamente lo que esta página no quiere
        ser.
      */}
      <div className="border-t border-border px-6 py-4 text-sm text-text-muted">
        <p>
          Qué tan seguro estoy: <strong className="text-text">{Math.round(core.confianza * 100)}%</strong>
          {core.falta ? ` · Me faltó saber: ${core.falta}` : null}
        </p>
      </div>

      <div className="border-t border-border px-6 py-5">
        {guardado ? (
          <p className="text-sm">
            Guardado. Ya aparece abajo, junto a los otros {guardados > 0 ? guardados : ""} núcleos.
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
              {pendiente ? "Guardando…" : "Guardar este núcleo"}
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

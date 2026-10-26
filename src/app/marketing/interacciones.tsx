"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { FORMATO_LEGIBLE } from "@/lib/marketing";

import { generarPost, guardarPost, type EstadoGenerador } from "./actions";

/** Copy to the clipboard, with the confirmation on the same button. */
export function BotonCopiar({ texto, etiqueta = "Copy" }: { texto: string; etiqueta?: string }) {
  const [hecho, setHecho] = useState<"no" | "si" | "error">("no");
  return (
    <button
      type="button"
      data-copiar
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(texto);
          setHecho("si");
        } catch {
          // Without clipboard permission (or in an old browser) we say so instead of pretending.
          setHecho("error");
        }
        setTimeout(() => setHecho("no"), 1800);
      }}
      className="rounded-full border border-border px-3.5 py-1.5 text-sm transition hover:border-text"
    >
      {hecho === "si" ? "Copied" : hecho === "error" ? "Could not copy" : etiqueta}
    </button>
  );
}

/** Download a file built in the browser. A CSV needs no server. */
export function BotonExportar({
  nombre,
  contenido,
  tipo,
  etiqueta,
}: {
  nombre: string;
  contenido: string;
  tipo: "text/markdown" | "text/csv";
  etiqueta: string;
}) {
  return (
    <button
      type="button"
      data-exportar={nombre}
      onClick={() => {
        // The BOM makes Excel open the CSV with accented characters intact.
        const blob = new Blob([tipo === "text/csv" ? "﻿" : "", contenido], { type: `${tipo};charset=utf-8` });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = nombre;
        a.click();
        URL.revokeObjectURL(url);
      }}
      className="rounded-full border border-text px-4 py-2 text-sm transition hover:bg-text hover:text-bg"
    >
      {etiqueta}
    </button>
  );
}

const INICIAL: EstadoGenerador = { estado: "vacio" };

const EJEMPLOS = ["Why there is no monthly fee", "What to wear on a rainy Monday", "Photographing your clothes without the hassle"];

/** The generator: topic + channel → AI post → check → save as "not reviewed". */
export function Generador() {
  const [estado, accion, generando] = useActionState(generarPost, INICIAL);
  const [tema, setTema] = useState("");
  const [guardado, setGuardado] = useState<string | null>(null);
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);
  const [guardando, iniciar] = useTransition();
  const router = useRouter();

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <form
        action={(fd) => {
          setGuardado(null);
          setErrorGuardar(null);
          accion(fd);
        }}
        className="rounded-2xl border border-border bg-surface p-5"
      >
        <label htmlFor="tema" className="block text-sm font-medium">
          Post topic
        </label>
        <input
          id="tema"
          name="tema"
          value={tema}
          onChange={(e) => setTema(e.target.value)}
          maxLength={200}
          placeholder="For example: what to wear on a rainy Monday"
          className="mt-1.5 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {EJEMPLOS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setTema(e)}
              className="rounded-full border border-border px-3 py-1 text-xs text-text-muted transition hover:border-text hover:text-text"
            >
              {e}
            </button>
          ))}
        </div>

        <fieldset className="mt-4">
          <legend className="text-sm font-medium">Channel</legend>
          <div className="mt-1.5 flex gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="radio" name="canal" value="instagram" defaultChecked /> Instagram
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="canal" value="tiktok" /> TikTok
            </label>
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={generando}
          className="mt-5 rounded-full bg-text px-5 py-2.5 text-sm font-medium text-bg transition hover:opacity-90 disabled:opacity-50"
        >
          {generando ? "Writing…" : "Generate post"}
        </button>
        <p className="mt-3 text-xs text-text-muted">
          An AI writes it in the brand's voice, using only the verified facts. If it invents a figure, the
          post is rejected before it is shown.
        </p>
      </form>

      <div data-testid="resultado-generador" aria-live="polite">
        {estado.estado === "vacio" ? (
          <p className="rounded-2xl border border-dashed border-border p-5 text-sm text-text-muted">
            The post appears here. Nothing is saved until you decide.
          </p>
        ) : null}

        {estado.estado === "error" ? (
          <p role="alert" className="rounded-2xl border border-border p-5 text-sm" style={{ color: "var(--barro)" }}>
            {estado.mensaje}
          </p>
        ) : null}

        {estado.estado === "listo" ? (
          <article data-testid="post-generado" className="rounded-2xl border border-border bg-surface p-5">
            <p className="text-xs tracking-[0.14em] text-text-muted uppercase">
              Generated with AI · not reviewed · {estado.canal === "tiktok" ? "TikTok" : "Instagram"} · {FORMATO_LEGIBLE[estado.post.formato]}
            </p>
            <h3 className="mt-2 font-display text-xl font-semibold">{estado.post.titulo}</h3>
            <p className="mt-2 leading-relaxed whitespace-pre-line">{estado.post.cuerpo}</p>
            <p className="mt-3 text-sm text-text-muted">{estado.post.hashtags.join(" ")}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <BotonCopiar
                texto={`${estado.post.cuerpo}\n\n${estado.post.hashtags.join(" ")}`}
              />
              <button
                type="button"
                disabled={guardando || guardado !== null}
                onClick={() =>
                  iniciar(async () => {
                    const r = await guardarPost({ canal: estado.canal, tema: estado.tema, post: estado.post });
                    if (r.ok) {
                      setGuardado(r.id);
                      router.refresh();
                    } else setErrorGuardar(r.mensaje);
                  })
                }
                className="rounded-full border border-text px-4 py-1.5 text-sm transition hover:bg-text hover:text-bg disabled:opacity-50"
              >
                {guardado ? "Saved" : guardando ? "Saving…" : "Save"}
              </button>
            </div>
            {errorGuardar ? (
              <p role="alert" className="mt-3 text-sm" style={{ color: "var(--barro)" }}>
                {errorGuardar}
              </p>
            ) : null}
            <p className="mt-3 text-xs text-text-muted">
              It is saved publicly as “generated with AI, not reviewed”. Publishing it on social media is still a
              person's decision. Model: {estado.modelo}.
            </p>
          </article>
        ) : null}
      </div>
    </div>
  );
}

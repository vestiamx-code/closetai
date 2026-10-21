"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { generarPost, guardarPost, type EstadoGenerador } from "./actions";

/** Copiar al portapapeles, con la confirmación en el mismo botón. */
export function BotonCopiar({ texto, etiqueta = "Copiar" }: { texto: string; etiqueta?: string }) {
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
          // Sin permiso de portapapeles (o en un navegador viejo) se dice, no se finge.
          setHecho("error");
        }
        setTimeout(() => setHecho("no"), 1800);
      }}
      className="rounded-full border border-border px-3.5 py-1.5 text-sm transition hover:border-text"
    >
      {hecho === "si" ? "Copiado" : hecho === "error" ? "No se pudo copiar" : etiqueta}
    </button>
  );
}

/** Descargar un archivo armado en el navegador. Un CSV no necesita servidor. */
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
        // El BOM hace que Excel abra el CSV con los acentos bien.
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

const EJEMPLOS = ["Por qué no hay mensualidad", "Qué ponerse un lunes de lluvia", "Fotografiar la ropa sin flojera"];

/** El generador: tema + canal → post con IA → revisar → guardar como «sin revisar». */
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
          Tema del post
        </label>
        <input
          id="tema"
          name="tema"
          value={tema}
          onChange={(e) => setTema(e.target.value)}
          maxLength={200}
          placeholder="Por ejemplo: qué ponerse un lunes de lluvia"
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
          <legend className="text-sm font-medium">Canal</legend>
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
          {generando ? "Escribiendo…" : "Generar post"}
        </button>
        <p className="mt-3 text-xs text-text-muted">
          Lo escribe una IA con la voz de la marca y solo con los datos verificados. Si inventa una cifra, el
          post se rechaza antes de mostrarse.
        </p>
      </form>

      <div data-testid="resultado-generador" aria-live="polite">
        {estado.estado === "vacio" ? (
          <p className="rounded-2xl border border-dashed border-border p-5 text-sm text-text-muted">
            Aquí aparece el post. Nada se guarda hasta que tú lo decidas.
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
              Generado con IA · sin revisar · {estado.canal === "tiktok" ? "TikTok" : "Instagram"} · {estado.post.formato}
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
                {guardado ? "Guardado" : guardando ? "Guardando…" : "Guardar"}
              </button>
            </div>
            {errorGuardar ? (
              <p role="alert" className="mt-3 text-sm" style={{ color: "var(--barro)" }}>
                {errorGuardar}
              </p>
            ) : null}
            <p className="mt-3 text-xs text-text-muted">
              Se guarda en público como «generado con IA, sin revisar». Publicarlo en redes sigue siendo decisión
              de una persona. Modelo: {estado.modelo}.
            </p>
          </article>
        ) : null}
      </div>
    </div>
  );
}

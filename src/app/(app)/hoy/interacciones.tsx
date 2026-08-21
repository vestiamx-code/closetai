"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { comentar, generarOutfits, reaccionar } from "./actions";
import { Aviso } from "@/components/ui/aviso";

const MOTIVOS = [
  "No me gusta la combinación",
  "No es mi estilo",
  "No aplica al clima o la ocasión",
] as const;

export function BotonGenerar({ texto }: { texto: string }) {
  const [error, setError] = useState<string>();
  const [pendiente, iniciar] = useTransition();
  const router = useRouter();

  return (
    <div>
      {error ? (
        <div className="mb-4">
          <Aviso>{error}</Aviso>
        </div>
      ) : null}
      <button
        disabled={pendiente}
        onClick={() =>
          iniciar(async () => {
            setError(undefined);
            const r = await generarOutfits();
            if (!r.ok) setError(r.motivo);
            else router.refresh();
          })
        }
        className="w-full rounded-lg bg-accent px-5 py-3 font-medium text-accent-contrast transition hover:opacity-90 disabled:opacity-60"
      >
        {pendiente ? "Pensando en tu clóset…" : texto}
      </button>
    </div>
  );
}

export function Acciones({ outfitId }: { outfitId: string }) {
  const [pendiente, iniciar] = useTransition();
  const [mostrarMotivos, setMostrarMotivos] = useState(false);
  const [mostrarComentario, setMostrarComentario] = useState(false);
  const [listo, setListo] = useState<string>();
  const [error, setError] = useState<string>();
  const router = useRouter();

  /**
   * La confirmación se muestra DESPUÉS de que el servidor responde, no antes.
   * Una confirmación optimista aquí sería mentir: si el evento de feedback no
   * se guarda, ClosetAI no aprende nada y la usuaria creería que sí.
   */
  function enviar(tipo: string, motivo: string | undefined, mensajeExito: string) {
    iniciar(async () => {
      setError(undefined);
      const fd = new FormData();
      fd.set("outfit_id", outfitId);
      fd.set("tipo", tipo);
      if (motivo) fd.set("motivo", motivo);
      const r = await reaccionar(fd);
      if (r?.error) setError(r.error);
      else {
        setListo(mensajeExito);
        router.refresh();
      }
    });
  }

  if (listo) {
    return <p className="mt-5 text-sm text-accent">{listo}</p>;
  }

  return (
    <div className="mt-5">
      {error ? (
        <div className="mb-3">
          <Aviso>{error}</Aviso>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          disabled={pendiente}
          onClick={() => enviar("accept", undefined, "Anotado. Que lo disfrutes.")}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-contrast transition hover:opacity-90 disabled:opacity-60"
        >
          Me lo pongo
        </button>
        <button
          disabled={pendiente}
          onClick={() => setMostrarMotivos((v) => !v)}
          className="rounded-lg border border-border px-4 py-2 text-sm transition hover:bg-surface-2 disabled:opacity-60"
        >
          No, gracias
        </button>
        <button
          disabled={pendiente}
          onClick={() => enviar("favorite", undefined, "Guardado en favoritos.")}
          className="rounded-lg border border-border px-4 py-2 text-sm transition hover:bg-surface-2 disabled:opacity-60"
        >
          Guardar
        </button>
        <button
          disabled={pendiente}
          onClick={() => setMostrarComentario((v) => !v)}
          className="rounded-lg border border-border px-4 py-2 text-sm transition hover:bg-surface-2 disabled:opacity-60"
        >
          Comentar
        </button>
      </div>

      {mostrarMotivos ? (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-text-muted">
            ¿Por qué no? Cada respuesta le enseña algo a ClosetAI.
          </p>
          {MOTIVOS.map((motivo) => (
            <button
              key={motivo}
              disabled={pendiente}
              onClick={() =>
                enviar("reject", motivo, "Gracias. No te vuelvo a proponer algo así.")
              }
              className="block w-full rounded-lg border border-border px-3.5 py-2 text-left text-sm transition hover:border-accent/50 disabled:opacity-60"
            >
              {motivo}
            </button>
          ))}
        </div>
      ) : null}

      {mostrarComentario ? (
        <form
          className="mt-3 space-y-2"
          action={(fd) => {
            fd.set("outfit_id", outfitId);
            iniciar(async () => {
              const r = await comentar(fd);
              if (r?.error) setError(r.error);
              else setListo("Gracias, eso me sirve mucho.");
            });
          }}
        >
          <textarea
            name="texto"
            rows={3}
            required
            maxLength={500}
            placeholder="Me encanta pero el saco me queda grande…"
            className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
          <button
            type="submit"
            disabled={pendiente}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-contrast transition hover:opacity-90 disabled:opacity-60"
          >
            Enviar
          </button>
        </form>
      ) : null}
    </div>
  );
}

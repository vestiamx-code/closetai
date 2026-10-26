"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { comentar, generarOutfits, reaccionar } from "./actions";
import { Aviso } from "@/components/ui/aviso";

const MOTIVOS = [
  "I don't like the combination",
  "It's not my style",
  "Wrong for the weather or the occasion",
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
        {pendiente ? "Thinking about your closet…" : texto}
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
          onClick={() => enviar("accept", undefined, "Noted. Enjoy it.")}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-contrast transition hover:opacity-90 disabled:opacity-60"
        >
          I’ll wear it
        </button>
        <button
          disabled={pendiente}
          onClick={() => setMostrarMotivos((v) => !v)}
          className="rounded-lg border border-border px-4 py-2 text-sm transition hover:bg-surface-2 disabled:opacity-60"
        >
          No, thanks
        </button>
        <button
          disabled={pendiente}
          onClick={() => enviar("favorite", undefined, "Saved to favorites.")}
          className="rounded-lg border border-border px-4 py-2 text-sm transition hover:bg-surface-2 disabled:opacity-60"
        >
          Save
        </button>
        <button
          disabled={pendiente}
          onClick={() => setMostrarComentario((v) => !v)}
          className="rounded-lg border border-border px-4 py-2 text-sm transition hover:bg-surface-2 disabled:opacity-60"
        >
          Comment
        </button>
      </div>

      {mostrarMotivos ? (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-text-muted">
            Why not? Every answer teaches ClosetAI something.
          </p>
          {MOTIVOS.map((motivo) => (
            <button
              key={motivo}
              disabled={pendiente}
              onClick={() =>
                enviar("reject", motivo, "Thanks. I won't suggest something like that again.")
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
              else setListo("Thanks, that helps a lot.");
            });
          }}
        >
          <textarea
            name="texto"
            rows={3}
            required
            maxLength={500}
            placeholder="I love it but the blazer is too big on me…"
            className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
          <button
            type="submit"
            disabled={pendiente}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-contrast transition hover:opacity-90 disabled:opacity-60"
          >
            Send
          </button>
        </form>
      ) : null}
    </div>
  );
}

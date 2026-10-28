"use client";

import { useState, useTransition } from "react";

import { abonarManual, marcarRevisada } from "./actions";
import { Aviso } from "@/components/ui/aviso";
import { Campo } from "@/components/ui/campo";

export function AbonarCreditos() {
  const [error, setError] = useState<string>();
  const [ok, setOk] = useState<string>();
  const [pendiente, iniciar] = useTransition();

  return (
    <form
      className="mt-4 space-y-3"
      action={(fd) =>
        iniciar(async () => {
          setError(undefined);
          setOk(undefined);
          const r = await abonarManual(fd);
          if (r.error) setError(r.error);
          else setOk(r.ok);
        })
      }
    >
      {error ? <Aviso>{error}</Aviso> : null}
      {ok ? <Aviso tipo="info">{ok}</Aviso> : null}

      <Campo etiqueta="User’s email" name="correo" type="email" required />
      <div className="grid grid-cols-2 gap-3">
        <Campo etiqueta="Credits" name="cantidad" type="number" min={1} max={100} defaultValue={1} required />
        <Campo etiqueta="Note" name="nota" placeholder="failed render" />
      </div>
      <button
        type="submit"
        disabled={pendiente}
        className="w-full rounded-lg bg-accent px-4 py-2.5 font-medium text-accent-contrast transition hover:opacity-90 disabled:opacity-60"
      >
        {pendiente ? "Adding…" : "Add credits"}
      </button>
    </form>
  );
}

export function MarcarRevisada({ sessionId }: { sessionId: string }) {
  const [pendiente, iniciar] = useTransition();
  const [error, setError] = useState<string>();
  return (
    <span className="flex items-center gap-2">
      {error ? <span className="text-xs text-red-600 dark:text-red-400">{error}</span> : null}
      <button
        type="button"
        disabled={pendiente}
        onClick={() =>
          iniciar(async () => {
            const r = await marcarRevisada(sessionId);
            if (r.error) setError(r.error);
          })
        }
        className="shrink-0 rounded-full border border-border px-3 py-1 text-xs transition hover:border-text disabled:opacity-60"
      >
        {pendiente ? "Saving…" : "Mark reviewed"}
      </button>
    </span>
  );
}


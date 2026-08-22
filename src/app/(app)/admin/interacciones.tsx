"use client";

import { useState, useTransition } from "react";

import { abonarManual } from "./actions";
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

      <Campo etiqueta="Correo de la usuaria" name="correo" type="email" required />
      <div className="grid grid-cols-2 gap-3">
        <Campo etiqueta="Créditos" name="cantidad" type="number" min={1} max={100} defaultValue={1} required />
        <Campo etiqueta="Nota" name="nota" placeholder="render fallido" />
      </div>
      <button
        type="submit"
        disabled={pendiente}
        className="w-full rounded-lg bg-accent px-4 py-2.5 font-medium text-accent-contrast transition hover:opacity-90 disabled:opacity-60"
      >
        {pendiente ? "Abonando…" : "Abonar"}
      </button>
    </form>
  );
}

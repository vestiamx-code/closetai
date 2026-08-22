"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { analizarClosetc } from "./actions";
import { Aviso } from "@/components/ui/aviso";

export function BotonAnalizar({ texto }: { texto: string }) {
  const [mensaje, setMensaje] = useState<string>();
  const [pendiente, iniciar] = useTransition();
  const router = useRouter();

  return (
    <div>
      {mensaje ? (
        <div className="mb-4">
          <Aviso tipo="info">{mensaje}</Aviso>
        </div>
      ) : null}
      <button
        disabled={pendiente}
        onClick={() =>
          iniciar(async () => {
            setMensaje(undefined);
            const r = await analizarClosetc();
            if (!r.ok) setMensaje(r.motivo);
            else router.refresh();
          })
        }
        className="w-full rounded-lg bg-accent px-5 py-3 font-medium text-accent-contrast transition hover:opacity-90 disabled:opacity-60"
      >
        {pendiente ? "Revisando tu clóset…" : texto}
      </button>
    </div>
  );
}

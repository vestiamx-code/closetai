"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { corregirInferencia } from "./actions";

export function BotonCorregir({ lista, valor }: { lista: string; valor: string }) {
  const [pendiente, iniciar] = useTransition();
  const [hecho, setHecho] = useState(false);
  const router = useRouter();

  if (hecho) return <span className="shrink-0 text-xs text-accent">Corregido</span>;

  return (
    <button
      disabled={pendiente}
      title="Esto no es cierto sobre mí"
      onClick={() =>
        iniciar(async () => {
          const fd = new FormData();
          fd.set("lista", lista);
          fd.set("valor", valor);
          await corregirInferencia(fd);
          setHecho(true);
          router.refresh();
        })
      }
      className="shrink-0 text-xs text-text-muted underline underline-offset-4 transition hover:text-text disabled:opacity-60"
    >
      {pendiente ? "…" : "No es cierto"}
    </button>
  );
}

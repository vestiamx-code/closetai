"use client";

import { useState, useTransition } from "react";

import { iniciarCompra } from "./actions";
import { Aviso } from "@/components/ui/aviso";

export function BotonComprar({
  producto,
  texto,
  variante = "primario",
}: {
  producto: "lifetime" | "credits_20";
  texto: string;
  variante?: "primario" | "secundario";
}) {
  const [error, setError] = useState<string>();
  const [pendiente, iniciar] = useTransition();

  const estilos =
    variante === "primario"
      ? "bg-accent text-accent-contrast hover:opacity-90"
      : "border border-border hover:bg-surface-2";

  return (
    <div>
      {error ? (
        <div className="mb-3">
          <Aviso>{error}</Aviso>
        </div>
      ) : null}
      <button
        disabled={pendiente}
        onClick={() =>
          iniciar(async () => {
            setError(undefined);
            const fd = new FormData();
            fd.set("producto", producto);
            const r = await iniciarCompra(fd);
            if (r?.error) setError(r.error);
          })
        }
        className={`w-full rounded-lg px-5 py-3 font-medium transition disabled:opacity-60 ${estilos}`}
      >
        {pendiente ? "Abriendo el pago…" : texto}
      </button>
    </div>
  );
}

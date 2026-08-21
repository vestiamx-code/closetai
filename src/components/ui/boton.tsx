"use client";

import type { ButtonHTMLAttributes } from "react";
import { useFormStatus } from "react-dom";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: "primario" | "secundario";
  /** Texto mientras el formulario se envía. */
  cargando?: string;
};

export function Boton({ variante = "primario", cargando, children, ...props }: Props) {
  const { pending } = useFormStatus();
  const estilos =
    variante === "primario"
      ? "bg-accent text-accent-contrast hover:opacity-90"
      : "border border-border bg-surface hover:bg-surface-2";

  return (
    <button
      {...props}
      disabled={props.disabled || pending}
      className={`w-full rounded-lg px-4 py-2.5 text-base font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${estilos}`}
    >
      {pending && cargando ? cargando : children}
    </button>
  );
}

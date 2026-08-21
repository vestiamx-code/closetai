"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { borrarCuenta, guardarPerfil } from "./actions";
import { Aviso } from "@/components/ui/aviso";
import { Campo } from "@/components/ui/campo";

type Inicial = {
  display_name: string;
  city: string;
  size_top: string;
  size_bottom: string;
  size_shoes: string;
};

export function FormularioPerfil({ inicial }: { inicial: Inicial }) {
  const [error, setError] = useState<string>();
  const [guardado, setGuardado] = useState(false);
  const [pendiente, iniciar] = useTransition();
  const [mostrarBorrado, setMostrarBorrado] = useState(false);
  const router = useRouter();

  return (
    <>
      <form
        className="mt-8 space-y-4"
        action={(formData) => {
          setError(undefined);
          setGuardado(false);
          iniciar(async () => {
            const r = await guardarPerfil(formData);
            if (r.error) setError(r.error);
            else {
              setGuardado(true);
              router.refresh();
            }
          });
        }}
      >
        {error ? <Aviso>{error}</Aviso> : null}
        {guardado ? <Aviso tipo="info">Guardado.</Aviso> : null}

        <Campo etiqueta="Tu nombre" name="display_name" defaultValue={inicial.display_name} required />
        <Campo
          etiqueta="Ciudad"
          name="city"
          defaultValue={inicial.city}
          ayuda="Para saber qué clima vas a tener cuando armemos tus outfits."
        />

        <div className="grid grid-cols-3 gap-3">
          <Campo etiqueta="Talla arriba" name="size_top" defaultValue={inicial.size_top} placeholder="M" />
          <Campo etiqueta="Talla abajo" name="size_bottom" defaultValue={inicial.size_bottom} placeholder="28" />
          <Campo etiqueta="Calzado" name="size_shoes" defaultValue={inicial.size_shoes} placeholder="24.5" />
        </div>

        <button
          type="submit"
          disabled={pendiente}
          className="w-full rounded-lg bg-accent px-4 py-2.5 font-medium text-accent-contrast transition hover:opacity-90 disabled:opacity-60"
        >
          {pendiente ? "Guardando…" : "Guardar"}
        </button>
      </form>

      <div className="mt-12 border-t border-border pt-8">
        <h2 className="font-display text-lg font-semibold">Borrar mi cuenta</h2>
        <p className="mt-1 text-sm leading-relaxed text-text-muted text-pretty">
          Se borra todo: tus prendas, tus fotos y tu cuenta. De verdad, no se archivan en ningún
          lado. Esto no se puede deshacer.
        </p>

        {!mostrarBorrado ? (
          <button
            onClick={() => setMostrarBorrado(true)}
            className="mt-4 text-sm text-red-600 underline underline-offset-4 dark:text-red-400"
          >
            Quiero borrar mi cuenta
          </button>
        ) : (
          <form
            className="mt-4 space-y-3"
            action={(formData) => {
              iniciar(async () => {
                const r = await borrarCuenta(formData);
                if (r?.error) setError(r.error);
              });
            }}
          >
            <Campo
              etiqueta="Escribe BORRAR para confirmar"
              name="confirmacion"
              placeholder="BORRAR"
              autoComplete="off"
              required
            />
            <button
              type="submit"
              disabled={pendiente}
              className="w-full rounded-lg border border-red-500/40 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-500/10 disabled:opacity-60 dark:text-red-400"
            >
              {pendiente ? "Borrando…" : "Borrar mi cuenta para siempre"}
            </button>
          </form>
        )}
      </div>
    </>
  );
}

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
        {guardado ? <Aviso tipo="info">Saved.</Aviso> : null}

        <Campo etiqueta="Your name" name="display_name" defaultValue={inicial.display_name} required />
        <Campo
          etiqueta="City"
          name="city"
          defaultValue={inicial.city}
          ayuda="So we know what weather you’ll have when we build your outfits."
        />

        <div className="grid grid-cols-3 gap-3">
          <Campo etiqueta="Top size" name="size_top" defaultValue={inicial.size_top} placeholder="M" />
          <Campo etiqueta="Bottom size" name="size_bottom" defaultValue={inicial.size_bottom} placeholder="28" />
          <Campo etiqueta="Shoe size" name="size_shoes" defaultValue={inicial.size_shoes} placeholder="24.5" />
        </div>

        <button
          type="submit"
          disabled={pendiente}
          className="w-full rounded-lg bg-accent px-4 py-2.5 font-medium text-accent-contrast transition hover:opacity-90 disabled:opacity-60"
        >
          {pendiente ? "Saving…" : "Save"}
        </button>
      </form>

      <div className="mt-12 border-t border-border pt-8">
        <h2 className="font-display text-lg font-semibold">Delete my account</h2>
        <p className="mt-1 text-sm leading-relaxed text-text-muted text-pretty">
          Everything is deleted: your garments, your photos and your account. Really, nothing is
          archived anywhere. This can’t be undone.
        </p>

        {!mostrarBorrado ? (
          <button
            onClick={() => setMostrarBorrado(true)}
            className="mt-4 text-sm text-red-600 underline underline-offset-4 dark:text-red-400"
          >
            I want to delete my account
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
              etiqueta="Type DELETE to confirm"
              name="confirmacion"
              placeholder="DELETE"
              autoComplete="off"
              required
            />
            <button
              type="submit"
              disabled={pendiente}
              className="w-full rounded-lg border border-red-500/40 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-500/10 disabled:opacity-60 dark:text-red-400"
            >
              {pendiente ? "Deleting…" : "Delete my account forever"}
            </button>
          </form>
        )}
      </div>
    </>
  );
}

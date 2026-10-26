"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { corregirPrenda, eliminarPrenda } from "../actions";
import { Aviso } from "@/components/ui/aviso";
import { Campo } from "@/components/ui/campo";
import { CATEGORIAS, NOMBRE_CATEGORIA } from "@/lib/closet/tipos";

export function FormularioPrenda({
  id,
  categoria,
  subcategoria,
}: {
  id: string;
  categoria: string;
  subcategoria: string;
}) {
  const [error, setError] = useState<string>();
  const [guardado, setGuardado] = useState(false);
  const [pendiente, iniciar] = useTransition();
  const router = useRouter();

  return (
    <div className="mt-10 border-t border-border pt-8">
      <h2 className="font-display text-lg font-semibold">Something wrong?</h2>
      <p className="mt-1 text-sm text-text-muted text-pretty">
        Fix it here. Every correction teaches ClosetAI what you call your things.
      </p>

      <form
        className="mt-5 space-y-4"
        action={(formData) => {
          setError(undefined);
          setGuardado(false);
          iniciar(async () => {
            const r = await corregirPrenda(formData);
            if (r.error) setError(r.error);
            else {
              setGuardado(true);
              router.refresh();
            }
          });
        }}
      >
        <input type="hidden" name="id" value={id} />
        {error ? <Aviso>{error}</Aviso> : null}
        {guardado ? <Aviso tipo="info">Saved.</Aviso> : null}

        <Campo etiqueta="Garment name" name="subcategory" defaultValue={subcategoria} required />

        <div className="space-y-1.5">
          <label htmlFor="category" className="block text-sm font-medium">
            Category
          </label>
          <select
            id="category"
            name="category"
            defaultValue={categoria}
            className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-base outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          >
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {NOMBRE_CATEGORIA[c]}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={pendiente}
          className="w-full rounded-lg bg-accent px-4 py-2.5 font-medium text-accent-contrast transition hover:opacity-90 disabled:opacity-60"
        >
          {pendiente ? "Saving…" : "Save changes"}
        </button>
      </form>

      <form
        className="mt-10 border-t border-border pt-6"
        action={(formData) => {
          if (!confirm("Delete this garment? Its photo is deleted too.")) return;
          iniciar(async () => {
            const r = await eliminarPrenda(formData);
            if (r.error) setError(r.error);
            else router.push("/closet");
          });
        }}
      >
        <input type="hidden" name="id" value={id} />
        <button
          type="submit"
          disabled={pendiente}
          className="text-sm text-red-600 underline underline-offset-4 disabled:opacity-60 dark:text-red-400"
        >
          Delete this garment
        </button>
      </form>
    </div>
  );
}

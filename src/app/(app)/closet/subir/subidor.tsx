"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { catalogarPrenda } from "../actions";
import { comprimirAWebp, nombreDeArchivo } from "@/lib/imagen";
import { createClient } from "@/lib/supabase/client";

type Estado = "comprimiendo" | "subiendo" | "catalogando" | "lista" | "fallida";

type Item = {
  id: string;
  nombreOriginal: string;
  estado: Estado;
  resultado?: string;
  error?: string;
};

const TEXTO: Record<Estado, string> = {
  comprimiendo: "Preparando la foto…",
  subiendo: "Subiendo…",
  catalogando: "La IA la está mirando…",
  lista: "Lista",
  fallida: "No se pudo",
};

export function Subidor({ userId }: { userId: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [enProceso, iniciar] = useTransition();
  const router = useRouter();

  function actualizar(id: string, cambios: Partial<Item>) {
    setItems((previos) => previos.map((i) => (i.id === id ? { ...i, ...cambios } : i)));
  }

  async function procesar(archivo: File, id: string) {
    const supabase = createClient();
    try {
      const webp = await comprimirAWebp(archivo);

      actualizar(id, { estado: "subiendo" });
      const ruta = `${userId}/${nombreDeArchivo()}`;
      const { error: errorSubida } = await supabase.storage
        .from("garments")
        .upload(ruta, webp, { contentType: "image/webp" });

      if (errorSubida) throw new Error("No se pudo subir la foto");

      actualizar(id, { estado: "catalogando" });
      const resultado = await catalogarPrenda(ruta);

      if (resultado.ok) {
        actualizar(id, { estado: "lista", resultado: resultado.subcategoria });
      } else {
        actualizar(id, { estado: "fallida", error: resultado.motivo });
      }
    } catch (error) {
      actualizar(id, {
        estado: "fallida",
        error: error instanceof Error ? error.message : "Algo salió mal",
      });
    }
  }

  function alElegir(event: React.ChangeEvent<HTMLInputElement>) {
    const archivos = Array.from(event.target.files ?? []);
    if (archivos.length === 0) return;

    const nuevos: Item[] = archivos.map((a) => ({
      id: crypto.randomUUID(),
      nombreOriginal: a.name,
      estado: "comprimiendo" as const,
    }));
    setItems((previos) => [...previos, ...nuevos]);
    event.target.value = "";

    iniciar(async () => {
      // De una en una a propósito: en paralelo se dispara el límite de peticiones
      // por minuto de Gemini y fallan varias de golpe.
      for (let i = 0; i < archivos.length; i++) {
        await procesar(archivos[i], nuevos[i].id);
      }
      router.refresh();
    });
  }

  const listas = items.filter((i) => i.estado === "lista").length;

  return (
    <div className="mt-8">
      <label className="block cursor-pointer rounded-xl border-2 border-dashed border-border bg-surface px-6 py-12 text-center transition hover:border-accent/60">
        <input
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={alElegir}
          disabled={enProceso}
        />
        <span className="font-display text-lg font-semibold">
          {enProceso ? "Trabajando…" : "Elegir fotos"}
        </span>
        <span className="mt-1 block text-sm text-text-muted">
          Puedes seleccionar varias a la vez
        </span>
      </label>

      {items.length > 0 ? (
        <ul className="mt-6 space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface px-4 py-3"
            >
              <span className="min-w-0 flex-1 truncate text-sm">
                {item.estado === "lista" ? (
                  <strong className="font-medium">{item.resultado}</strong>
                ) : (
                  <span className="text-text-muted">{item.nombreOriginal}</span>
                )}
              </span>
              <span
                className={`shrink-0 text-sm ${
                  item.estado === "lista"
                    ? "text-accent"
                    : item.estado === "fallida"
                      ? "text-red-600 dark:text-red-400"
                      : "text-text-muted"
                }`}
                title={item.error}
              >
                {item.estado === "lista" ? "✓ Lista" : TEXTO[item.estado]}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {items.some((i) => i.estado === "fallida") ? (
        <ul className="mt-3 space-y-1">
          {items
            .filter((i) => i.estado === "fallida")
            .map((i) => (
              <li key={i.id} className="text-sm text-text-muted">
                <span className="text-red-600 dark:text-red-400">{i.nombreOriginal}:</span>{" "}
                {i.error}
              </li>
            ))}
        </ul>
      ) : null}

      {listas > 0 && !enProceso ? (
        <Link
          href="/closet"
          className="mt-6 block rounded-lg bg-accent px-4 py-2.5 text-center text-base font-medium text-accent-contrast transition hover:opacity-90"
        >
          Ver mi clóset ({listas} {listas === 1 ? "prenda nueva" : "prendas nuevas"})
        </Link>
      ) : null}
    </div>
  );
}

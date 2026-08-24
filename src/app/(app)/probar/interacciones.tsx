"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { probar, registrarFotoBase } from "./actions";
import { Aviso } from "@/components/ui/aviso";
import { ALTO_MINIMO_CUERPO, altoOriginal, comprimirAWebp, nombreDeArchivo } from "@/lib/imagen";
import { createClient } from "@/lib/supabase/client";

export function SubirFotoBase({ userId, compacto }: { userId: string; compacto?: boolean }) {
  const [estado, setEstado] = useState<"listo" | "subiendo" | "revisando">("listo");
  const [error, setError] = useState<string>();
  /** No es un error: la foto se sube igual, pero conviene saberlo. */
  const [nota, setNota] = useState<string>();
  const [pendiente, iniciar] = useTransition();
  const router = useRouter();

  async function alElegir(event: React.ChangeEvent<HTMLInputElement>) {
    const archivo = event.target.files?.[0];
    event.target.value = "";
    if (!archivo) return;

    setError(undefined);
    setNota(undefined);
    setEstado("subiendo");

    try {
      // El render sale a la resolución de esta foto. Si entra chica, sale
      // blanda, y no hay nada que la app pueda hacer después para arreglarlo.
      // Vale más avisarlo antes de gastar un crédito.
      if ((await altoOriginal(archivo)) < ALTO_MINIMO_CUERPO) {
        setNota(
          "Esta foto es de baja resolución, así que las pruebas van a salir algo borrosas. " +
            "Si puedes, tómala directo con la cámara y súbela sin mandártela por WhatsApp — " +
            "esas apps la comprimen mucho.",
        );
      }

      const webp = await comprimirAWebp(archivo, "cuerpo");
      const ruta = `${userId}/${nombreDeArchivo()}`;
      const supabase = createClient();

      const { error: errorSubida } = await supabase.storage
        .from("avatars")
        .upload(ruta, webp, { contentType: "image/webp" });

      if (errorSubida) throw new Error("No se pudo subir la foto");

      setEstado("revisando");
      iniciar(async () => {
        const r = await registrarFotoBase(ruta);
        if (!r.ok) {
          setError(r.motivo);
          setEstado("listo");
        } else {
          router.refresh();
        }
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo salió mal");
      setEstado("listo");
    }
  }

  const ocupado = estado !== "listo" || pendiente;
  const texto =
    estado === "subiendo" ? "Subiendo…" : estado === "revisando" ? "Revisando tu foto…" : null;

  if (compacto) {
    return (
      <label className="mt-2 block cursor-pointer text-xs text-text-muted underline underline-offset-4 hover:text-text">
        <input type="file" accept="image/*" className="sr-only" onChange={alElegir} disabled={ocupado} />
        {texto ?? "Cambiar foto"}
        {error ? <span className="mt-1 block text-red-600 dark:text-red-400">{error}</span> : null}
        {nota ? <span className="mt-1 block not-italic text-text-muted">{nota}</span> : null}
      </label>
    );
  }

  return (
    <div className="mt-5">
      {error ? (
        <div className="mb-3">
          <Aviso>{error}</Aviso>
        </div>
      ) : null}
      {nota ? (
        <div className="mb-3">
          <Aviso>{nota}</Aviso>
        </div>
      ) : null}
      <label className="block cursor-pointer rounded-lg bg-accent px-5 py-3 text-center font-medium text-accent-contrast transition hover:opacity-90">
        <input type="file" accept="image/*" className="sr-only" onChange={alElegir} disabled={ocupado} />
        {texto ?? "Subir mi foto"}
      </label>
    </div>
  );
}

type PrendaProbable = { id: string; nombre: string; url: string | null };

export function ProbadorPrendas({
  prendas,
  creditos,
}: {
  prendas: PrendaProbable[];
  creditos: number;
}) {
  const [error, setError] = useState<string>();
  const [sinSaldo, setSinSaldo] = useState(false);
  const [probando, setProbando] = useState<string>();
  const [pendiente, iniciar] = useTransition();
  const router = useRouter();

  if (prendas.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border px-5 py-10 text-center">
        <p className="leading-relaxed text-text-muted text-pretty">
          No tienes prendas que se puedan probar todavía. Funciona con tops, pantalones y
          vestidos — no con zapatos ni accesorios.
        </p>
        <Link
          href="/closet/subir"
          className="mt-4 inline-block text-sm text-accent underline underline-offset-4"
        >
          Agregar prendas
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-display text-lg font-semibold">Elige qué probarte</h2>
      <p className="mt-1 text-sm text-text-muted">Cada prueba usa un crédito.</p>

      {sinSaldo ? (
        <div className="mt-4 rounded-lg border border-border bg-surface p-4">
          <p className="text-sm text-pretty">
            Te quedaste sin créditos. Con una recarga de $49 MXN tienes 20 pruebas más.
          </p>
          <Link
            href="/comprar"
            className="mt-3 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-contrast transition hover:opacity-90"
          >
            Recargar créditos
          </Link>
        </div>
      ) : error ? (
        <div className="mt-4">
          <Aviso>{error}</Aviso>
        </div>
      ) : null}

      <ul className="mt-4 grid grid-cols-3 gap-3">
        {prendas.map((prenda) => (
          <li key={prenda.id}>
            <button
              disabled={pendiente || creditos < 1}
              onClick={() =>
                iniciar(async () => {
                  setError(undefined);
                  setSinSaldo(false);
                  setProbando(prenda.id);
                  const r = await probar(prenda.id);
                  setProbando(undefined);
                  if (!r.ok) {
                    if (r.sinSaldo) setSinSaldo(true);
                    else setError(r.motivo);
                  } else {
                    router.refresh();
                  }
                })
              }
              className="group block w-full overflow-hidden rounded-lg border border-border bg-surface transition hover:border-accent/60 disabled:opacity-50"
            >
              <div className="relative aspect-square bg-surface-2">
                {prenda.url ? (
                  <Image
                    src={prenda.url}
                    alt={prenda.nombre}
                    fill
                    sizes="120px"
                    className="object-contain p-2"
                  />
                ) : null}
                {probando === prenda.id ? (
                  <span className="absolute inset-0 flex items-center justify-center bg-bg/80 text-xs font-medium">
                    Probando…
                  </span>
                ) : null}
              </div>
              <span className="block truncate px-2 py-1.5 text-xs">{prenda.nombre}</span>
            </button>
          </li>
        ))}
      </ul>

      {creditos < 1 ? (
        <p className="mt-4 text-sm text-text-muted">
          Necesitas créditos para probarte ropa.{" "}
          <Link href="/comprar" className="text-accent underline underline-offset-4">
            Ver opciones
          </Link>
        </p>
      ) : null}
    </div>
  );
}

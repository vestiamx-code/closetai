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
          "This photo is low resolution, so the try-ons will come out somewhat blurry. " +
            "If you can, take it straight with the camera and upload it without sending it to yourself on WhatsApp — " +
            "those apps compress it a lot.",
        );
      }

      const webp = await comprimirAWebp(archivo, "cuerpo");
      const ruta = `${userId}/${nombreDeArchivo()}`;
      const supabase = createClient();

      const { error: errorSubida } = await supabase.storage
        .from("avatars")
        .upload(ruta, webp, { contentType: "image/webp" });

      if (errorSubida) throw new Error("The photo could not be uploaded");

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
      setError(e instanceof Error ? e.message : "Something went wrong");
      setEstado("listo");
    }
  }

  const ocupado = estado !== "listo" || pendiente;
  const texto =
    estado === "subiendo" ? "Uploading…" : estado === "revisando" ? "Checking your photo…" : null;

  if (compacto) {
    return (
      <label className="mt-2 block cursor-pointer text-xs text-text-muted underline underline-offset-4 hover:text-text">
        <input type="file" accept="image/*" className="sr-only" onChange={alElegir} disabled={ocupado} />
        {texto ?? "Change photo"}
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
        {texto ?? "Upload my photo"}
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
          You don’t have garments that can be tried on yet. It works with tops, pants and
          dresses — not with shoes or accessories.
        </p>
        <Link
          href="/closet/add"
          className="mt-4 inline-block text-sm text-accent underline underline-offset-4"
        >
          Add garments
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-display text-lg font-semibold">Choose what to try on</h2>
      <p className="mt-1 text-sm text-text-muted">Each try-on uses one credit.</p>

      {sinSaldo ? (
        <div className="mt-4 rounded-lg border border-border bg-surface p-4">
          <p className="text-sm text-pretty">
            You’re out of credits. A MX$49 top-up gets you 20 more try-ons.
          </p>
          <Link
            href="/buy"
            className="mt-3 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-contrast transition hover:opacity-90"
          >
            Top up credits
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
                    Trying on…
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
          You need credits to try clothes on.{" "}
          <Link href="/buy" className="text-accent underline underline-offset-4">
            See options
          </Link>
        </p>
      ) : null}
    </div>
  );
}

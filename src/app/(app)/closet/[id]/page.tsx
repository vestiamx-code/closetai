import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { FormularioPrenda } from "./formulario";
import { requireUser } from "@/lib/auth";
import { firmarRutas } from "@/lib/closet/storage";
import {
  NOMBRE_ESTILO,
  NOMBRE_OCASION,
  NOMBRE_PATRON,
  NOMBRE_TEMPORADA,
  etiquetas,
  type Prenda,
} from "@/lib/closet/tipos";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Garment" };

export default async function PrendaPage({ params }: PageProps<"/closet/[id]">) {
  await requireUser();
  const { id } = await params;

  const supabase = await createClient();
  const { data } = await supabase.from("garments").select("*").eq("id", id).single();
  if (!data) notFound();

  const prenda = data as Prenda;
  const ruta = prenda.clean_image_path ?? prenda.image_path;
  const urls = await firmarRutas("garments", [ruta]);
  const confianza = Number(prenda.ai_meta?.confianza ?? 0);

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <Link href="/closet" className="text-sm text-text-muted underline underline-offset-4">
        ← Back to the closet
      </Link>

      <div className="mt-6 grid gap-8 sm:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-surface-2">
          {urls.get(ruta) ? (
            <Image
              src={urls.get(ruta)!}
              alt={prenda.subcategory ?? "Garment"}
              fill
              sizes="(max-width: 640px) 100vw, 50vw"
              className="object-contain p-6"
            />
          ) : null}
        </div>

        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            {prenda.subcategory ?? "Garment"}
          </h1>

          <dl className="mt-5 space-y-3 text-sm">
            <Dato titulo="Colors" valor={prenda.colors.join(", ")} />
            <Dato titulo="Pattern" valor={prenda.pattern ? (NOMBRE_PATRON[prenda.pattern] ?? prenda.pattern) : null} />
            <Dato titulo="Material" valor={prenda.material} />
            <Dato titulo="Styles" valor={etiquetas(prenda.styles, NOMBRE_ESTILO)} />
            <Dato titulo="Seasons" valor={etiquetas(prenda.seasons, NOMBRE_TEMPORADA)} />
            <Dato titulo="Occasions" valor={etiquetas(prenda.occasions, NOMBRE_OCASION)} />
          </dl>

          {prenda.styling_note ? (
            <p className="mt-5 rounded-lg border border-border bg-surface p-4 text-sm leading-relaxed text-pretty">
              {prenda.styling_note}
            </p>
          ) : null}

          {confianza > 0 && confianza < 0.7 ? (
            <p className="mt-4 text-xs text-text-muted">
              AI wasn’t very sure about this garment. If something is wrong, fix it below.
            </p>
          ) : null}
        </div>
      </div>

      <FormularioPrenda
        id={prenda.id}
        categoria={prenda.category ?? "otro"}
        subcategoria={prenda.subcategory ?? ""}
      />
    </div>
  );
}

function Dato({ titulo, valor }: { titulo: string; valor: string | null }) {
  if (!valor) return null;
  return (
    <div className="flex gap-3">
      <dt className="w-28 shrink-0 text-text-muted">{titulo}</dt>
      <dd className="flex-1">{valor}</dd>
    </div>
  );
}

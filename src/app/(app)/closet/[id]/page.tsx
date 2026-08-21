import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { FormularioPrenda } from "./formulario";
import { requireUser } from "@/lib/auth";
import { firmarRutas } from "@/lib/closet/storage";
import type { Prenda } from "@/lib/closet/tipos";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Prenda" };

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
        ← Volver al clóset
      </Link>

      <div className="mt-6 grid gap-8 sm:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-surface-2">
          {urls.get(ruta) ? (
            <Image
              src={urls.get(ruta)!}
              alt={prenda.subcategory ?? "Prenda"}
              fill
              sizes="(max-width: 640px) 100vw, 50vw"
              className="object-cover"
            />
          ) : null}
        </div>

        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            {prenda.subcategory ?? "Prenda"}
          </h1>

          <dl className="mt-5 space-y-3 text-sm">
            <Dato titulo="Colores" valor={prenda.colors.join(", ")} />
            <Dato titulo="Patrón" valor={prenda.pattern} />
            <Dato titulo="Material" valor={prenda.material} />
            <Dato titulo="Estilos" valor={prenda.styles.join(", ")} />
            <Dato titulo="Temporadas" valor={prenda.seasons.join(", ")} />
            <Dato titulo="Ocasiones" valor={prenda.occasions.join(", ")} />
          </dl>

          {prenda.styling_note ? (
            <p className="mt-5 rounded-lg border border-border bg-surface p-4 text-sm leading-relaxed text-pretty">
              {prenda.styling_note}
            </p>
          ) : null}

          {confianza > 0 && confianza < 0.7 ? (
            <p className="mt-4 text-xs text-text-muted">
              La IA no quedó muy segura con esta prenda. Si algo está mal, corrígelo abajo.
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

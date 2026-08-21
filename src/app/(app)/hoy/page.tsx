import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Acciones, BotonGenerar } from "./interacciones";
import { requireUser } from "@/lib/auth";
import { firmarRutas } from "@/lib/closet/storage";
import type { Prenda } from "@/lib/closet/tipos";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Qué me pongo hoy" };

type OutfitConPrendas = {
  id: string;
  title: string | null;
  explanation: string | null;
  weather: { ciudad: string; temperatura: number; descripcion: string } | null;
  prendas: Prenda[];
};

export default async function HoyPage() {
  await requireUser();
  const supabase = await createClient();

  const { data: outfits } = await supabase
    .from("outfits")
    .select("id, title, explanation, weather, outfit_items(garment_id, garments(*))")
    .eq("status", "suggested")
    .order("created_at", { ascending: false });

  const lista: OutfitConPrendas[] = (outfits ?? []).map((o) => ({
    id: o.id,
    title: o.title,
    explanation: o.explanation,
    weather: o.weather as OutfitConPrendas["weather"],
    prendas: (o.outfit_items ?? [])
      .map((i) => i.garments as unknown as Prenda)
      .filter(Boolean),
  }));

  const rutas = lista.flatMap((o) => o.prendas.map((p) => p.clean_image_path ?? p.image_path));
  const urls = await firmarRutas("garments", rutas);

  const { count } = await supabase
    .from("garments")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");

  const clima = lista[0]?.weather;

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      {clima ? (
        <p className="text-sm text-text-muted">
          {clima.ciudad} · {clima.temperatura}° · {clima.descripcion}
        </p>
      ) : null}

      <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        Qué me pongo hoy
      </h1>

      {lista.length === 0 ? (
        <SinOutfits prendas={count ?? 0} />
      ) : (
        <>
          <p className="mt-2 text-text-muted">
            {lista.length} {lista.length === 1 ? "propuesta" : "propuestas"} con lo que ya tienes.
          </p>

          <ul className="mt-8 space-y-8">
            {lista.map((outfit) => (
              <li
                key={outfit.id}
                className="overflow-hidden rounded-xl border border-border bg-surface"
              >
                <ul className="flex gap-px bg-border">
                  {outfit.prendas.map((prenda) => {
                    const ruta = prenda.clean_image_path ?? prenda.image_path;
                    return (
                      <li key={prenda.id} className="relative aspect-square flex-1 bg-surface-2">
                        {urls.get(ruta) ? (
                          <Image
                            src={urls.get(ruta)!}
                            alt={prenda.subcategory ?? "Prenda"}
                            fill
                            sizes="(max-width: 640px) 33vw, 200px"
                            className="object-cover"
                          />
                        ) : null}
                      </li>
                    );
                  })}
                </ul>

                <div className="p-5">
                  <h2 className="font-display text-xl font-semibold tracking-tight">
                    {outfit.title}
                  </h2>
                  <p className="mt-2 leading-relaxed text-text-muted text-pretty">
                    {outfit.explanation}
                  </p>
                  <p className="mt-3 text-xs text-text-muted">
                    {outfit.prendas.map((p) => p.subcategory).filter(Boolean).join(" · ")}
                  </p>

                  <Acciones outfitId={outfit.id} />
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-10 border-t border-border pt-8">
            <BotonGenerar texto="Proponme otros tres" />
          </div>
        </>
      )}
    </div>
  );
}

function SinOutfits({ prendas }: { prendas: number }) {
  if (prendas < 4) {
    return (
      <div className="mt-8 rounded-xl border border-dashed border-border px-6 py-14 text-center">
        <h2 className="font-display text-xl font-semibold">Falta un poco de clóset</h2>
        <p className="mx-auto mt-2 max-w-md leading-relaxed text-text-muted text-pretty">
          Llevas {prendas} {prendas === 1 ? "prenda" : "prendas"}. Con cuatro o más ya puedo
          armarte combinaciones que tengan sentido, no solo juntar ropa.
        </p>
        <Link
          href="/closet/subir"
          className="mt-6 inline-block rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-contrast transition hover:opacity-90"
        >
          Agregar más prendas
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <p className="leading-relaxed text-text-muted text-pretty">
        Tienes {prendas} prendas listas. Dame un momento y te armo tres outfits con el clima de
        hoy y lo que he aprendido de tu estilo.
      </p>
      <div className="mt-6">
        <BotonGenerar texto="Armar mis outfits de hoy" />
      </div>
    </div>
  );
}

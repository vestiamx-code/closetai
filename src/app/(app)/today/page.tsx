import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Acciones, BotonGenerar } from "./interacciones";
import { requireUser } from "@/lib/auth";
import { firmarRutas } from "@/lib/closet/storage";
import type { Prenda } from "@/lib/closet/tipos";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "What to wear today" };

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
        What to wear today
      </h1>

      {lista.length === 0 ? (
        <SinOutfits prendas={count ?? 0} />
      ) : (
        <>
          <p className="mt-2 text-text-muted">
            {lista.length} {lista.length === 1 ? "suggestion" : "suggestions"} from what you already own.
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
                            alt={prenda.subcategory ?? "Garment"}
                            fill
                            sizes="(max-width: 640px) 33vw, 200px"
                            className="object-contain p-2"
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
            <BotonGenerar texto="Suggest three more" />
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
        <h2 className="font-display text-xl font-semibold">Your closet needs a bit more</h2>
        <p className="mx-auto mt-2 max-w-md leading-relaxed text-text-muted text-pretty">
          You have {prendas} {prendas === 1 ? "garment" : "garments"}. With four or more I can put
          together outfits that make sense, not just throw clothes together.
        </p>
        <Link
          href="/closet/add"
          className="mt-6 inline-block rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-contrast transition hover:opacity-90"
        >
          Add more garments
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <p className="leading-relaxed text-text-muted text-pretty">
        You have {prendas} garments ready. Give me a moment and I’ll put together three outfits for
        today’s weather and what I’ve learned about your style.
      </p>
      <div className="mt-6">
        <BotonGenerar texto="Build today’s outfits" />
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { requireUser } from "@/lib/auth";
import { firmarRutas } from "@/lib/closet/storage";
import { NOMBRE_CATEGORIA, type Prenda } from "@/lib/closet/tipos";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "My closet" };

export default async function ClosetPage({ searchParams }: PageProps<"/closet">) {
  await requireUser();
  const params = await searchParams;
  const categoria = typeof params.categoria === "string" ? params.categoria : undefined;

  const supabase = await createClient();
  let consulta = supabase
    .from("garments")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (categoria) consulta = consulta.eq("category", categoria);

  const { data } = await consulta;
  const prendas = (data ?? []) as Prenda[];

  // The filters need the real categories, not the filtered ones.
  const { data: todas } = await supabase.from("garments").select("category").eq("status", "active");
  const categorias = [...new Set((todas ?? []).map((p) => p.category).filter(Boolean))] as string[];

  const urls = await firmarRutas(
    "garments",
    prendas.map((p) => p.clean_image_path ?? p.image_path),
  );

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            My closet
          </h1>
          <p className="mt-1 text-text-muted">
            {prendas.length === 0
              ? "Nothing here yet."
              : `${prendas.length} ${prendas.length === 1 ? "garment" : "garments"}`}
          </p>
        </div>
        <Link
          href="/closet/add"
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-contrast transition hover:opacity-90"
        >
          Add garments
        </Link>
      </div>

      {categorias.length > 1 ? (
        <div className="mt-8 flex flex-wrap gap-2">
          <Filtro activo={!categoria} href="/closet" texto="All" />
          {categorias.map((c) => (
            <Filtro
              key={c}
              activo={categoria === c}
              href={`/closet?categoria=${c}`}
              texto={NOMBRE_CATEGORIA[c] ?? c}
            />
          ))}
        </div>
      ) : null}

      {prendas.length === 0 ? (
        <ClosetVacio />
      ) : (
        <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {prendas.map((prenda) => (
            <li key={prenda.id}>
              <Link
                href={`/closet/${prenda.id}`}
                className="group block overflow-hidden rounded-xl border border-border bg-surface transition duration-300 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-[0_8px_24px_-12px_rgba(20,17,15,0.18)]"
              >
                {/*
                  The framing depends on how the garment was photographed, which
                  the catalog already records.

                  A garment on its own —laid flat or product shot— is contained
                  whole: cropping it to the square eats the sleeves. A worn garment
                  is framed on the torso: containing the full-body photo makes the
                  garment tiny and hard to tell apart. Everything used to use
                  `cover`, and it cut people's heads off.
                */}
                <div className="relative aspect-square overflow-hidden bg-surface-2">
                  {urls.get(prenda.clean_image_path ?? prenda.image_path) ? (
                    <Image
                      src={urls.get(prenda.clean_image_path ?? prenda.image_path)!}
                      alt={prenda.subcategory ?? "Garment"}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className={
                        esPuesta(prenda.ai_meta)
                          ? "object-cover object-[50%_18%] transition duration-300 group-hover:scale-[1.04]"
                          : "object-contain p-6 transition duration-300 group-hover:scale-[1.04]"
                      }
                    />
                  ) : null}
                </div>
                <div className="border-t border-border/60 px-3 py-2.5">
                  <p className="truncate text-sm font-medium first-letter:uppercase">
                    {prenda.subcategory ?? "Garment"}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-text-muted first-letter:uppercase">
                    {prenda.colors.join(" · ")}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Filtro({ activo, href, texto }: { activo: boolean; href: string; texto: string }) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
        activo
          ? "border-accent bg-accent text-accent-contrast"
          : "border-border text-text-muted hover:border-accent/50 hover:text-text"
      }`}
    >
      {texto}
    </Link>
  );
}

function ClosetVacio() {
  return (
    <div className="mt-10 rounded-xl border border-dashed border-border px-6 py-16 text-center">
      <h2 className="font-display text-xl font-semibold">Start with ten garments</h2>
      <p className="mx-auto mt-2 max-w-md leading-relaxed text-text-muted text-pretty">
        You don’t need to photograph your whole closet today. Ten garments are enough to
        put together outfits worth wearing.
      </p>
      <Link
        href="/closet/add"
        className="mt-6 inline-block rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-contrast transition hover:opacity-90"
      >
        Upload my first photos
      </Link>
    </div>
  );
}

/**
 * Does the photo show someone wearing the garment? The cataloger said so when
 * it looked at it. Older garments don't have the field; assume not.
 */
function esPuesta(meta: unknown): boolean {
  return (meta as { tipo_de_foto?: string } | null)?.tipo_de_foto === "puesta";
}

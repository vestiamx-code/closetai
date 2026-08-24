import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { requireUser } from "@/lib/auth";
import { firmarRutas } from "@/lib/closet/storage";
import { NOMBRE_CATEGORIA, type Prenda } from "@/lib/closet/tipos";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Mi clóset" };

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

  // Para los filtros necesitamos las categorías reales, no las filtradas.
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
            Mi clóset
          </h1>
          <p className="mt-1 text-text-muted">
            {prendas.length === 0
              ? "Todavía no hay nada aquí."
              : `${prendas.length} ${prendas.length === 1 ? "prenda" : "prendas"}`}
          </p>
        </div>
        <Link
          href="/closet/subir"
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-contrast transition hover:opacity-90"
        >
          Agregar prendas
        </Link>
      </div>

      {categorias.length > 1 ? (
        <div className="mt-8 flex flex-wrap gap-2">
          <Filtro activo={!categoria} href="/closet" texto="Todo" />
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
                  El encuadre depende de cómo esté fotografiada la prenda, dato
                  que ya trae el catálogo.

                  Una prenda sola —extendida o en catálogo— se contiene entera:
                  recortarla al cuadro le come las mangas. Una prenda puesta se
                  encuadra al torso: si se contiene la foto de cuerpo completo, la
                  prenda queda diminuta y no se distingue de las demás. Antes todo
                  usaba `cover` y a las personas les cortaba la cabeza.
                */}
                <div className="relative aspect-square overflow-hidden bg-surface-2">
                  {urls.get(prenda.clean_image_path ?? prenda.image_path) ? (
                    <Image
                      src={urls.get(prenda.clean_image_path ?? prenda.image_path)!}
                      alt={prenda.subcategory ?? "Prenda"}
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
                    {prenda.subcategory ?? "Prenda"}
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
      <h2 className="font-display text-xl font-semibold">Empieza con diez prendas</h2>
      <p className="mx-auto mt-2 max-w-md leading-relaxed text-text-muted text-pretty">
        No necesitas fotografiar todo tu clóset hoy. Con diez prendas ya se pueden armar
        combinaciones que valgan la pena.
      </p>
      <Link
        href="/closet/subir"
        className="mt-6 inline-block rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-contrast transition hover:opacity-90"
      >
        Subir mis primeras fotos
      </Link>
    </div>
  );
}

/**
 * ¿La foto muestra a alguien con la prenda puesta? Lo dijo el catalogador al
 * mirarla. Las prendas viejas no traen el dato; se asume que no.
 */
function esPuesta(meta: unknown): boolean {
  return (meta as { tipo_de_foto?: string } | null)?.tipo_de_foto === "puesta";
}

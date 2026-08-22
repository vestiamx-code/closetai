import type { Metadata } from "next";

import { BotonAnalizar } from "./interacciones";
import { requireUser } from "@/lib/auth";
import type { Hueco } from "@/lib/compras";
import { TIENDAS } from "@/lib/compras";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Qué te falta" };

export default async function RecomendacionesPage() {
  await requireUser();
  const supabase = await createClient();

  const { data: recs } = await supabase
    .from("shopping_recs")
    .select("id, gap, created_at")
    .order("created_at", { ascending: false });

  const huecos = (recs ?? []).map((r) => ({ id: r.id, ...(r.gap as Hueco) }));

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        Qué le falta a tu clóset
      </h1>
      <p className="mt-2 leading-relaxed text-text-muted text-pretty">
        Primero resuelvo con lo que ya tienes. Esto es lo que de verdad haría falta para
        desbloquear combinaciones nuevas — nada más.
      </p>

      {huecos.length === 0 ? (
        <div className="mt-8">
          <BotonAnalizar texto="Analizar mi clóset" />
        </div>
      ) : (
        <>
          <ul className="mt-8 space-y-5">
            {huecos.map((hueco) => (
              <li key={hueco.id} className="rounded-xl border border-border bg-surface p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-display text-lg font-semibold">{hueco.prenda}</h2>
                  {hueco.desbloquea > 0 ? (
                    <span className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
                      +{hueco.desbloquea} {hueco.desbloquea === 1 ? "outfit" : "outfits"}
                    </span>
                  ) : null}
                </div>

                <p className="mt-2 leading-relaxed text-text-muted text-pretty">{hueco.porque}</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {(Object.keys(TIENDAS) as Array<keyof typeof TIENDAS>).map((tienda) => (
                    <a
                      key={tienda}
                      href={`/go/${tienda}/${encodeURIComponent(hueco.busqueda)}?rec=${hueco.id}`}
                      target="_blank"
                      rel="noopener noreferrer nofollow sponsored"
                      className="rounded-lg border border-border px-3.5 py-2 text-sm transition hover:border-accent/50"
                    >
                      Buscar en {TIENDAS[tienda].nombre}
                    </a>
                  ))}
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <BotonAnalizar texto="Volver a analizar" />
          </div>
        </>
      )}

      <p className="mt-10 border-t border-border pt-6 text-xs text-text-muted text-pretty">
        ClosetAI puede ganar una comisión si compras por estos enlaces. Eso no cambia lo que te
        recomiendo: la relevancia va primero y el afiliado solo desempata.
      </p>
    </div>
  );
}

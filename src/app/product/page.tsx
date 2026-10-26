import type { Metadata } from "next";
import Link from "next/link";

import { pesos } from "@/lib/precios";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Product · ClosetAI",
  description:
    "What ClosetAI does, feature by feature: what is already live, what was built this week and what does not exist yet.",
};

// Read from the database on every visit, like /research and /pricing. With a
// 5-minute cache, the first render froze from the previous deployment —when the
// tables did not exist yet— and the page kept showing the error notice even
// though the data was there. A map that lies because of a cache is no use.
export const dynamic = "force-dynamic";

type Plan = { id: string; nombre: string; precio_mxn: number; cobro: string; resumen: string };

type Funcion = {
  id: string;
  nombre: string;
  descripcion: string;
  grupo: "closet" | "estilista" | "probador" | "compras" | "publico";
  plan_id: string;
  estado: "vivo" | "esta_semana" | "planeado";
  ruta: string | null;
};

const GRUPOS: { id: Funcion["grupo"]; titulo: string; bajada: string }[] = [
  { id: "closet", titulo: "Your closet", bajada: "Turning clothes into data without it becoming a chore." },
  { id: "estilista", titulo: "The stylist", bajada: "Deciding what to wear from what you already own." },
  { id: "probador", titulo: "The fitting room", bajada: "Seeing clothes on you before taking them out of the closet." },
  { id: "compras", titulo: "Shopping smarter", bajada: "What you really need, and where to find it in Mexico." },
  { id: "publico", titulo: "No account needed", bajada: "What anyone can see and try without signing up." },
];

const ESTADOS: Record<Funcion["estado"], { texto: string; clase: string }> = {
  vivo: { texto: "live", clase: "border-border" },
  esta_semana: { texto: "this week", clase: "border-border" },
  planeado: { texto: "doesn't exist yet", clase: "border-border opacity-70" },
};

/**
 * `/product` — Week 3.
 *
 * The feature map: what ClosetAI does, which plan each thing belongs to and —what
 * is almost never published— which ones do not exist yet. The status comes from
 * the database, not from a promise: a feature marked "live" can be opened and used.
 */
export default async function Producto() {
  const admin = createAdminClient();

  const [planesR, funcionesR] = await Promise.all([
    admin.from("pricing_plans").select("id, nombre, precio_mxn, cobro, resumen").order("orden"),
    admin.from("pricing_features").select("*").order("orden"),
  ]);

  if (planesR.error || funcionesR.error) {
    console.error("[product] could not read the data", planesR.error ?? funcionesR.error);
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-20">
        <h1 className="font-display text-3xl font-semibold">Product</h1>
        <p className="mt-4 text-text-muted">The product map is not available right now.</p>
      </main>
    );
  }

  const planes = (planesR.data ?? []) as Plan[];
  const funciones = (funcionesR.data ?? []) as Funcion[];
  const nombrePlan = (id: string) => planes.find((p) => p.id === id)?.nombre ?? id;
  const vivas = funciones.filter((f) => f.estado === "vivo").length;
  const estaSemana = funciones.filter((f) => f.estado === "esta_semana").length;
  const planeadas = funciones.filter((f) => f.estado === "planeado").length;

  return (
    <main className="flex-1">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <Link href="/" className="font-display text-xl font-semibold tracking-tight">
          ClosetAI
        </Link>
        <Link
          href="/pricing"
          className="rounded-full border border-border px-5 py-2 text-sm transition hover:border-text"
        >
          See pricing and the simulator
        </Link>
      </header>

      <div className="mx-auto w-full max-w-5xl px-6 pb-24">
        <p className="text-xs tracking-[0.2em] text-text-muted uppercase">Product</p>
        <h1 className="mt-4 max-w-3xl font-display text-[clamp(2.25rem,6vw,3.75rem)] leading-[0.98] font-semibold tracking-[-0.03em] text-balance">
          What ClosetAI does,{" "}
          <span className="italic" style={{ color: "var(--barro)" }}>
            feature by feature.
          </span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-text-muted text-pretty">
          And which ones don&apos;t exist yet. {vivas} features are live —you can open them right now—,
          {" "}{estaSemana} were built this week and {planeadas} are planned. Nothing marked “live” is a
          promise: it is a link that works.
        </p>

        {/* ------------------------------------------------------------ Planes */}
        <section aria-label="The plans" className="mt-12 grid gap-4 md:grid-cols-3">
          {planes.map((p) => (
            <div key={p.id} className="rounded-xl border border-border bg-surface p-5">
              <p className="font-display text-lg font-semibold">{p.nombre}</p>
              <p className="mt-1 font-medium tabular-nums">
                {p.precio_mxn === 0 ? "$0" : pesos(p.precio_mxn)}
                {p.cobro === "unico"
                  ? " · one time"
                  : p.cobro === "recarga"
                    ? " · per top-up"
                    : " · forever"}
              </p>
              <p className="mt-2 text-sm text-text-muted">{p.resumen}</p>
            </div>
          ))}
        </section>

        {/* ------------------------------------------------------------ Mapa */}
        <section
          id="mapa"
          data-testid="mapa-funciones"
          aria-labelledby="mapa-titulo"
          className="mt-20 border-t border-border pt-10"
        >
          <h2 id="mapa-titulo" className="font-display text-3xl font-semibold tracking-tight">
            The map
          </h2>
          <p className="mt-2 max-w-2xl text-text-muted">
            Each feature says which plan it belongs to and what state it is in.
          </p>

          <div className="mt-8 space-y-12">
            {GRUPOS.map((g) => {
              const delGrupo = funciones.filter((f) => f.grupo === g.id);
              if (delGrupo.length === 0) return null;
              return (
                <div key={g.id}>
                  <h3 className="font-display text-xl font-semibold">{g.titulo}</h3>
                  <p className="mt-1 text-sm text-text-muted">{g.bajada}</p>
                  <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {delGrupo.map((f) => (
                      <li
                        key={f.id}
                        data-funcion={f.id}
                        data-estado={f.estado}
                        className={`flex flex-col rounded-xl border bg-surface p-5 ${ESTADOS[f.estado].clase}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-medium">{f.nombre}</p>
                          <span className="shrink-0 rounded-full border border-border px-2.5 py-0.5 text-xs text-text-muted">
                            {ESTADOS[f.estado].texto}
                          </span>
                        </div>
                        <p className="mt-2 flex-1 text-sm leading-relaxed">{f.descripcion}</p>
                        <p className="mt-4 border-t border-border pt-3 text-sm text-text-muted">
                          {nombrePlan(f.plan_id)}
                          {f.ruta ? (
                            <>
                              {" · "}
                              <Link href={f.ruta} className="underline underline-offset-4 hover:text-text">
                                {f.ruta}
                              </Link>
                            </>
                          ) : null}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-20 border-t border-border pt-10">
          <h2 className="font-display text-3xl font-semibold tracking-tight">What each plan costs</h2>
          <p className="mt-2 max-w-2xl text-text-muted">
            The prices, what they cost us to run and a simulator to move the assumptions are in{" "}
            <Link href="/pricing" className="underline underline-offset-4 hover:text-text">
              /pricing
            </Link>
            .
          </p>
        </section>
      </div>
    </main>
  );
}

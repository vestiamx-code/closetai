import type { Metadata } from "next";
import Link from "next/link";

import { pesos } from "@/lib/precios";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Producto · ClosetAI",
  description:
    "Qué hace ClosetAI, función por función: lo que ya está en vivo, lo que se construyó esta semana y lo que todavía no existe.",
};

// Se leyó de la base en cada visita, como /research y /pricing. Con caché de 5
// minutos, el primer render quedó congelado del despliegue anterior —cuando las
// tablas todavía no existían— y la página siguió mostrando el aviso de error
// aunque los datos ya estaban. Un mapa que miente por caché no sirve.
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
  { id: "closet", titulo: "Tu clóset", bajada: "Convertir ropa en datos sin que sea un trabajo." },
  { id: "estilista", titulo: "El estilista", bajada: "Decidir qué ponerte con lo que ya tienes." },
  { id: "probador", titulo: "El probador", bajada: "Verte la ropa puesta antes de sacarla del clóset." },
  { id: "compras", titulo: "Comprar mejor", bajada: "Qué te falta de verdad, y dónde está en México." },
  { id: "publico", titulo: "Sin cuenta", bajada: "Lo que cualquiera puede ver y probar sin registrarse." },
];

const ESTADOS: Record<Funcion["estado"], { texto: string; clase: string }> = {
  vivo: { texto: "en vivo", clase: "border-border" },
  esta_semana: { texto: "esta semana", clase: "border-border" },
  planeado: { texto: "todavía no existe", clase: "border-border opacity-70" },
};

/**
 * `/product` — Semana 3.
 *
 * El mapa de funciones: qué hace ClosetAI, en qué plan entra cada cosa y —lo que
 * casi nunca se publica— cuáles no existen todavía. El estado sale de la base,
 * no de una promesa: una función marcada "en vivo" se puede abrir y usar.
 */
export default async function Producto() {
  const admin = createAdminClient();

  const [planesR, funcionesR] = await Promise.all([
    admin.from("pricing_plans").select("id, nombre, precio_mxn, cobro, resumen").order("orden"),
    admin.from("pricing_features").select("*").order("orden"),
  ]);

  if (planesR.error || funcionesR.error) {
    console.error("[product] no se pudieron leer los datos", planesR.error ?? funcionesR.error);
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-20">
        <h1 className="font-display text-3xl font-semibold">Producto</h1>
        <p className="mt-4 text-text-muted">El mapa del producto no está disponible en este momento.</p>
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
          Ver precios y simulador
        </Link>
      </header>

      <div className="mx-auto w-full max-w-5xl px-6 pb-24">
        <p className="text-xs tracking-[0.2em] text-text-muted uppercase">Producto</p>
        <h1 className="mt-4 max-w-3xl font-display text-[clamp(2.25rem,6vw,3.75rem)] leading-[0.98] font-semibold tracking-[-0.03em] text-balance">
          Qué hace ClosetAI,{" "}
          <span className="italic" style={{ color: "var(--barro)" }}>
            función por función.
          </span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-text-muted text-pretty">
          Y cuáles todavía no existen. {vivas} funciones están en vivo —las puedes abrir ahora mismo—,
          {" "}{estaSemana} se construyeron esta semana y {planeadas} están planeadas. Nada marcado
          «en vivo» es una promesa: es una liga que funciona.
        </p>

        {/* ------------------------------------------------------------ Planes */}
        <section aria-label="Los planes" className="mt-12 grid gap-4 md:grid-cols-3">
          {planes.map((p) => (
            <div key={p.id} className="rounded-xl border border-border bg-surface p-5">
              <p className="font-display text-lg font-semibold">{p.nombre}</p>
              <p className="mt-1 font-medium tabular-nums">
                {p.precio_mxn === 0 ? "Gratis" : pesos(p.precio_mxn)}
                {p.cobro === "unico" ? " · una sola vez" : p.cobro === "recarga" ? " · por recarga" : ""}
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
            El mapa
          </h2>
          <p className="mt-2 max-w-2xl text-text-muted">
            Cada función dice en qué plan entra y en qué estado está.
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
          <h2 className="font-display text-3xl font-semibold tracking-tight">Lo que cuesta cada plan</h2>
          <p className="mt-2 max-w-2xl text-text-muted">
            Los precios, lo que nos cuesta servirlos y un simulador para mover los supuestos están en{" "}
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

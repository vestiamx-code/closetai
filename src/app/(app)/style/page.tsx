import type { Metadata } from "next";
import Link from "next/link";

import { BotonCorregir } from "./interacciones";
import { requireUser } from "@/lib/auth";
import { PERFIL_VACIO, styleProfileSchema, type StyleProfile } from "@/lib/ai/outfits";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Your style" };

const SECCIONES = [
  { clave: "estilos_preferidos", titulo: "Styles you like" },
  { clave: "colores_favoritos", titulo: "Colors that suit you" },
  { clave: "combinaciones_exitosas", titulo: "Combinations that work" },
  { clave: "ocasiones_frecuentes", titulo: "What you dress for most" },
  { clave: "estilos_rechazados", titulo: "Styles you avoid" },
  { clave: "colores_vetados", titulo: "Colors I won’t suggest" },
] as const;

export default async function EstiloPage() {
  await requireUser();
  const supabase = await createClient();

  const [{ data: fila }, { count: eventos }] = await Promise.all([
    supabase.from("style_profiles").select("profile, version, updated_at").single(),
    supabase.from("feedback_events").select("id", { count: "exact", head: true }),
  ]);

  const validado = styleProfileSchema.safeParse(fila?.profile ?? {});
  const perfil: StyleProfile = validado.success ? validado.data : PERFIL_VACIO;
  const tieneAlgo = SECCIONES.some((s) => perfil[s.clave].length > 0);

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Your style</h1>
      <p className="mt-2 leading-relaxed text-text-muted text-pretty">
        This is what ClosetAI has learned about you. It all comes from what you accept and reject —
        you didn’t write any of it, and you can correct all of it.
      </p>

      {!tieneAlgo ? (
        <div className="mt-8 rounded-xl border border-dashed border-border px-6 py-12 text-center">
          <h2 className="font-display text-lg font-semibold">I don’t know you yet</h2>
          <p className="mx-auto mt-2 max-w-md leading-relaxed text-text-muted text-pretty">
            {eventos && eventos > 0
              ? `You have ${eventos} ${eventos === 1 ? "reaction" : "reactions"}. With a few more I start to notice patterns.`
              : "Accept or reject a few outfits and I’ll start to understand what you like."}
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/today"
              className="inline-block rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-contrast transition hover:opacity-90"
            >
              See today’s outfits
            </Link>
            {/*
              Waiting for five reactions is the slow route. Anyone who doesn't want
              to wait can describe their style and get a core in a minute — that
              is exactly what /core is for.
            */}
            <Link
              href="/core"
              className="inline-block rounded-lg border border-border px-5 py-2.5 text-sm transition hover:border-text"
            >
              Or tell me yourself in a minute
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-8 space-y-8">
            {SECCIONES.map((seccion) =>
              perfil[seccion.clave].length === 0 ? null : (
                <section key={seccion.clave}>
                  <h2 className="font-display text-lg font-semibold">{seccion.titulo}</h2>
                  <ul className="mt-3 space-y-2">
                    {perfil[seccion.clave].map((inferencia) => (
                      <li
                        key={inferencia.valor}
                        className="rounded-lg border border-border bg-surface px-4 py-3"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium">{inferencia.valor}</p>
                            <p className="mt-0.5 text-sm text-text-muted text-pretty">
                              {inferencia.evidencia}
                            </p>
                          </div>
                          <BotonCorregir lista={seccion.clave} valor={inferencia.valor} />
                        </div>
                        <Confianza valor={inferencia.confianza} />
                      </li>
                    ))}
                  </ul>
                </section>
              ),
            )}
          </div>

          {perfil.notas_libres ? (
            <section className="mt-8">
              <h2 className="font-display text-lg font-semibold">Other things I noticed</h2>
              <p className="mt-2 leading-relaxed text-text-muted text-pretty">
                {perfil.notas_libres}
              </p>
            </section>
          ) : null}

          <p className="mt-10 border-t border-border pt-6 text-xs text-text-muted">
            Profile version {fila?.version ?? 0} · updates itself as you react
          </p>
        </>
      )}
    </div>
  );
}

function Confianza({ valor }: { valor: number }) {
  const pct = Math.round(valor * 100);
  return (
    <div className="mt-2.5 flex items-center gap-2">
      <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
      </div>
      <span className="shrink-0 text-xs text-text-muted">{pct}% sure</span>
    </div>
  );
}

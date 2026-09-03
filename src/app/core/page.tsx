import type { Metadata } from "next";
import Link from "next/link";

import { styleCoreSchema, type StyleCore } from "@/lib/ai/schemas";
import { createAdminClient } from "@/lib/supabase/admin";

import { Nucleo } from "./interacciones";

export const metadata: Metadata = {
  title: "Tu núcleo de estilo",
  description:
    "Escribe en tus palabras cómo te gusta vestirte y ClosetAI destila tu núcleo de estilo. Sin cuenta y sin subir una sola foto.",
};

// La lista de guardados tiene que reflejar lo que se acaba de guardar.
export const dynamic = "force-dynamic";

/**
 * `/core` — Semana 1.
 *
 * Convierte el Apéndice A3 del Documento Maestro (cómo ClosetAI deduce el estilo
 * de alguien) en un módulo generativo público.
 *
 * Está fuera del grupo `(app)` a propósito: ese layout exige sesión, y el punto
 * entero de esta página es dar algo útil antes de pedir registro. Es la respuesta
 * a la objeción más fuerte que recibió la propuesta de valor — que el trabajo va
 * antes del beneficio.
 */
export default async function Core() {
  const admin = createAdminClient();

  // `entrada` NO se selecciona: el texto que alguien escribe sobre sí misma es
  // suyo. La lista pública muestra el núcleo generado, nunca lo que confesó.
  const { data: filas } = await admin
    .from("core_outputs")
    .select("id, nucleo, created_at")
    .order("created_at", { ascending: false })
    .limit(12);

  const guardados = (filas ?? [])
    .map((f) => ({ id: f.id, creado: f.created_at, parseado: styleCoreSchema.safeParse(f.nucleo) }))
    .filter((f) => f.parseado.success)
    .map((f) => ({ id: f.id, creado: f.creado, core: f.parseado.data as StyleCore }));

  return (
    <main className="flex-1">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-6">
        <Link href="/" className="font-display text-xl font-semibold tracking-tight">
          ClosetAI
        </Link>
        <Link
          href="/registro"
          className="rounded-full border border-border px-5 py-2 text-sm transition hover:border-text"
        >
          Crear cuenta
        </Link>
      </header>

      <section className="mx-auto w-full max-w-3xl px-6 pb-20">
        <p className="text-xs tracking-[0.2em] text-text-muted uppercase">Núcleo de estilo</p>
        <h1 className="mt-4 font-display text-[clamp(2.25rem,7vw,4rem)] leading-[0.95] font-semibold tracking-[-0.03em] text-balance">
          Antes de fotografiar
          <br />
          <span className="italic" style={{ color: "var(--barro)" }}>
            una sola prenda.
          </span>
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-text-muted text-pretty">
          Cuéntame cómo te gusta vestirte y destilo tu núcleo de estilo: tus principios,
          tu paleta, tus siluetas y una regla tuya. Sin cuenta, sin subir fotos, en menos
          de un minuto.
        </p>

        <Nucleo guardados={guardados.length} />

        {guardados.length > 0 ? (
          <section className="mt-20 border-t border-border pt-10">
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              Núcleos que ya se generaron
            </h2>
            <p className="mt-2 text-sm text-text-muted">
              Solo se muestra el núcleo. Lo que cada persona escribió sobre sí misma no se
              publica nunca.
            </p>

            <ul className="mt-8 grid gap-4 sm:grid-cols-2">
              {guardados.map((g) => (
                <li key={g.id} className="rounded-xl border border-border bg-surface p-5">
                  <p className="font-display leading-snug font-medium text-pretty">
                    {g.core.esencia}
                  </p>
                  {g.core.paleta.length > 0 ? (
                    <p className="mt-3 text-sm text-text-muted first-letter:uppercase">
                      {g.core.paleta.join(" · ")}
                    </p>
                  ) : null}
                  <p className="mt-3 text-xs text-text-muted italic">“{g.core.regla}”</p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <p className="mt-16 border-t border-border pt-6 text-sm text-text-muted">
          ¿Te sonó a ti?{" "}
          <Link href="/registro" className="underline underline-offset-4 transition hover:text-text">
            Arma tu clóset gratis
          </Link>{" "}
          y el estilista empieza con esto ya sabido.
        </p>
      </section>
    </main>
  );
}

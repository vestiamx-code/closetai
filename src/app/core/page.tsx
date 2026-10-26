import type { Metadata } from "next";
import Link from "next/link";

import { styleCoreSchema, type StyleCore } from "@/lib/ai/schemas";
import { EN_INGLES_DESDE } from "@/lib/marketing";
import { createAdminClient } from "@/lib/supabase/admin";

import { Nucleo } from "./interacciones";

export const metadata: Metadata = {
  title: "Your style core",
  description:
    "Write in your own words how you like to dress and ClosetAI distills your style core. No account, and not a single photo.",
};

// The saved list has to reflect what was just saved.
export const dynamic = "force-dynamic";

/**
 * `/core` — Week 1.
 *
 * Turns Master Document Appendix A3 (how ClosetAI infers someone's style) into a
 * public generative module.
 *
 * It sits outside the `(app)` group on purpose: that layout requires a session,
 * and the whole point of this page is to give something useful before asking for
 * a sign-up. It answers the strongest objection the value proposition received —
 * that the work comes before the benefit.
 */
export default async function Core() {
  const admin = createAdminClient();

  // `entrada` is NOT selected: the text someone writes about themselves is theirs.
  // The public list shows the generated core, never what they shared.
  const { data: filas } = await admin
    .from("core_outputs")
    .select("id, nucleo, created_at")
    .gte("created_at", EN_INGLES_DESDE)
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
          href="/sign-up"
          className="rounded-full border border-border px-5 py-2 text-sm transition hover:border-text"
        >
          Create an account
        </Link>
      </header>

      <section className="mx-auto w-full max-w-3xl px-6 pb-20">
        <p className="text-xs tracking-[0.2em] text-text-muted uppercase">Style core</p>
        <h1 className="mt-4 font-display text-[clamp(2.25rem,7vw,4rem)] leading-[0.95] font-semibold tracking-[-0.03em] text-balance">
          Before you photograph
          <br />{" "}
          <span className="italic" style={{ color: "var(--barro)" }}>
            a single garment.
          </span>
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-text-muted text-pretty">
          Tell me how you like to dress and I&apos;ll distill your style core: your principles, your
          palette, your silhouettes and a rule of your own. No account, no photos, in under a minute.
        </p>

        <Nucleo guardados={guardados.length} />

        {guardados.length > 0 ? (
          <section className="mt-20 border-t border-border pt-10">
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              Cores already generated
            </h2>
            <p className="mt-2 text-sm text-text-muted">
              Only the core is shown. What each person wrote about themselves is never
              published.
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
          Sounds like you?{" "}
          <Link href="/sign-up" className="underline underline-offset-4 transition hover:text-text">
            Build your closet for free
          </Link>{" "}
          and the stylist starts out already knowing this.
        </p>
      </section>
    </main>
  );
}

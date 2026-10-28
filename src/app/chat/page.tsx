import type { Metadata } from "next";
import Link from "next/link";

import { testerDe } from "@/lib/chat";
import { createAdminClient } from "@/lib/supabase/admin";

import { Chat } from "./interacciones";

export const metadata: Metadata = {
  title: "What should I wear?",
  description:
    "Three questions and ClosetAI suggests an outfit for today, with the reason it works. No account needed.",
};

// The ratings and the testers' summaries have to reflect what just happened.
export const dynamic = "force-dynamic";

type Resumen = { tester: number; funciono: string; confuso: string; puntaje: number; created_at: string };

/**
 * `/chat` — Week 5.
 *
 * A guided "What should I wear?" assistant, outside the `(app)` group on
 * purpose: it is the one-minute version of ClosetAI, before any sign-up.
 *
 * Conversations are never read here. The page shows only the rating totals and
 * the summaries the external testers wrote to be shown. Automated test traffic
 * is left out of both.
 */
export default async function ChatPage({ searchParams }: PageProps<"/chat">) {
  const tester = testerDe((await searchParams).test);
  const admin = createAdminClient();

  const [calificacionesR, resumenesR] = await Promise.all([
    admin
      .from("chat_ratings")
      .select("rating, chat_messages!inner(chat_sessions!inner(es_prueba))")
      .eq("chat_messages.chat_sessions.es_prueba", false),
    admin
      .from("chat_test_summaries")
      .select("tester, funciono, confuso, puntaje, created_at, chat_sessions!inner(es_prueba)")
      .eq("chat_sessions.es_prueba", false)
      .order("tester"),
  ]);

  if (calificacionesR.error || resumenesR.error) {
    console.error("[chat] could not read the totals", calificacionesR.error ?? resumenesR.error);
  }
  const calificaciones = calificacionesR.data ?? [];
  const arriba = calificaciones.filter((c) => c.rating === 1).length;
  const abajo = calificaciones.filter((c) => c.rating === -1).length;
  // The latest summary per tester, in case someone saved theirs twice.
  const porTester = new Map<number, Resumen>();
  for (const r of (resumenesR.data ?? []) as Resumen[]) {
    const previo = porTester.get(r.tester);
    if (!previo || r.created_at > previo.created_at) porTester.set(r.tester, r);
  }
  const resumenes = [...porTester.values()].sort((a, b) => a.tester - b.tester);

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
        <p className="text-xs tracking-[0.2em] text-text-muted uppercase">
          {tester ? `Tester ${tester} · thank you for helping` : "Stylist chat"}
        </p>
        <h1 className="mt-4 font-display text-[clamp(2.25rem,7vw,4rem)] leading-[0.95] font-semibold tracking-[-0.03em] text-balance">
          What should{" "}
          <span className="italic" style={{ color: "var(--barro)" }}>
            I wear?
          </span>
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-text-muted text-pretty">
          Answer three questions and I’ll suggest an outfit for today, with the reason it works. No
          account and no photos. I only talk about clothes.
        </p>

        <Chat tester={tester} />

        <section aria-labelledby="calificaciones-titulo" className="mt-20 border-t border-border pt-10">
          <h2 id="calificaciones-titulo" className="font-display text-2xl font-semibold tracking-tight">
            How people rated the answers
          </h2>
          <div data-testid="totales" className="mt-6 grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-surface p-5">
              <p data-total="arriba" className="font-display text-3xl font-semibold tabular-nums">{arriba}</p>
              <p className="text-sm text-text-muted">👍 helpful</p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-5">
              <p data-total="abajo" className="font-display text-3xl font-semibold tabular-nums">{abajo}</p>
              <p className="text-sm text-text-muted">👎 not helpful</p>
            </div>
          </div>
          <p className="mt-3 text-sm text-text-muted">Totals only. Conversations are never shown publicly.</p>
        </section>

        <section aria-labelledby="pruebas-titulo" className="mt-16 border-t border-border pt-10">
          <h2 id="pruebas-titulo" className="font-display text-2xl font-semibold tracking-tight">
            Testing evidence · {resumenes.length} of 3 external testers
          </h2>
          <p className="mt-2 max-w-2xl text-text-muted">
            Three people outside the project tried the chat on their own phones and wrote this at the end,
            after agreeing that their conversation is saved without their name.
          </p>
          {resumenes.length === 0 ? (
            <p data-testid="sin-resumenes" className="mt-6 text-text-muted">
              No tester has finished yet.
            </p>
          ) : (
            <ul data-testid="resumenes" className="mt-6 space-y-4">
              {resumenes.map((r) => (
                <li key={r.tester} data-tester={r.tester} className="rounded-xl border border-border bg-surface p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">Tester {r.tester}</p>
                    <span className="rounded-full border border-border px-2.5 py-0.5 text-xs">score {r.puntaje}/5</span>
                  </div>
                  <p className="mt-3 text-sm">
                    <span className="text-text-muted">What worked: </span>
                    {r.funciono}
                  </p>
                  {r.confuso ? (
                    <p className="mt-2 text-sm">
                      <span className="text-text-muted">What was confusing: </span>
                      {r.confuso}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="mt-16 border-t border-border pt-6 text-sm text-text-muted">
          This week’s plan, written before the code, is in{" "}
          <a
            href="https://github.com/vestiamx-code/closetai/blob/main/docs/WEEK-5-PACKET.md"
            className="underline underline-offset-4 hover:text-text"
          >
            WEEK-5-PACKET.md
          </a>
          . Want it with your own clothes?{" "}
          <Link href="/sign-up" className="underline underline-offset-4 hover:text-text">
            Create your closet
          </Link>
          .
        </p>
      </section>
    </main>
  );
}

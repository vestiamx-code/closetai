import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Demo video · Week 2",
  description:
    "A 2:30 walkthrough of /research: ClosetAI's research with verified sources, the risk map and a real conversation.",
};

/** Video de la Semana 2, con su propio enlace estable, como el de cada semana. */
export default function DemoSemana2() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <Link href="/" className="text-sm text-text-muted transition hover:text-text">
        ClosetAI
      </Link>

      <h1 className="mt-8 font-display text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
        Week 2 · Is the problem real?
      </h1>
      <p className="mt-4 max-w-xl text-lg leading-relaxed text-text-muted text-pretty">
        A 2:30 walkthrough of <code className="text-text">/research</code> in production: every figure with its
        source, a question answered live and a real conversation.
      </p>

      <video
        controls
        preload="metadata"
        playsInline
        className="mt-8 w-full rounded-lg border border-border bg-black"
      >
        <source src="/semana-2-research.mp4" type="video/mp4" />
        Your browser can’t play this video.{" "}
        <a href="/semana-2-research.mp4" className="underline">
          Download the file
        </a>
        .
      </video>

      <h2 className="mt-12 font-display text-2xl font-semibold tracking-tight">What it shows</h2>
      <ul className="mt-4 space-y-2 text-text-muted">
        {[
          "The public /research page, no account",
          "The summary panel, computed from the database",
          "A live question and a report that only cites verified sources",
          "The 5 global benchmarks and the Mexico section",
          "The competitors and substitutes table, with filter and accent-insensitive search",
          "The risk map, each risk with its evidence",
          "The real validation conversation, anonymous and with consent",
          "What was discarded because it could not be verified, and the GitHub history",
        ].map((t) => (
          <li key={t} className="flex gap-3">
            <span aria-hidden className="text-text-muted">
              ·
            </span>
            <span>{t}</span>
          </li>
        ))}
      </ul>

      <p className="mt-10 text-sm text-text-muted">
        <Link href="/demo/week-1" className="underline underline-offset-4">
          Watch the Week 1 video
        </Link>{" "}
        ·{" "}
        <a href="/semana-2-research.mp4" download className="underline underline-offset-4">
          Download this video
        </a>
      </p>
    </main>
  );
}

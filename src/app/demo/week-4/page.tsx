import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Demo video · Week 4 · ClosetAI",
  description:
    "A walkthrough of the new homepage and /marketing: the A/B headline, the brand, the persona, the launch content and a generator that cannot invent figures.",
};

/** Video de la Semana 4, con su propio enlace estable, como el de cada semana. */
export default function DemoSemana4() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <Link href="/" className="text-sm text-text-muted transition hover:text-text">
        ClosetAI
      </Link>

      <h1 className="mt-8 font-display text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
        Week 4 · Say only what you can prove
      </h1>
      <p className="mt-4 max-w-xl text-lg leading-relaxed text-text-muted text-pretty">
        A walkthrough of the homepage and <code className="text-text">/marketing</code> in production: a
        headline measured with real visits, and marketing that only says what has been verified.
      </p>

      <video
        controls
        preload="metadata"
        playsInline
        className="mt-8 w-full rounded-lg border border-border bg-black"
      >
        <source src="/semana-4-marketing.mp4" type="video/mp4" />
        Your browser can’t play this video.{" "}
        <a href="/semana-4-marketing.mp4" className="underline">
          Download the file
        </a>
        .
      </video>

      <h2 className="mt-12 font-display text-2xl font-semibold tracking-tight">What it shows</h2>
      <ul className="mt-4 space-y-2 text-text-muted">
        {[
          "The two versions of the headline, each for a different visitor",
          "The homepage as an argument: problem, how it works, sourced data, price and privacy",
          "The brand, and Sofía, the persona, with every trait marked as data or hypothesis",
          "The live A/B results, with no winner until there is enough sample",
          "The 10 approved posts, copying one, the 3 scripts and the exportable calendar",
          "The generator writing a new post, saved as “not reviewed”",
          "The GitHub history",
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
        <Link href="/demo/week-3" className="underline underline-offset-4">
          Watch the Week 3 video
        </Link>{" "}
        ·{" "}
        <a href="/semana-4-marketing.mp4" download className="underline underline-offset-4">
          Download this video
        </a>
      </p>
    </main>
  );
}

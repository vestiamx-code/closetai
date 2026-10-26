import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Demo video · Week 3 · ClosetAI",
  description:
    "A 2:19 walkthrough of /product and /pricing: ClosetAI's feature map and the revenue simulator, with every assumption marked as verified or not.",
};

/** Video de la Semana 3, con su propio enlace estable, como el de cada semana. */
export default function DemoSemana3() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <Link href="/" className="text-sm text-text-muted transition hover:text-text">
        ClosetAI
      </Link>

      <h1 className="mt-8 font-display text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
        Week 3 · What does it cost, and what does it make?
      </h1>
      <p className="mt-4 max-w-xl text-lg leading-relaxed text-text-muted text-pretty">
        A 2:19 walkthrough of <code className="text-text">/product</code> and{" "}
        <code className="text-text">/pricing</code> in production: what ClosetAI does feature by feature, and
        a simulator where every assumption says where it came from.
      </p>

      <video
        controls
        preload="metadata"
        playsInline
        className="mt-8 w-full rounded-lg border border-border bg-black"
      >
        <source src="/semana-3-pricing.mp4" type="video/mp4" />
        Your browser can’t play this video.{" "}
        <a href="/semana-3-pricing.mp4" className="underline">
          Download the file
        </a>
        .
      </video>

      <h2 className="mt-12 font-display text-2xl font-semibold tracking-tight">What it shows</h2>
      <ul className="mt-4 space-y-2 text-text-muted">
        {[
          "The feature map: 12 live, 2 from this week and 2 that don't exist yet",
          "The three plans, each with what it costs us to run",
          "The simulator, with the two segments shown separately",
          "An assumption moved live, and the income changing with it",
          "The three scenarios compared: 1,449 · 3,217 · 6,958 pesos a month",
          "The assumptions table, where verified and assumed are never mixed",
          "Saving a scenario: what gets saved is what the server calculates",
          "The saved scenarios, public and without an account, and the GitHub history",
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
        <Link href="/demo/semana-2" className="underline underline-offset-4">
          Watch the Week 2 video
        </Link>{" "}
        ·{" "}
        <a href="/semana-3-pricing.mp4" download className="underline underline-offset-4">
          Download this video
        </a>
      </p>
    </main>
  );
}

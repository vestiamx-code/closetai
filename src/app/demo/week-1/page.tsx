import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Demo video · Week 1 · ClosetAI",
  description:
    "A 2:14 walkthrough of /core, the style core: a public generative module that works without an account and without uploading photos.",
};

/**
 * Video de la Semana 1, en página aparte del de la Semana 0 para que cada
 * entrega tenga su propio enlace estable.
 */
export default function DemoSemana1() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <Link href="/" className="text-sm text-text-muted transition hover:text-text">
        ClosetAI
      </Link>

      <h1 className="mt-8 font-display text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
        Week 1 · The style core
      </h1>
      <p className="mt-4 max-w-xl text-lg leading-relaxed text-text-muted text-pretty">
        A 2:14 walkthrough of <code className="text-text">/core</code> in production — no account, no
        photos uploaded and nothing simulated.
      </p>

      <video
        controls
        preload="metadata"
        playsInline
        className="mt-8 w-full rounded-lg border border-border bg-black"
      >
        <source src="/semana-1-core.mp4" type="video/mp4" />
        Your browser can’t play this video.{" "}
        <a href="/semana-1-core.mp4" className="underline">
          Download the file
        </a>
        .
      </video>

      <h2 className="mt-12 font-display text-2xl font-semibold tracking-tight">What it shows</h2>
      <ul className="mt-4 space-y-2 text-text-muted">
        {[
          "The problem: the app asked you to photograph ten garments before giving anything",
          "/core opening on its own domain, with no session",
          "A text written in everyday words, not fashion vocabulary",
          "The structured core: essence, principles, palette, silhouettes, what to avoid and a rule",
          "Saving, and the new row in Supabase's core_outputs table",
          "The public list, which shows the core but never what the person wrote",
          "The test that matters: with a vague text, the module admits it doesn't know",
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
        <Link href="/demo" className="underline underline-offset-4">
          Watch the Week 0 video
        </Link>{" "}
        ·{" "}
        <a href="/semana-1-core.mp4" download className="underline underline-offset-4">
          Download this video
        </a>
      </p>
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Demo video · ClosetAI",
  description:
    "A 2:33 walkthrough of ClosetAI running in production: an AI-cataloged closet, the stylist, the virtual try-on and payments.",
};

/**
 * Página pública del video demo, para poder entregar un enlace en vez de un
 * archivo. Vive en el dominio propio a propósito: no depende de una cuenta de
 * terceros que pueda caducar o cambiar de política.
 */
export default function Demo() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <Link href="/" className="text-sm text-text-muted transition hover:text-text">
        ClosetAI
      </Link>

      <h1 className="mt-8 font-display text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
        Demo video
      </h1>
      <p className="mt-4 max-w-xl text-lg leading-relaxed text-text-muted text-pretty">
        A 2:33 walkthrough of ClosetAI running in production — not on a local computer, and with
        nothing simulated.
      </p>

      <video
        controls
        preload="metadata"
        playsInline
        className="mt-8 w-full rounded-lg border border-border bg-black"
      >
        <source src="/demo.mp4" type="video/mp4" />
        Your browser can’t play this video.{" "}
        <a href="/demo.mp4" className="underline">
          Download the file
        </a>
        .
      </video>

      <h2 className="mt-12 font-display text-2xl font-semibold tracking-tight">What it shows</h2>
      <ul className="mt-4 space-y-2 text-text-muted">
        {[
          "The live site on its own domain, closetai.lat",
          "Protected private routes: without a session it sends you to sign in",
          "The closet, with every garment cataloged by AI from a single photo",
          "The stylist building three outfits from clothes that already exist, with its reasoning and the real weather",
          "Rejecting an outfit and having it recorded with a reason",
          "What it has learned about you — and saying it doesn't know you yet instead of making it up",
          "A virtual try-on on a real base photo",
          "A real Stripe payment with the credits added",
          "The public repository with its commit history and green CI",
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
        The narration is a synthesized voice in Mexican Spanish: this video is from Week 0, before the course
        moved to English.{" "}
        <a href="/demo.mp4" download className="underline underline-offset-4">
          Download the video
        </a>
      </p>
    </main>
  );
}

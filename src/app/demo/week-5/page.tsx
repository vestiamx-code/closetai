import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Demo video · Week 5",
  description:
    "A walkthrough of /chat: a guided stylist with a guardrail, a human checkpoint, ratings, and three external tests.",
};

/** The Week 5 video, with its own stable link, like every week's. */
export default function DemoSemana5() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <Link href="/" className="text-sm text-text-muted transition hover:text-text">
        ClosetAI
      </Link>

      <h1 className="mt-8 font-display text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
        Week 5 · A stylist anyone can ask
      </h1>
      <p className="mt-4 max-w-xl text-lg leading-relaxed text-text-muted text-pretty">
        A walkthrough of <code className="text-text">/chat</code> in production: what it answers, what it
        refuses, and who reviews it. Narrated by Tamara, 2:42.
      </p>

      <video
        controls
        preload="metadata"
        playsInline
        className="mt-8 w-full rounded-lg border border-border bg-black"
      >
        <source src="/week-5-chat.mp4" type="video/mp4" />
        Your browser can’t play this video.{" "}
        <a href="/week-5-chat.mp4" className="underline">
          Download the file
        </a>
        .
      </video>

      <h2 className="mt-12 font-display text-2xl font-semibold tracking-tight">What it shows</h2>
      <ul className="mt-4 space-y-2 text-text-muted">
        {[
          "The guided questions, starting with the section someone shops in",
          "An outfit with inspiration photos and links to real stores",
          "A rating and a follow-up question",
          "The guardrail: a diet question that never reaches the AI",
          "The human checkpoint in /admin, shown with screenshots",
          "The three external testers’ summaries",
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
        <Link href="/demo/week-4" className="underline underline-offset-4">
          Watch the Week 4 video
        </Link>{" "}
        ·{" "}
        <a href="/week-5-chat.mp4" download className="underline underline-offset-4">
          Download this video
        </a>
      </p>
    </main>
  );
}

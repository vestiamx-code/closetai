import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import Link from "next/link";

import { EXPERIMENTO, varianteDe, type Variante } from "@/lib/ab";

import { BotonEmpezar, Experimento } from "./experimento";

/**
 * Homepage — Week 4.
 *
 * The Week 0 version had good composition and little argument: a headline, four
 * capabilities and a promise. This one keeps the composition and orders the
 * argument top to bottom, the way someone who doesn't know ClosetAI would read
 * it: what it is → the problem → how it works → why believe it → what it costs →
 * what happens to their photos → get started.
 *
 * Two sentences from the previous version were removed because they could not be
 * defended: "within two weeks it stops suggesting what you hate" was never
 * measured, and "ten garments are enough to start" contradicts the Week 2
 * conversation, where the limit before getting tired was 40.
 *
 * The headline is an A/B experiment (`src/lib/ab.ts`). The variant is chosen
 * here, on the server, and not in `proxy.ts`: that is where the session lives,
 * and it already broke once in production after a small change.
 *
 * All motion lives in `globals.css` and switches off with `prefers-reduced-motion`.
 */

const TITULARES: Record<Variante, [string, string]> = {
  a: ["Your stylist,", "in your pocket."],
  b: ["You already have", "something to wear."],
};

const CORRIDO = ["t-shirts", "dresses", "jeans", "blazers", "sneakers", "coats", "skirts", "hoodies", "boots", "shirts"];

const PASOS = [
  { n: "01", titulo: "Photograph your clothes", cuerpo: "AI fills in the type, the colors and the season of every garment." },
  { n: "02", titulo: "Build your closet", cuerpo: "Everything on your phone, with the background removed." },
  { n: "03", titulo: "It tells you what to wear", cuerpo: "Outfits from what you already own, for the weather in your city." },
];

const DATOS = [
  { cifra: "77 M", texto: "people bought online in Mexico in 2025." },
  { cifra: "59%", texto: "of them buy clothes." },
  { cifra: "35%", texto: "were very satisfied with their online fashion purchase." },
];

const FOTOS = [
  "They live in a private space nobody else can enter.",
  "They are truly deleted when you remove them or delete your account.",
  "We don't sell your data, and there are no ads.",
];

export default async function Home() {
  const jar = await cookies();
  const guardado = jar.get("cai_visitante")?.value;
  const valido = Boolean(guardado && /^[0-9a-f-]{36}$/i.test(guardado));
  const visitante = valido ? guardado! : randomUUID();
  const variante = varianteDe(visitante, EXPERIMENTO);
  const [linea1, linea2] = TITULARES[variante];

  return (
    <main className="flex-1">
      <Experimento visitante={visitante} variante={variante} nuevo={!valido} />

      {/* ---------- 1 · Headline ---------- */}
      <section data-seccion="titular" className="relative flex min-h-[92svh] flex-col overflow-hidden bg-hueso">
        {/* Two very soft color blooms. They add depth without competing with the text. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 -right-32 h-[34rem] w-[34rem] rounded-full opacity-70 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--arena), transparent 68%)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-52 -left-40 h-[38rem] w-[38rem] rounded-full opacity-45 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--accent), transparent 70%)" }}
        />

        <header className="entra relative mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-7">
          <span className="font-display text-xl font-semibold tracking-tight">ClosetAI</span>
          <nav aria-label="Main" className="flex items-center gap-1 sm:gap-2">
            <Link href="/product" className="hidden rounded-full px-4 py-2 text-sm text-text-muted transition hover:text-text sm:inline">
              Product
            </Link>
            <Link href="/pricing" className="hidden rounded-full px-4 py-2 text-sm text-text-muted transition hover:text-text sm:inline">
              Pricing
            </Link>
            <Link
              href="/sign-in"
              className="rounded-full border border-border px-5 py-2 text-sm transition hover:border-text"
            >
              Sign in
            </Link>
          </nav>
        </header>

        <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 pb-16">
          <p
            className="entra text-[0.65rem] tracking-[0.18em] text-text-muted uppercase sm:text-xs sm:tracking-[0.22em]"
            style={{ animationDelay: "0.05s" }}
          >
            AI personal stylist{" "}
            {/* On small screens the separator breaks the line and leaves "Mexico" alone. */}
            <span className="hidden sm:inline">· Made in Mexico</span>
            <span className="mt-1 block sm:hidden">Made in Mexico</span>
          </p>

          {/* Scale is the argument. The headline has to own the screen. */}
          <h1
            data-variante={variante}
            className="mt-6 font-display text-[clamp(3rem,11vw,8.5rem)] leading-[0.88] font-semibold tracking-[-0.035em]"
          >
            <span className="entra block" style={{ animationDelay: "0.12s" }}>
              {linea1}
            </span>
            {/* The lines are blocks, so they look separate; but without this space the
                headline's text runs the words together for a screen reader and for a
                search engine. The previous homepage had the same bug. */}{" "}
            <span className="entra block italic" style={{ animationDelay: "0.24s", color: "var(--barro)" }}>
              {linea2}
            </span>
          </h1>

          <div aria-hidden className="linea-crece mt-9 h-px w-full" style={{ background: "var(--border)" }} />

          <div className="mt-9 flex flex-col gap-9 sm:flex-row sm:items-end sm:justify-between">
            <p
              className="entra max-w-md text-lg leading-relaxed text-text-muted text-pretty"
              style={{ animationDelay: "0.36s" }}
            >
              Photograph your clothes, ClosetAI sorts them for you, and every morning it tells you what to wear
              from what you already own.
            </p>

            <div
              className="entra flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center"
              style={{ animationDelay: "0.48s" }}
            >
              <BotonEmpezar
                visitante={visitante}
                variante={variante}
                className="inline-flex items-center justify-center rounded-full bg-text px-8 py-4 text-base font-medium text-bg transition hover:opacity-90"
              >
                Start for free
              </BotonEmpezar>
              <Link
                href="/core"
                className="inline-flex items-center justify-center px-2 py-4 text-base text-text-muted underline underline-offset-8 transition hover:text-text"
              >
                Try it without an account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Marquee ---------- */}
      <section
        aria-hidden
        className="marquesina overflow-hidden border-y py-5"
        style={{ background: "var(--tinta)", borderColor: "transparent" }}
      >
        <div className="flex w-max gap-10 whitespace-nowrap">
          {[...CORRIDO, ...CORRIDO].map((palabra, i) => (
            <span
              key={`${palabra}-${i}`}
              className="font-display text-2xl italic sm:text-3xl"
              style={{ color: "var(--hueso)", opacity: i % 2 ? 0.45 : 1 }}
            >
              {palabra}
            </span>
          ))}
        </div>
      </section>

      {/* ---------- 2 · The problem ---------- */}
      <section data-seccion="problema" className="mx-auto w-full max-w-6xl px-6 pt-24 sm:pt-32">
        <p className="text-xs tracking-[0.22em] text-text-muted uppercase">The problem</p>
        <h2 className="mt-5 max-w-3xl font-display text-4xl leading-tight font-semibold tracking-tight text-balance sm:text-6xl">
          Your closet is full and you keep wearing the same thing.
        </h2>
        <p className="mt-6 max-w-xl text-xl leading-relaxed text-text-muted text-pretty">
          You’re not short of clothes: you just can’t see them all at once.
        </p>
      </section>

      {/* ---------- 3 · How it works ---------- */}
      <section data-seccion="como-funciona" className="mx-auto w-full max-w-6xl px-6 py-24 sm:py-32">
        <h2 className="max-w-2xl font-display text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
          How it works
        </h2>
        <ol className="mt-12 grid gap-x-14 gap-y-12 sm:grid-cols-3">
          {PASOS.map((p) => (
            <li key={p.n} className="border-t border-border pt-6">
              <span className="font-display text-sm tracking-widest" style={{ color: "var(--barro)" }}>
                {p.n}
              </span>
              <h3 className="mt-3 font-display text-2xl font-semibold tracking-tight">{p.titulo}</h3>
              <p className="mt-3 leading-relaxed text-text-muted text-pretty">{p.cuerpo}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------- 4 · Proof: data with its source ---------- */}
      <section data-seccion="prueba" style={{ background: "var(--arena)" }}>
        <div className="mx-auto w-full max-w-6xl px-6 py-24 sm:py-28">
          <p className="text-xs tracking-[0.22em] text-text-muted uppercase">What the data says</p>
          <dl className="mt-10 grid gap-10 sm:grid-cols-3">
            {DATOS.map((d) => (
              <div key={d.cifra} className="border-t pt-6" style={{ borderColor: "var(--border)" }}>
                <dt className="font-display text-5xl font-semibold tracking-tight sm:text-6xl">{d.cifra}</dt>
                <dd className="mt-3 leading-relaxed text-pretty">{d.texto}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-12 max-w-2xl font-display text-2xl leading-snug tracking-tight text-balance sm:text-3xl">
            Buying isn’t the problem.{" "}
            <span className="italic" style={{ color: "var(--barro)" }}>
              Knowing what goes together is.
            </span>
          </p>
          <p className="mt-6 text-sm text-text-muted">
            Source: AMVO, and Milenio citing AMVO data.{" "}
            <Link href="/research" className="underline underline-offset-4 hover:text-text">
              Every figure links to its source in the research
            </Link>
            .
          </p>
        </div>
      </section>

      {/* ---------- 5 · Price ---------- */}
      <section data-seccion="precio" className="mx-auto w-full max-w-6xl px-6 py-24 sm:py-32">
        <p className="text-xs tracking-[0.22em] text-text-muted uppercase">Price</p>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-surface p-8">
            <p className="font-display text-5xl font-semibold tracking-tight">$0</p>
            <p className="mt-3 text-lg">Your closet, free forever.</p>
            <p className="mt-2 text-text-muted">We never charge you for work you’ve already done.</p>
          </div>
          <div className="rounded-2xl border-2 bg-surface p-8" style={{ borderColor: "var(--barro)" }}>
            <p className="font-display text-5xl font-semibold tracking-tight">MX$100</p>
            <p className="mt-3 text-lg">ClosetAI Complete, one time.</p>
            <p className="mt-2 text-text-muted">No monthly fee.</p>
          </div>
        </div>
        <p className="mt-6 text-sm text-text-muted">
          <Link href="/pricing" className="underline underline-offset-4 hover:text-text">
            See the full math
          </Link>{" "}
          · what each plan includes and what it costs us to run.
        </p>
      </section>

      {/* ---------- 6 · Privacy ---------- */}
      <section data-seccion="privacidad" style={{ background: "var(--tinta)", color: "var(--hueso)" }}>
        <div className="mx-auto w-full max-w-6xl px-6 py-24 sm:py-32">
          <p className="text-xs tracking-[0.22em] uppercase" style={{ opacity: 0.55 }}>
            Your photos are yours
          </p>
          <ul className="mt-12 space-y-8">
            {FOTOS.map((f) => (
              <li
                key={f}
                className="border-b pb-8 font-display text-2xl leading-snug tracking-tight text-balance sm:text-4xl"
                style={{ borderColor: "rgba(253,250,246,0.16)" }}
              >
                {f}
              </li>
            ))}
          </ul>
          <Link href="/privacy" className="mt-10 inline-block text-sm underline underline-offset-4" style={{ opacity: 0.7 }}>
            The full privacy notice
          </Link>
        </div>
      </section>

      {/* ---------- 7 · Get started ---------- */}
      <section data-seccion="empezar" className="mx-auto w-full max-w-6xl px-6 py-24 text-center sm:py-36">
        <h2 className="mx-auto max-w-3xl font-display text-[clamp(2.25rem,6vw,4.5rem)] leading-[1.02] font-semibold tracking-[-0.03em] text-balance">
          {/* It must not repeat either of the experiment's headlines: whoever sees
              variant A would read B's sentence down here, contaminating the comparison. */}
          Your clothes are already there.
          <br />{" "}
          <span className="italic" style={{ color: "var(--barro)" }}>
            You just have to see them.
          </span>
        </h2>
        <Link
          href="/sign-up"
          className="mt-12 inline-flex items-center justify-center rounded-full bg-text px-10 py-4.5 text-base font-medium text-bg transition hover:opacity-90"
        >
          Create my closet for free
        </Link>
        <p className="mt-5 text-sm text-text-muted">
          No card required. Not ready to upload photos?{" "}
          <Link href="/core" className="underline underline-offset-4 hover:text-text">
            Find your style core without an account
          </Link>
          .
        </p>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-8 text-sm text-text-muted sm:flex-row sm:items-center sm:justify-between">
          <span className="font-display text-base text-text">ClosetAI</span>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/product" className="underline-offset-4 hover:text-text hover:underline">Product</Link>
            <Link href="/pricing" className="underline-offset-4 hover:text-text hover:underline">Pricing</Link>
            <Link href="/research" className="underline-offset-4 hover:text-text hover:underline">Research</Link>
            <Link href="/marketing" className="underline-offset-4 hover:text-text hover:underline">Marketing</Link>
            <Link href="/privacy" className="underline-offset-4 hover:text-text hover:underline">Privacy notice</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}

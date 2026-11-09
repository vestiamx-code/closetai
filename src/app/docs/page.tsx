import type { Metadata } from "next";
import Link from "next/link";

import { SitioNav } from "@/components/sitio-nav";
import { precarga } from "@/lib/rutas";
import { AGENTES, PROMPTS } from "@/lib/agentes";
import { BITACORAS, enGitHub, REPO, SEMANAS } from "@/lib/bitacora";

export const metadata: Metadata = {
  title: "Docs",
  description:
    "How ClosetAI was built: every prompt its AI agents use in production, and the build log of six weeks.",
};

/**
 * /docs (Week 6): the prompt library and the build log.
 *
 * The prompts are imported from the files production sends to the model, so
 * this page can't drift from what actually runs.
 */
export default function Docs() {
  const lineas = PROMPTS.reduce((n, p) => n + p.texto.split("\n").length, 0);

  return (
    <main className="flex-1">
      <SitioNav />

      <div className="mx-auto w-full max-w-5xl px-6 pb-24">
        <p className="text-xs tracking-[0.2em] text-text-muted uppercase">Docs</p>
        <h1 className="mt-4 max-w-3xl font-display text-[clamp(2.25rem,6vw,3.75rem)] leading-[0.98] font-semibold tracking-[-0.03em] text-balance">
          How it was built.{" "}
          <span className="italic" style={{ color: "var(--barro)" }}>
            And what it tells the AI.
          </span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-text-muted text-pretty">
          ClosetAI runs {AGENTES.length} AI agents. Below are the {PROMPTS.length} prompts they use, exactly as
          production sends them ({lineas} lines in all), and the log of how the product was built, one week at a
          time. Everything here is also in the{" "}
          <a href={REPO} className="text-text underline underline-offset-4" target="_blank" rel="noopener noreferrer">
            public repository
          </a>
          .
        </p>

        <nav aria-label="On this page" className="mt-8 flex flex-wrap gap-2 text-sm">
          {[
            ["#prompts", "Prompt library"],
            ["#build-log", "Build log"],
            ["#logs", "Running logs"],
          ].map(([href, texto]) => (
            <a key={href} href={href} className="rounded-full border border-border px-4 py-1.5 transition hover:border-text">
              {texto}
            </a>
          ))}
        </nav>

        {/* ------------------------------------------------------- Prompt library */}
        <section id="prompts" aria-labelledby="t-prompts" className="mt-16 scroll-mt-6">
          <h2 id="t-prompts" className="font-display text-3xl font-semibold tracking-tight">
            Prompt library
          </h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-text-muted">
            One card per prompt. The version goes up each time the prompt changes; the guardrail is what stops the
            agent from doing harm or making things up, and it lives in code, not in the prompt’s good intentions.
          </p>

          <ul className="mt-8 grid gap-4 md:grid-cols-2" data-testid="prompts">
            {PROMPTS.map(({ agente, texto, version, archivo }) => (
              <li
                key={agente.id}
                data-prompt={agente.id}
                className="flex flex-col rounded-2xl border border-border bg-surface p-6"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-display text-xl font-semibold">{agente.nombre}</h3>
                  <span className="shrink-0 rounded-full border border-border px-2.5 py-0.5 text-xs tabular-nums">
                    v{version}
                  </span>
                </div>
                <p className="mt-1 text-sm text-text-muted">
                  {agente.semana} ·{" "}
                  <Link href={agente.ruta} prefetch={precarga(agente.ruta)} className="underline underline-offset-4 hover:text-text">
                    {agente.ruta}
                  </Link>{" "}
                  · {agente.modelo}
                </p>
                <dl className="mt-4 space-y-2 text-sm leading-relaxed">
                  <div>
                    <dt className="inline font-medium">In → out: </dt>
                    <dd className="inline text-text-muted">
                      {agente.entrada} → {agente.salida}
                    </dd>
                  </div>
                  <div>
                    <dt className="inline font-medium">Guardrail: </dt>
                    <dd className="inline text-text-muted">{agente.guardrail}</dd>
                  </div>
                </dl>
                <details className="group mt-4">
                  <summary className="cursor-pointer text-sm font-medium underline-offset-4 hover:underline">
                    Read the full prompt <span className="text-text-muted">({texto.split("\n").length} lines)</span>
                  </summary>
                  <pre className="mt-3 max-h-96 overflow-auto rounded-xl bg-bg p-4 text-xs leading-relaxed whitespace-pre-wrap">
                    {texto}
                  </pre>
                  <a
                    href={enGitHub(`src/lib/ai/prompts/${archivo}`)}
                    className="mt-2 inline-block text-xs text-text-muted underline underline-offset-4"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {archivo} on GitHub, with its history
                  </a>
                </details>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-text-muted">
            The try-on renderer is the one agent without a text prompt: it is an image model that takes a photo and a
            garment.
          </p>
        </section>

        {/* ------------------------------------------------------------ Build log */}
        <section id="build-log" aria-labelledby="t-build" className="mt-20 scroll-mt-6">
          <h2 id="t-build" className="font-display text-3xl font-semibold tracking-tight">
            Build log
          </h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-text-muted">
            Every week started with a written plan — problem, user, spec, architecture, tests — committed before
            the first line of code. The git history shows the order.
          </p>

          <ol className="mt-8 border-l border-border" data-testid="bitacora">
            {SEMANAS.map((s) => (
              <li key={s.semana} className="relative pb-10 pl-8 last:pb-0">
                <span
                  aria-hidden
                  className="absolute top-1.5 -left-[5px] h-2.5 w-2.5 rounded-full"
                  style={{ background: "var(--barro)" }}
                />
                <p className="text-xs tracking-[0.14em] text-text-muted uppercase">
                  {s.semana} · {s.fecha}
                </p>
                <h3 className="mt-1 font-display text-xl font-semibold">{s.titulo}</h3>
                <p className="mt-2 max-w-2xl leading-relaxed text-text-muted">{s.resumen}</p>
                <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  {s.rutas.map((r) => (
                    <Link key={r} href={r} prefetch={precarga(r)} className="underline underline-offset-4">
                      {r}
                    </Link>
                  ))}
                  <a href={enGitHub(s.plan)} className="text-text-muted underline underline-offset-4" target="_blank" rel="noopener noreferrer">
                    The plan
                  </a>
                  <Link href={s.demo} className="text-text-muted underline underline-offset-4">
                    The demo
                  </Link>
                </p>
              </li>
            ))}
          </ol>
        </section>

        {/* --------------------------------------------------------- Running logs */}
        <section id="logs" aria-labelledby="t-logs" className="mt-20 scroll-mt-6">
          <h2 id="t-logs" className="font-display text-3xl font-semibold tracking-tight">
            Running logs
          </h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-text-muted">
            Kept since the first week and never rewritten to look better: failed runs stay in.
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {BITACORAS.map((b) => (
              <li key={b.ruta}>
                <a
                  href={enGitHub(b.ruta)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block h-full rounded-2xl border border-border p-5 transition hover:border-text"
                >
                  <span className="font-medium">{b.titulo} ↗</span>
                  <span className="mt-1 block text-sm text-text-muted">{b.que}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}

"use client";

import { useState, useTransition } from "react";

import { guardarPruebaSitio } from "./actions";
import { PASOS } from "@/lib/demo";
import { LO_USARIA, type TesterSitio } from "@/lib/prueba-sitio";

/**
 * What testers 4 and 5 see at the top of /demo (Week 6): consent first, then
 * the walkthrough as a checklist (each step opens in a new tab, so this one
 * keeps their ticks), then the summary.
 */
export function PruebaSitio({ tester, vistaPrevia = false }: { tester: TesterSitio; vistaPrevia?: boolean }) {
  const [consentimiento, setConsentimiento] = useState(false);
  const [hechos, setHechos] = useState<string[]>([]);
  const [puntaje, setPuntaje] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);
  const [pendiente, iniciar] = useTransition();

  if (guardado) {
    return (
      <section data-testid="prueba-guardada" className="mt-10 rounded-3xl border border-border bg-surface p-6">
        <h2 className="font-display text-2xl font-semibold">
          {vistaPrevia ? "Preview sent" : `Thank you, tester ${tester}!`}
        </h2>
        <p className="mt-2 text-text-muted">
          {vistaPrevia
            ? "This is what a tester sees at the end. Your answers were saved as a test: they don’t count and aren’t shown."
            : "Your summary is saved and appears in the testing summary below. There’s nothing else to do."}
        </p>
      </section>
    );
  }

  const alternar = (id: string) =>
    setHechos((h) => (h.includes(id) ? h.filter((x) => x !== id) : [...h, id]));

  return (
    <section
      data-testid="prueba-sitio"
      aria-labelledby="t-prueba"
      className="mt-10 rounded-3xl border-2 bg-surface p-5 sm:p-7"
      style={{ borderColor: "var(--barro)" }}
    >
      <p className="text-xs tracking-[0.2em] text-text-muted uppercase">
        {vistaPrevia ? "Preview · saved as a test, never shown" : `Tester ${tester} of 5`}
      </p>
      <h2 id="t-prueba" className="mt-2 font-display text-2xl font-semibold tracking-tight">
        Thank you for testing ClosetAI
      </h2>
      <p className="mt-2 leading-relaxed text-text-muted">
        Try as many steps as you like on your own phone, tick the ones you did, and tell us honestly what worked
        and what didn’t. It takes about 10 minutes. Criticism helps more than compliments.
      </p>

      <label
        data-testid="consentimiento-sitio"
        className="mt-5 flex items-start gap-3 rounded-xl border border-border bg-bg p-4 text-sm"
      >
        <input
          type="checkbox"
          checked={consentimiento}
          onChange={(e) => setConsentimiento(e.target.checked)}
          className="mt-0.5 h-4 w-4"
        />
        <span>
          I agree that my summary is saved without my name, for Tamara’s university project, and shown on this
          page. If I create an account or use the chat, those follow the{" "}
          <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
            privacy notice
          </a>
          .
        </span>
      </label>

      <form
        className={`mt-6 space-y-6 transition ${consentimiento ? "" : "pointer-events-none opacity-45"}`}
        action={(fd) => {
          setError(null);
          fd.set("tester", String(tester));
          if (vistaPrevia) fd.set("vista_previa", "1");
          if (consentimiento) fd.set("consentimiento", "on");
          for (const id of hechos) fd.append("paginas", id);
          if (puntaje) fd.set("puntaje", String(puntaje));
          iniciar(async () => {
            const r = await guardarPruebaSitio(fd);
            if (r.ok) setGuardado(true);
            else setError(r.error);
          });
        }}
      >
        <fieldset>
          <legend className="text-sm font-medium">1. The steps — tick the ones you tried</legend>
          <ol className="mt-3 space-y-2">
            {PASOS.map((p, i) => (
              <li key={p.id} className="flex items-start gap-3 rounded-xl border border-border bg-bg p-3">
                <input
                  type="checkbox"
                  id={`paso-${p.id}`}
                  checked={hechos.includes(p.id)}
                  onChange={() => alternar(p.id)}
                  disabled={!consentimiento}
                  className="mt-1 h-4 w-4 shrink-0"
                />
                <div className="min-w-0 text-sm">
                  <label htmlFor={`paso-${p.id}`} className="font-medium">
                    {i + 1}. {p.titulo}
                  </label>
                  <p className="mt-0.5 text-text-muted">{p.hacer}</p>
                  <a
                    href={p.ruta}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block underline underline-offset-4"
                    tabIndex={consentimiento ? 0 : -1}
                  >
                    Open {p.ruta} ↗
                  </a>
                </div>
              </li>
            ))}
          </ol>
        </fieldset>

        <div>
          <label htmlFor="funciono-sitio" className="block text-sm font-medium">
            2. What worked, or what did you like?
          </label>
          <textarea
            id="funciono-sitio"
            name="funciono"
            required
            rows={3}
            maxLength={800}
            disabled={!consentimiento}
            className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 outline-none focus:border-text"
          />
        </div>
        <div>
          <label htmlFor="confuso-sitio" className="block text-sm font-medium">
            3. What was confusing, slow, broken or missing?
          </label>
          <textarea
            id="confuso-sitio"
            name="confuso"
            rows={3}
            maxLength={800}
            disabled={!consentimiento}
            className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 outline-none focus:border-text"
          />
        </div>

        <fieldset>
          <legend className="text-sm font-medium">4. From 1 to 5, how useful is ClosetAI for you?</legend>
          <div className="mt-2 flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={puntaje === n}
                disabled={!consentimiento}
                onClick={() => setPuntaje(n)}
                className={`h-10 w-10 rounded-full border text-sm ${
                  puntaje === n ? "border-text bg-text text-bg" : "border-border"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-medium">5. Would you use it to decide what to wear?</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {LO_USARIA.map((o) => (
              <label
                key={o.valor}
                className="flex cursor-pointer items-center gap-2 rounded-full border border-border px-4 py-2 text-sm has-[:checked]:border-text has-[:checked]:bg-text has-[:checked]:text-bg"
              >
                <input type="radio" name="lo_usaria" value={o.valor} disabled={!consentimiento} className="sr-only" />
                {o.texto}
              </label>
            ))}
          </div>
        </fieldset>

        {error ? (
          <p data-testid="error-prueba" className="text-sm text-red-700 dark:text-red-300">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={!consentimiento || pendiente || !puntaje}
          className="rounded-lg bg-text px-5 py-2.5 font-medium text-bg transition hover:opacity-90 disabled:opacity-50"
        >
          {pendiente ? "Saving…" : "Send my summary"}
        </button>
      </form>
    </section>
  );
}

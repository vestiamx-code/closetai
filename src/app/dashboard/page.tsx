import type { Metadata } from "next";
import Link from "next/link";

import { SitioNav } from "@/components/sitio-nav";
import { precarga } from "@/lib/rutas";
import { dolares } from "@/lib/tablero";
import { leerTablero, type Tablero } from "@/lib/tablero-datos";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "ClosetAI's real records, live from the database: what each module has done, what people said about it, and what the AI costs.",
};

// Every visit reads the database. A dashboard that shows yesterday's numbers
// because of a cache is the kind of thing this page exists to avoid.
export const dynamic = "force-dynamic";

const numero = (n: number) => n.toLocaleString("en-US");
const pct = (n: number | null) => (n === null ? "—" : `${n}%`);

function Cifra({ valor, texto, detalle, id }: { valor: string; texto: string; detalle?: string; id?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5" data-cifra={id}>
      <p className="font-display text-4xl font-semibold tabular-nums">{valor}</p>
      <p className="mt-1 text-sm font-medium">{texto}</p>
      {detalle ? <p className="mt-1 text-xs leading-relaxed text-text-muted">{detalle}</p> : null}
    </div>
  );
}

function Modulo({
  titulo,
  ruta,
  semana,
  children,
}: {
  titulo: string;
  ruta: string;
  semana: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-border p-6" aria-label={titulo}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-2xl font-semibold tracking-tight">{titulo}</h2>
        <p className="text-sm text-text-muted">
          {semana} ·{" "}
          <Link href={ruta} prefetch={precarga(ruta)} className="underline underline-offset-4 hover:text-text">
            {ruta}
          </Link>
        </p>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function SinDatos() {
  return (
    <main className="flex-1">
      <SitioNav />
      <div className="mx-auto w-full max-w-3xl px-6 py-20">
        <h1 className="font-display text-4xl font-semibold">Dashboard</h1>
        <p className="mt-4 text-text-muted" data-testid="error-tablero">
          The database didn’t answer, so there are no numbers to show right now. Nothing here is ever estimated
          to fill the gap — try again in a minute.
        </p>
      </div>
    </main>
  );
}

/**
 * /dashboard (Week 6): every module's real records, in one public page.
 * Totals only (Tamara's decision, Nov 9): no names, emails, photos or
 * messages, and test traffic left out.
 */
export default async function Dashboard() {
  let t: Tablero;
  try {
    t = await leerTablero();
  } catch (e) {
    console.error("[dashboard]", e);
    return <SinDatos />;
  }

  const maxCosto = Math.max(...t.costos.filas.map((f) => f.usd), 0.000001);
  const hora = t.leidoEl.toLocaleString("en-US", {
    timeZone: "America/Mexico_City",
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <main className="flex-1">
      <SitioNav />

      <div className="mx-auto w-full max-w-5xl px-6 pb-24">
        <p className="text-xs tracking-[0.2em] text-text-muted uppercase">Dashboard</p>
        <h1 className="mt-4 max-w-3xl font-display text-[clamp(2.25rem,6vw,3.75rem)] leading-[0.98] font-semibold tracking-[-0.03em] text-balance">
          The real numbers.{" "}
          <span className="italic" style={{ color: "var(--barro)" }}>
            Small, and all true.
          </span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-text-muted text-pretty">
          Every figure on this page was read from ClosetAI’s database when you opened it ({hora}, Mexico City). It
          is a student venture in its first months, so the numbers are small; none of them is estimated, rounded up
          or made up.
        </p>

        <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4" data-testid="cifras">
          <Cifra id="cuentas" valor={numero(t.cuentas)} texto="Accounts" detalle="Including the founder’s and the demo account" />
          <Cifra id="prendas" valor={numero(t.app.prendas)} texto="Garments cataloged by AI" />
          <Cifra id="outfits" valor={numero(t.app.outfits.sugeridos)} texto="Outfits suggested" />
          <Cifra id="conversaciones" valor={numero(t.chat.conversaciones)} texto="Public chat conversations" detalle="Test traffic excluded" />
        </div>

        <div className="mt-12 space-y-6">
          <Modulo titulo="The app" ruta="/today" semana="Week 0">
            <Cifra
              valor={pct(t.app.outfits.tasaAceptacion)}
              texto="Outfits accepted"
              detalle={`${t.app.outfits.aceptados} accepted, ${t.app.outfits.rechazados} rejected, ${t.app.outfits.sugeridos - t.app.outfits.aceptados - t.app.outfits.rechazados} not decided yet`}
            />
            <Cifra valor={numero(t.app.pruebasVirtuales)} texto="Virtual try-ons rendered" />
            <Cifra valor={numero(t.app.reacciones)} texto="Reactions the stylist learned from" detalle="Accepts, rejects and corrections" />
            <Cifra valor={numero(t.app.recomendaciones)} texto="Shopping gaps detected" />
          </Modulo>

          <Modulo titulo="Public chat and its safety" ruta="/chat" semana="Week 5">
            <Cifra
              id="utiles"
              valor={pct(t.chat.utiles)}
              texto="Answers rated helpful"
              detalle={`${t.chat.arriba} 👍 · ${t.chat.abajo} 👎`}
            />
            <Cifra
              id="revision"
              valor={`${t.chat.revisadas} / ${t.chat.marcadas}`}
              texto="Flagged conversations reviewed by a human"
              detalle={
                t.chat.pendientes === 0
                  ? "None waiting for review"
                  : `${t.chat.pendientes} waiting for Tamara in /admin`
              }
            />
            <Cifra valor={numero(t.chat.resumenesTesters)} texto="External tester summaries" detalle="Written by the testers themselves" />
          </Modulo>

          <Modulo titulo="Research, style core and marketing" ruta="/research" semana="Weeks 1–4">
            <Cifra
              valor={numero(t.publico.fuentes)}
              texto="Verified research sources"
              detalle={`${t.publico.riesgos} risks mapped · ${t.publico.entrevistas} validation conversation${t.publico.entrevistas === 1 ? "" : "s"}`}
            />
            <Cifra valor={numero(t.publico.informes)} texto="Research answers saved" detalle="Each cites only verified sources" />
            <Cifra valor={numero(t.publico.nucleos)} texto="Style cores saved" />
            <Cifra
              valor={`${t.publico.piezasAprobadas} / ${t.publico.piezas}`}
              texto="Marketing pieces approved by a human"
              detalle="Nothing is published without approval"
            />
          </Modulo>

          <section className="rounded-3xl border border-border p-6" aria-label="Homepage experiment" data-testid="ab">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-2xl font-semibold tracking-tight">Homepage A/B experiment</h2>
              <p className="text-sm text-text-muted">
                Week 4 ·{" "}
                <Link href="/marketing" className="underline underline-offset-4 hover:text-text">
                  /marketing
                </Link>
              </p>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {(["a", "b"] as const).map((v) => (
                <Cifra
                  key={v}
                  valor={pct(t.ab[v].conversion)}
                  texto={`Variant ${v.toUpperCase()} · clicked through`}
                  detalle={`${t.ab[v].clics} of ${t.ab[v].vistas} visitors · one count per person, automated tests excluded`}
                />
              ))}
            </div>
            <p className="mt-4 text-sm text-text-muted">
              Too few visitors to call a winner yet. Reading a difference into these numbers would be guessing.
            </p>
          </section>

          <section className="rounded-3xl border border-border p-6" aria-label="AI cost" data-testid="costos">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-2xl font-semibold tracking-tight">What the AI has cost</h2>
              <p className="font-display text-2xl font-semibold tabular-nums">{dolares(t.costos.total)}</p>
            </div>
            <p className="mt-2 text-sm text-text-muted">
              {numero(t.costos.llamadas)} calls to AI models since August, test runs included — they cost money too.
              Amounts are the estimates logged with each call.
            </p>
            <ul className="mt-6 space-y-3">
              {t.costos.filas.map((f) => (
                <li key={f.operacion} data-operacion={f.operacion}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span>
                      {f.nombre} <span className="text-text-muted">
                        · {numero(f.llamadas)} {f.llamadas === 1 ? "call" : "calls"}
                      </span>
                    </span>
                    <span className="tabular-nums">{dolares(f.usd)}</span>
                  </div>
                  <div className="mt-1.5 h-2 rounded-full bg-surface-2">
                    <div
                      className="h-2 rounded-full"
                      style={{ width: `${Math.max(1, (f.usd / maxCosto) * 100)}%`, background: "var(--barro)" }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <p className="mt-10 max-w-2xl text-sm leading-relaxed text-text-muted">
          What this page never shows: names, emails, photos, chat messages or where anyone connected from. It reads
          totals with a server-only key; the tables themselves are closed to the public.{" "}
          <Link href="/privacy" className="underline underline-offset-4">
            Privacy
          </Link>
          .
        </p>
      </div>
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";

import { Logo } from "@/components/ui/logo";

import { EXPERIMENTO, resultado, type Conteo, type Variante } from "@/lib/ab";
import {
  calendarioCsv,
  canalLegible,
  EN_INGLES_DESDE,
  FORMATO_LEGIBLE,
  guionesMarkdown,
  MARCA,
  PERSONA,
  postsMarkdown,
  textoParaPegar,
  type Recurso,
} from "@/lib/marketing";
import { createAdminClient } from "@/lib/supabase/admin";

import { BotonCopiar, BotonExportar, Generador } from "./interacciones";

export const metadata: Metadata = {
  title: "Marketing",
  description:
    "ClosetAI's brand, persona, launch content and homepage A/B test — every figure verified and every piece approved by a person.",
};

// The experiment results and anything just saved have to show immediately.
export const dynamic = "force-dynamic";

const CONTENIDO =
  "https://github.com/vestiamx-code/closetai/blob/main/docs/evidencia/MARKETING-WEEK-4.md";
const PACKET = "https://github.com/vestiamx-code/closetai/blob/main/docs/WEEK-4-PACKET.md";

type Experimento = {
  id: string;
  nombre: string;
  hipotesis: string;
  variantes: { id: Variante; texto: string }[];
  metrica: string;
  inicio: string;
};

const porcentaje = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 1 }).format(n);

async function contar(experimento: string, variante: Variante, evento: "vista" | "clic") {
  const { count } = await createAdminClient()
    .from("ab_events")
    .select("id", { count: "exact", head: true })
    .eq("experimento", experimento)
    .eq("variante", variante)
    .eq("evento", evento);
  return count ?? 0;
}

/**
 * `/marketing` — Week 4.
 *
 * A workbench, not a brochure: the brand, who we are talking to, the content
 * ready to copy or export, the homepage experiment with its real numbers, and a
 * generator that cannot invent figures.
 */
export default async function Marketing() {
  const admin = createAdminClient();
  const [recursosR, experimentoR] = await Promise.all([
    admin.from("marketing_assets").select("*").order("orden"),
    admin.from("ab_experiments").select("*").eq("id", EXPERIMENTO).maybeSingle(),
  ]);

  if (recursosR.error) {
    console.error("[marketing] could not read the content", recursosR.error);
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-20">
        <h1 className="font-display text-3xl font-semibold">Marketing</h1>
        <p className="mt-4 text-text-muted">The marketing content is not available right now.</p>
      </main>
    );
  }

  const recursos = (recursosR.data ?? []) as Recurso[];
  const aprobados = recursos.filter((r) => r.origen === "redactado_ia_aprobado");
  const landing = aprobados.find((r) => r.tipo === "landing");
  const posts = aprobados.filter((r) => r.tipo === "post");
  const guiones = aprobados.filter((r) => r.tipo === "guion");
  const dias = aprobados.filter((r) => r.tipo === "dia").sort((a, b) => (a.detalle.dia ?? 0) - (b.detalle.dia ?? 0));
  const generados = recursos
    .filter((r) => r.origen === "generado_ia" && r.created_at >= EN_INGLES_DESDE)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 12);

  const experimento = experimentoR.data as Experimento | null;
  let conteos: Record<Variante, Conteo> | null = null;
  if (experimento) {
    const [va, ca, vb, cb] = await Promise.all([
      contar(experimento.id, "a", "vista"),
      contar(experimento.id, "a", "clic"),
      contar(experimento.id, "b", "vista"),
      contar(experimento.id, "b", "clic"),
    ]);
    conteos = { a: { vistas: va, clics: ca }, b: { vistas: vb, clics: cb } };
  }
  const veredicto = conteos ? resultado(conteos.a, conteos.b) : null;

  return (
    <main className="flex-1">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <Link href="/" aria-label="ClosetAI, home" className="shrink-0">
          <Logo />
        </Link>
        <Link href="/" className="rounded-full border border-border px-5 py-2 text-sm transition hover:border-text">
          See the homepage
        </Link>
      </header>

      <div className="mx-auto w-full max-w-5xl px-6 pb-24">
        <p className="text-xs tracking-[0.2em] text-text-muted uppercase">Marketing</p>
        <h1 className="mt-4 max-w-3xl font-display text-[clamp(2.25rem,6vw,3.75rem)] leading-[0.98] font-semibold tracking-[-0.03em] text-balance">
          What we say,{" "}
          <span className="italic" style={{ color: "var(--barro)" }}>
            and why you can believe it.
          </span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-text-muted text-pretty">
          The brand, who we are talking to, and all the launch content. An AI drafted it using only verified
          facts, and a person approved it before it was published. Nothing here carries a figure without its
          source.
        </p>

        {/* ------------------------------------------------------------ Marca */}
        <Seccion id="marca" titulo="Brand system" bajada={`The promise: “${MARCA.promesa}”`}>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-surface p-5">
              <h3 className="text-xs tracking-[0.14em] text-text-muted uppercase">Colors</h3>
              <ul className="mt-4 space-y-3">
                {MARCA.colores.map((c) => (
                  <li key={c.hex} className="flex items-center gap-3">
                    <span
                      aria-hidden
                      className="h-10 w-10 shrink-0 rounded-lg border border-border"
                      style={{ background: c.hex }}
                    />
                    <span className="text-sm">
                      <span className="font-medium">{c.nombre}</span>{" "}
                      <code className="text-text-muted">{c.hex}</code>
                      <span className="block text-text-muted">{c.uso}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <h3 className="mt-6 text-xs tracking-[0.14em] text-text-muted uppercase">Typefaces</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {MARCA.tipografias.map((t) => (
                  <li key={t.nombre}>
                    <span className={t.nombre === "Fraunces" ? "font-display text-lg font-semibold" : "font-medium"}>
                      {t.nombre}
                    </span>{" "}
                    <span className="text-text-muted">— {t.uso}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-5">
              <h3 className="text-xs tracking-[0.14em] text-text-muted uppercase">Voice — do</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {MARCA.voz.si.map((v) => (
                  <li key={v} className="flex gap-2">
                    <span aria-hidden>·</span>
                    <span>{v}</span>
                  </li>
                ))}
              </ul>
              <h3 className="mt-6 text-xs tracking-[0.14em] text-text-muted uppercase">Voice — don’t</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {MARCA.voz.no.map((v) => (
                  <li key={v} className="flex gap-2">
                    <span aria-hidden>·</span>
                    <span>{v}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="mt-4 rounded-xl border border-border p-4 text-sm">
            <span className="font-medium">Known brand risk. </span>
            <span className="text-text-muted">{MARCA.riesgo}</span>
          </p>
        </Seccion>

        {/* ------------------------------------------------------------ Persona */}
        <Seccion id="persona" titulo={`Persona: ${PERSONA.nombre}`} bajada={PERSONA.resumen}>
          <p className="mt-4 rounded-xl border border-border p-4 text-sm text-text-muted">{PERSONA.aviso}</p>
          <ul data-testid="persona" className="mt-6 space-y-3">
            {PERSONA.rasgos.map((r) => (
              <li key={r.texto} data-rasgo={r.tipo} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <Sello tipo={r.tipo} />
                <span>{r.texto}</span>
                {r.fuente ? <span className="w-full pl-[5.25rem] text-sm text-text-muted">{r.fuente}</span> : null}
              </li>
            ))}
          </ul>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <p className="rounded-xl border border-border bg-surface p-4">
              <span className="text-xs tracking-[0.14em] text-text-muted uppercase">What she wants</span>
              <span className="mt-1.5 block">{PERSONA.quiere}</span>
            </p>
            <p className="rounded-xl border border-border bg-surface p-4">
              <span className="text-xs tracking-[0.14em] text-text-muted uppercase">What holds her back</span>
              <span className="mt-1.5 block">{PERSONA.frena}</span>
            </p>
          </div>
        </Seccion>

        {/* ------------------------------------------------------------ Portada */}
        {landing ? (
          <Seccion id="landing" titulo="Homepage copy" bajada="The copy live on closetai.lat, to copy in full.">
            <div data-testid="landing-copy" className="mt-6 rounded-2xl border border-border bg-surface p-5">
              <p className="max-h-72 overflow-y-auto text-sm leading-relaxed whitespace-pre-line">{landing.cuerpo}</p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <BotonCopiar texto={landing.cuerpo} etiqueta="Copy the text" />
                <Aprobado />
              </div>
            </div>
          </Seccion>
        ) : null}

        {/* ------------------------------------------------------------ A/B */}
        {experimento && conteos && veredicto ? (
          <Seccion id="ab" titulo="A/B test: the headline" bajada={experimento.hipotesis}>
            <div data-testid="ab-resultados" className="mt-6 grid gap-4 md:grid-cols-2">
              {experimento.variantes.map((v) => {
                const c = conteos[v.id];
                const esGanador = veredicto.ganador === v.id;
                return (
                  <div
                    key={v.id}
                    data-variante-resultado={v.id}
                    className={`rounded-2xl border bg-surface p-5 ${esGanador ? "border-2" : "border-border"}`}
                    style={esGanador ? { borderColor: "var(--barro)" } : undefined}
                  >
                    <p className="text-xs tracking-[0.14em] text-text-muted uppercase">Variant {v.id.toUpperCase()}</p>
                    <p className="mt-2 font-display text-2xl font-semibold">“{v.texto}”</p>
                    <p className="mt-4 font-display text-4xl font-semibold tabular-nums">
                      {c.vistas > 0 ? porcentaje(c.clics / c.vistas) : "—"}
                    </p>
                    <p className="text-sm text-text-muted tabular-nums">
                      {c.clics} {c.clics === 1 ? "click" : "clicks"} out of {c.vistas}{" "}
                      {c.vistas === 1 ? "visitor" : "visitors"}
                    </p>
                  </div>
                );
              })}
            </div>
            <p data-testid="ab-veredicto" className="mt-4 rounded-xl border border-border p-4 font-medium">
              {veredicto.motivo}
            </p>
            <ul className="mt-4 space-y-2 text-sm text-text-muted">
              <li>· Metric: {experimento.metrica}.</li>
              <li>
                · Each visitor sees one variant, always the same one, and counts once even if they reload. The
                variant comes from a random id; only a hash of that id is stored.
              </li>
              <li>
                · It takes 100 visitors per variant and a difference significant at 95% (two-proportion z-test)
                to name a winner. Before that, any difference could be luck.
              </li>
              <li>· Visits from automated tests, bots and screenshot tools are not counted. Started on {experimento.inicio}.</li>
            </ul>
          </Seccion>
        ) : null}

        {/* ------------------------------------------------------------ Posts */}
        <Seccion id="posts" titulo={`${posts.length} posts`} bajada="Instagram and TikTok. Each one copies ready to paste.">
          <div className="mt-6 flex flex-wrap gap-3">
            <BotonExportar
              nombre="closetai-posts.md"
              contenido={postsMarkdown(posts)}
              tipo="text/markdown"
              etiqueta="Export the posts (.md)"
            />
          </div>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p, i) => (
              <li key={p.id} data-post={p.id} className="flex flex-col rounded-xl border border-border bg-surface p-5">
                <p className="text-xs tracking-[0.14em] text-text-muted uppercase">
                  {i + 1} · {canalLegible(p.canal)} · {p.formato ? FORMATO_LEGIBLE[p.formato] : ""}
                </p>
                <p className="mt-2 font-display text-lg font-semibold">{p.titulo}</p>
                {p.detalle.laminas?.length ? (
                  <ol className="mt-3 flex-1 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed">
                    {p.detalle.laminas.map((l) => (
                      <li key={l}>{l}</li>
                    ))}
                  </ol>
                ) : (
                  <p className="mt-3 flex-1 text-sm leading-relaxed">{p.cuerpo}</p>
                )}
                {p.detalle.texto && p.detalle.texto !== p.cuerpo ? (
                  <p className="mt-3 text-sm text-text-muted">{p.detalle.texto}</p>
                ) : null}
                {p.detalle.hashtags?.length ? (
                  <p className="mt-2 text-sm text-text-muted">{p.detalle.hashtags.join(" ")}</p>
                ) : null}
                {p.detalle.guion ? (
                  <a href={`#${p.detalle.guion}`} className="mt-2 text-sm underline underline-offset-4">
                    See the script
                  </a>
                ) : null}
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
                  <BotonCopiar texto={textoParaPegar(p)} />
                  <Aprobado />
                </div>
              </li>
            ))}
          </ul>
        </Seccion>

        {/* ------------------------------------------------------------ Guiones */}
        <Seccion id="guiones" titulo={`${guiones.length} video scripts`} bajada="For TikTok and Reels. Each shot with what you see, the on-screen text and the voice.">
          <div className="mt-6">
            <BotonExportar
              nombre="closetai-guiones.md"
              contenido={guionesMarkdown(guiones)}
              tipo="text/markdown"
              etiqueta="Export the scripts (.md)"
            />
          </div>
          <div className="mt-6 space-y-8">
            {guiones.map((g, i) => (
              <article key={g.id} id={g.id} data-guion={g.id} className="rounded-2xl border border-border bg-surface p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <h3 className="font-display text-xl font-semibold">
                    Script {i + 1} · {g.titulo}
                  </h3>
                  <span className="text-sm text-text-muted">{g.detalle.duracion}</span>
                </div>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[560px] border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs tracking-[0.1em] text-text-muted uppercase">
                        <th scope="col" className="py-2 pr-3">Shot</th>
                        <th scope="col" className="py-2 pr-3">What you see</th>
                        <th scope="col" className="py-2 pr-3">On-screen text</th>
                        <th scope="col" className="py-2">Voice</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(g.detalle.tomas ?? []).map((t) => (
                        <tr key={t.toma} className="border-b border-border align-top">
                          <td className="py-2.5 pr-3 whitespace-nowrap tabular-nums">{t.toma}</td>
                          <td className="py-2.5 pr-3">{t.se_ve}</td>
                          <td className="py-2.5 pr-3">{t.texto || "—"}</td>
                          <td className="py-2.5">{t.voz || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <BotonCopiar texto={guionesMarkdown([g])} etiqueta="Copy the script" />
                  <Aprobado />
                </div>
              </article>
            ))}
          </div>
        </Seccion>

        {/* ------------------------------------------------------------ Calendario */}
        <Seccion id="calendario" titulo={`${dias.length}-day calendar`} bajada="Eleven publishing days and three rest days to read the results.">
          <div className="mt-6">
            <BotonExportar
              nombre="closetai-calendario.csv"
              contenido={calendarioCsv(dias)}
              tipo="text/csv"
              etiqueta="Export the calendar (.csv)"
            />
          </div>
          <div className="mt-6 overflow-x-auto">
            <table data-testid="calendario" className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs tracking-[0.1em] text-text-muted uppercase">
                  <th scope="col" className="py-2 pr-3">Day</th>
                  <th scope="col" className="py-2 pr-3">Channel</th>
                  <th scope="col" className="py-2 pr-3">Piece</th>
                  <th scope="col" className="py-2">Purpose</th>
                </tr>
              </thead>
              <tbody>
                {dias.map((d) => (
                  <tr key={d.id} data-dia={d.detalle.dia} className="border-b border-border align-top">
                    <td className="py-2.5 pr-3 tabular-nums">{d.detalle.dia}</td>
                    <td className="py-2.5 pr-3">{canalLegible(d.canal)}</td>
                    <td className="py-2.5 pr-3">
                      {d.detalle.pieza ? (
                        <a href={`#posts`} className="underline-offset-4 hover:underline">
                          {d.titulo}
                        </a>
                      ) : (
                        d.titulo
                      )}
                    </td>
                    <td className="py-2.5 text-text-muted">{d.detalle.para_que}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Seccion>

        {/* ------------------------------------------------------------ Generador */}
        <Seccion
          id="generador"
          titulo="Post generator"
          bajada="An AI writes a new post in the brand's voice. If it includes a figure that isn't verified, it is rejected before you see it."
        >
          <Generador />
        </Seccion>

        {/* ------------------------------------------------------------ Guardados */}
        <Seccion
          id="guardados"
          titulo="Saved assets"
          bajada="What has been generated and saved. None of it is approved: approving it is a person's job."
        >
          {generados.length === 0 ? (
            <p data-testid="sin-generados" className="mt-6 text-text-muted">
              No generated post has been saved yet.
            </p>
          ) : (
            <ul data-testid="generados" className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {generados.map((g) => (
                <li key={g.id} data-generado={g.id} className="rounded-xl border border-dashed border-border p-5">
                  <p className="text-xs tracking-[0.14em] text-text-muted uppercase">
                    Generated with AI · not reviewed · {canalLegible(g.canal)}
                  </p>
                  <p className="mt-2 font-medium">{g.titulo}</p>
                  <p className="mt-2 line-clamp-5 text-sm leading-relaxed">{g.cuerpo}</p>
                  <div className="mt-4">
                    <BotonCopiar texto={textoParaPegar(g)} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Seccion>

        <p className="mt-16 border-t border-border pt-6 text-sm text-text-muted">
          This week’s plan, written before the code, is in{" "}
          <a href={PACKET} className="underline underline-offset-4 hover:text-text">
            WEEK-4-PACKET.md
          </a>
          . The approved content, and what was withdrawn before approval, is in{" "}
          <a href={CONTENIDO} className="underline underline-offset-4 hover:text-text">
            MARKETING-WEEK-4.md
          </a>
          .
        </p>
      </div>
    </main>
  );
}

function Aprobado() {
  return (
    <span
      className="rounded-full border px-2.5 py-0.5 text-xs"
      style={{ borderColor: "var(--verde, #2f6b43)", color: "var(--verde, #2f6b43)" }}
    >
      written with AI · approved by Tamara
    </span>
  );
}

function Sello({ tipo }: { tipo: "dato" | "hipotesis" }) {
  return tipo === "dato" ? (
    <span
      className="inline-block w-[4.5rem] shrink-0 rounded-full border px-2.5 py-0.5 text-center text-xs"
      style={{ borderColor: "var(--verde, #2f6b43)", color: "var(--verde, #2f6b43)" }}
    >
      data
    </span>
  ) : (
    <span className="inline-block w-[4.5rem] shrink-0 rounded-full border border-border px-2.5 py-0.5 text-center text-xs text-text-muted">
      hypothesis
    </span>
  );
}

function Seccion({
  id,
  titulo,
  bajada,
  children,
}: {
  id: string;
  titulo: string;
  bajada?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-titulo`} className="mt-20 border-t border-border pt-10">
      <h2 id={`${id}-titulo`} className="font-display text-3xl font-semibold tracking-tight">
        {titulo}
      </h2>
      {bajada ? <p className="mt-2 max-w-2xl text-text-muted">{bajada}</p> : null}
      {children}
    </section>
  );
}

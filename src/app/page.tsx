import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import Link from "next/link";

import { varianteDe, type Variante } from "@/lib/ab";

import { BotonEmpezar, Experimento } from "./experimento";

/**
 * Portada — Semana 4.
 *
 * La de la Semana 0 tenía buena composición y poco argumento: un titular, cuatro
 * capacidades y una promesa. Esta conserva la composición y ordena el argumento
 * de arriba abajo, como lo leería alguien que no conoce ClosetAI: qué es → el
 * problema → cómo funciona → por qué creerle → cuánto cuesta → qué pasa con sus
 * fotos → empezar.
 *
 * Dos frases de la versión anterior se quitaron porque no se podían sostener:
 * «A las dos semanas ya no te propone lo que odias» nunca se midió, y «Diez
 * prendas bastan para empezar» choca con la conversación de la Semana 2, donde
 * el límite antes de cansarse fueron 40.
 *
 * El titular es un experimento A/B (`src/lib/ab.ts`). La variante se elige aquí,
 * en el servidor, y no en `proxy.ts`: ahí vive la sesión, que ya se rompió una
 * vez en producción con un cambio menor.
 *
 * Todo el movimiento vive en `globals.css` y se apaga con `prefers-reduced-motion`.
 */

const TITULARES: Record<Variante, [string, string]> = {
  a: ["Tu estilista,", "en tu bolsillo."],
  b: ["Ya tienes", "qué ponerte."],
};

const CORRIDO = ["playeras", "vestidos", "jeans", "blazers", "tenis", "abrigos", "faldas", "sudaderas", "botas", "camisas"];

const PASOS = [
  { n: "01", titulo: "Fotografía tu ropa", cuerpo: "La IA llena el tipo, los colores y la temporada de cada prenda." },
  { n: "02", titulo: "Arma tu clóset", cuerpo: "Todo en tu celular, con el fondo recortado." },
  { n: "03", titulo: "Te dice qué ponerte", cuerpo: "Outfits con lo que ya tienes, para el clima de tu ciudad." },
];

const DATOS = [
  { cifra: "77 M", texto: "personas compraron en línea en México en 2025." },
  { cifra: "59%", texto: "de ellas compra ropa." },
  { cifra: "35%", texto: "quedó muy satisfecha con su compra de moda en línea." },
];

const FOTOS = [
  "Viven en un espacio privado al que nadie más entra.",
  "Se borran de verdad cuando las quitas o borras tu cuenta.",
  "No vendemos tus datos y no hay anuncios.",
];

export default async function Home() {
  const jar = await cookies();
  const guardado = jar.get("cai_visitante")?.value;
  const valido = Boolean(guardado && /^[0-9a-f-]{36}$/i.test(guardado));
  const visitante = valido ? guardado! : randomUUID();
  const variante = varianteDe(visitante, "titular");
  const [linea1, linea2] = TITULARES[variante];

  return (
    <main className="flex-1">
      <Experimento visitante={visitante} variante={variante} nuevo={!valido} />

      {/* ---------- 1 · Titular ---------- */}
      <section data-seccion="titular" className="relative flex min-h-[92svh] flex-col overflow-hidden bg-hueso">
        {/* Dos manchas de color muy difusas. Dan profundidad sin competir con el texto. */}
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
          <nav aria-label="Principal" className="flex items-center gap-1 sm:gap-2">
            <Link href="/product" className="hidden rounded-full px-4 py-2 text-sm text-text-muted transition hover:text-text sm:inline">
              Producto
            </Link>
            <Link href="/pricing" className="hidden rounded-full px-4 py-2 text-sm text-text-muted transition hover:text-text sm:inline">
              Precios
            </Link>
            <Link
              href="/entrar"
              className="rounded-full border border-border px-5 py-2 text-sm transition hover:border-text"
            >
              Entrar
            </Link>
          </nav>
        </header>

        <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 pb-16">
          <p
            className="entra text-[0.65rem] tracking-[0.18em] text-text-muted uppercase sm:text-xs sm:tracking-[0.22em]"
            style={{ animationDelay: "0.05s" }}
          >
            Estilista personal con IA{" "}
            {/* En pantallas chicas el separador parte la línea y deja "México" solo. */}
            <span className="hidden sm:inline">· Hecho en México</span>
            <span className="mt-1 block sm:hidden">Hecho en México</span>
          </p>

          {/* La escala es el argumento. El titular tiene que dominar la pantalla. */}
          <h1
            data-variante={variante}
            className="mt-6 font-display text-[clamp(3rem,11vw,8.5rem)] leading-[0.88] font-semibold tracking-[-0.035em]"
          >
            <span className="entra block" style={{ animationDelay: "0.12s" }}>
              {linea1}
            </span>
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
              Fotografía tu ropa, ClosetAI la ordena por ti y cada mañana te dice qué ponerte con lo que ya
              tienes.
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
                Empezar gratis
              </BotonEmpezar>
              <Link
                href="/core"
                className="inline-flex items-center justify-center px-2 py-4 text-base text-text-muted underline underline-offset-8 transition hover:text-text"
              >
                Probar sin cuenta
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Marquesina ---------- */}
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

      {/* ---------- 2 · El problema ---------- */}
      <section data-seccion="problema" className="mx-auto w-full max-w-6xl px-6 pt-24 sm:pt-32">
        <p className="text-xs tracking-[0.22em] text-text-muted uppercase">El problema</p>
        <h2 className="mt-5 max-w-3xl font-display text-4xl leading-tight font-semibold tracking-tight text-balance sm:text-6xl">
          Tienes el clóset lleno y te pones lo mismo.
        </h2>
        <p className="mt-6 max-w-xl text-xl leading-relaxed text-text-muted text-pretty">
          No te falta ropa: te falta verla toda junta.
        </p>
      </section>

      {/* ---------- 3 · Cómo funciona ---------- */}
      <section data-seccion="como-funciona" className="mx-auto w-full max-w-6xl px-6 py-24 sm:py-32">
        <h2 className="max-w-2xl font-display text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
          Cómo funciona
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

      {/* ---------- 4 · Prueba: datos con su fuente ---------- */}
      <section data-seccion="prueba" style={{ background: "var(--arena)" }}>
        <div className="mx-auto w-full max-w-6xl px-6 py-24 sm:py-28">
          <p className="text-xs tracking-[0.22em] text-text-muted uppercase">Lo que dicen los datos</p>
          <dl className="mt-10 grid gap-10 sm:grid-cols-3">
            {DATOS.map((d) => (
              <div key={d.cifra} className="border-t pt-6" style={{ borderColor: "var(--border)" }}>
                <dt className="font-display text-5xl font-semibold tracking-tight sm:text-6xl">{d.cifra}</dt>
                <dd className="mt-3 leading-relaxed text-pretty">{d.texto}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-12 max-w-2xl font-display text-2xl leading-snug tracking-tight text-balance sm:text-3xl">
            Comprar no es el problema.{" "}
            <span className="italic" style={{ color: "var(--barro)" }}>
              Saber qué combinar, sí.
            </span>
          </p>
          <p className="mt-6 text-sm text-text-muted">
            Fuente: AMVO y Milenio con datos de AMVO.{" "}
            <Link href="/research" className="underline underline-offset-4 hover:text-text">
              Cada dato enlaza a su fuente en la investigación
            </Link>
            .
          </p>
        </div>
      </section>

      {/* ---------- 5 · Precio ---------- */}
      <section data-seccion="precio" className="mx-auto w-full max-w-6xl px-6 py-24 sm:py-32">
        <p className="text-xs tracking-[0.22em] text-text-muted uppercase">Precio</p>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-surface p-8">
            <p className="font-display text-5xl font-semibold tracking-tight">$0</p>
            <p className="mt-3 text-lg">Tu clóset, gratis para siempre.</p>
            <p className="mt-2 text-text-muted">Nunca te cobramos por el trabajo que ya hiciste.</p>
          </div>
          <div className="rounded-2xl border-2 bg-surface p-8" style={{ borderColor: "var(--barro)" }}>
            <p className="font-display text-5xl font-semibold tracking-tight">$100</p>
            <p className="mt-3 text-lg">ClosetAI Completo, una sola vez.</p>
            <p className="mt-2 text-text-muted">Sin mensualidad.</p>
          </div>
        </div>
        <p className="mt-6 text-sm text-text-muted">
          <Link href="/pricing" className="underline underline-offset-4 hover:text-text">
            Ver la cuenta completa
          </Link>{" "}
          · qué incluye cada plan y cuánto nos cuesta servirlo.
        </p>
      </section>

      {/* ---------- 6 · Privacidad ---------- */}
      <section data-seccion="privacidad" style={{ background: "var(--tinta)", color: "var(--hueso)" }}>
        <div className="mx-auto w-full max-w-6xl px-6 py-24 sm:py-32">
          <p className="text-xs tracking-[0.22em] uppercase" style={{ opacity: 0.55 }}>
            Tus fotos son tuyas
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
          <Link href="/privacidad" className="mt-10 inline-block text-sm underline underline-offset-4" style={{ opacity: 0.7 }}>
            El aviso de privacidad completo
          </Link>
        </div>
      </section>

      {/* ---------- 7 · Empezar ---------- */}
      <section data-seccion="empezar" className="mx-auto w-full max-w-6xl px-6 py-24 text-center sm:py-36">
        <h2 className="mx-auto max-w-3xl font-display text-[clamp(2.25rem,6vw,4.5rem)] leading-[1.02] font-semibold tracking-[-0.03em] text-balance">
          Ya tienes qué ponerte.
          <br />
          <span className="italic" style={{ color: "var(--barro)" }}>
            Solo falta verlo.
          </span>
        </h2>
        <Link
          href="/registro"
          className="mt-12 inline-flex items-center justify-center rounded-full bg-text px-10 py-4.5 text-base font-medium text-bg transition hover:opacity-90"
        >
          Crear mi clóset gratis
        </Link>
        <p className="mt-5 text-sm text-text-muted">
          No pedimos tarjeta. ¿Todavía no quieres subir fotos?{" "}
          <Link href="/core" className="underline underline-offset-4 hover:text-text">
            Descubre tu núcleo de estilo sin cuenta
          </Link>
          .
        </p>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-8 text-sm text-text-muted sm:flex-row sm:items-center sm:justify-between">
          <span className="font-display text-base text-text">ClosetAI</span>
          <nav aria-label="Pie" className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/product" className="underline-offset-4 hover:text-text hover:underline">Producto</Link>
            <Link href="/pricing" className="underline-offset-4 hover:text-text hover:underline">Precios</Link>
            <Link href="/research" className="underline-offset-4 hover:text-text hover:underline">Investigación</Link>
            <Link href="/marketing" className="underline-offset-4 hover:text-text hover:underline">Marketing</Link>
            <Link href="/privacidad" className="underline-offset-4 hover:text-text hover:underline">Aviso de privacidad</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}

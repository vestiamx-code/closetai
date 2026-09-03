import Link from "next/link";

/**
 * Portada.
 *
 * La versión anterior era un documento: titular, párrafo, cuatro bloques de
 * texto iguales. Correcta y fría. Esta apuesta por composición — una obertura
 * a pantalla completa, contraste de escala entre el titular y todo lo demás,
 * paneles de color que dan profundidad, y entradas escalonadas.
 *
 * Todo el movimiento vive en `globals.css` y se apaga con
 * `prefers-reduced-motion`.
 */

const CAPACIDADES = [
  {
    n: "01",
    titulo: "Tu clóset, digital",
    cuerpo:
      "Fotografía tus prendas por lotes. La IA las recorta, las cataloga y las deja listas para combinar. Diez prendas bastan para empezar.",
  },
  {
    n: "02",
    titulo: "Qué me pongo hoy",
    cuerpo:
      "Tres outfits armados con la ropa que ya tienes, según el clima de tu ciudad y la ocasión. Cada uno te explica por qué funciona.",
  },
  {
    n: "03",
    titulo: "Pruébatelo sin probártelo",
    cuerpo:
      "Mira el outfit puesto sobre tu propia foto antes de decidir. Sin espejo, sin desvestirte, sin adivinar.",
  },
  {
    n: "04",
    titulo: "Aprende tu estilo",
    cuerpo:
      "Cada vez que aceptas o rechazas algo, ClosetAI entiende mejor qué te gusta. A las dos semanas ya no te propone lo que odias.",
  },
];

const CORRIDO = [
  "playeras",
  "vestidos",
  "jeans",
  "blazers",
  "tenis",
  "abrigos",
  "faldas",
  "sudaderas",
  "botas",
  "camisas",
];

const PROMESAS = [
  "Tu clóset es gratis e ilimitado. Para siempre.",
  "Cero anuncios.",
  "Nunca cobramos por algo que ya construiste.",
  "Tus fotos son privadas y las puedes borrar de verdad.",
];

export default function Home() {
  return (
    <main className="flex-1">
      {/* ---------- Obertura ---------- */}
      <section className="relative flex min-h-[92svh] flex-col overflow-hidden bg-hueso">
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
          <div className="flex items-center gap-2">
            <Link
              href="/core"
              className="rounded-full px-4 py-2 text-sm text-text-muted transition hover:text-text"
            >
              Núcleo de estilo
            </Link>
            <Link
              href="/entrar"
              className="rounded-full border border-border px-5 py-2 text-sm transition hover:border-text"
            >
              Entrar
            </Link>
          </div>
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
          <h1 className="mt-6 font-display text-[clamp(3rem,11vw,8.5rem)] leading-[0.88] font-semibold tracking-[-0.035em]">
            <span className="entra block" style={{ animationDelay: "0.12s" }}>
              Tu estilista,
            </span>
            <span
              className="entra block italic"
              style={{ animationDelay: "0.24s", color: "var(--barro)" }}
            >
              en tu bolsillo.
            </span>
          </h1>

          <div
            aria-hidden
            className="linea-crece mt-9 h-px w-full"
            style={{ background: "var(--border)" }}
          />

          <div className="mt-9 flex flex-col gap-9 sm:flex-row sm:items-end sm:justify-between">
            <p
              className="entra max-w-md text-lg leading-relaxed text-text-muted text-pretty"
              style={{ animationDelay: "0.36s" }}
            >
              Fotografía tu ropa, arma tu clóset digital y deja que la inteligencia
              artificial te diga qué ponerte — y te lo muestre puesto, sobre tu propia foto.
            </p>

            <div
              className="entra flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center"
              style={{ animationDelay: "0.48s" }}
            >
              <Link
                href="/registro"
                className="inline-flex items-center justify-center rounded-full bg-text px-8 py-4 text-base font-medium text-bg transition hover:opacity-90"
              >
                Arma tu clóset gratis
              </Link>
              <Link
                href="/entrar"
                className="inline-flex items-center justify-center px-2 py-4 text-base text-text-muted underline underline-offset-8 transition hover:text-text"
              >
                Ya tengo cuenta
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

      {/* ---------- Capacidades ---------- */}
      <section className="mx-auto w-full max-w-6xl px-6 py-24 sm:py-32">
        <h2 className="max-w-2xl font-display text-4xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl">
          No es un catálogo de tu ropa. Es alguien que te la sabe combinar.
        </h2>

        <div className="mt-16 grid gap-x-14 gap-y-14 sm:grid-cols-2">
          {CAPACIDADES.map((c) => (
            <article key={c.n} className="border-t border-border pt-6">
              <span
                className="font-display text-sm tracking-widest"
                style={{ color: "var(--barro)" }}
              >
                {c.n}
              </span>
              <h3 className="mt-3 font-display text-2xl font-semibold tracking-tight">
                {c.titulo}
              </h3>
              <p className="mt-3 leading-relaxed text-text-muted text-pretty">{c.cuerpo}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ---------- Promesas ---------- */}
      <section style={{ background: "var(--tinta)", color: "var(--hueso)" }}>
        <div className="mx-auto w-full max-w-6xl px-6 py-24 sm:py-32">
          <p className="text-xs tracking-[0.22em] uppercase" style={{ opacity: 0.55 }}>
            Lo que no vamos a hacer
          </p>
          <ul className="mt-12 space-y-8">
            {PROMESAS.map((promesa) => (
              <li
                key={promesa}
                className="border-b pb-8 font-display text-2xl leading-snug tracking-tight text-balance sm:text-4xl"
                style={{ borderColor: "rgba(253,250,246,0.16)" }}
              >
                {promesa}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- Puerta a /core ---------- */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-8">
        <div
          className="rounded-2xl px-8 py-12 sm:px-14 sm:py-16"
          style={{ background: "var(--arena)" }}
        >
          <p className="text-xs tracking-[0.2em] text-text-muted uppercase">
            ¿Todavía no quieres subir fotos?
          </p>
          <h2 className="mt-5 max-w-2xl font-display text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
            Cuéntame cómo te gusta vestirte y te digo cuál es tu núcleo de estilo.
          </h2>
          <p className="mt-4 max-w-xl leading-relaxed text-text-muted text-pretty">
            Sin cuenta y sin fotografiar una sola prenda. Un minuto.
          </p>
          <Link
            href="/core"
            className="mt-8 inline-flex items-center justify-center rounded-full bg-text px-8 py-3.5 text-base font-medium text-bg transition hover:opacity-90"
          >
            Extraer mi núcleo
          </Link>
        </div>
      </section>

      {/* ---------- Cierre ---------- */}
      <section className="mx-auto w-full max-w-6xl px-6 py-24 text-center sm:py-36">
        <h2 className="mx-auto max-w-3xl font-display text-[clamp(2.25rem,6vw,4.5rem)] leading-[1.02] font-semibold tracking-[-0.03em] text-balance">
          Empieza con diez prendas.
          <br />
          <span className="italic" style={{ color: "var(--barro)" }}>
            El resto lo pongo yo.
          </span>
        </h2>
        <Link
          href="/registro"
          className="mt-12 inline-flex items-center justify-center rounded-full bg-text px-10 py-4.5 text-base font-medium text-bg transition hover:opacity-90"
        >
          Arma tu clóset gratis
        </Link>
        <p className="mt-5 text-sm text-text-muted">No pedimos tarjeta.</p>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 py-8 text-sm text-text-muted sm:flex-row sm:items-center sm:justify-between">
          <span className="font-display text-base text-text">ClosetAI</span>
          <Link href="/privacidad" className="underline underline-offset-4 transition hover:text-text">
            Aviso de privacidad
          </Link>
        </div>
      </footer>
    </main>
  );
}

const features = [
  {
    title: "Tu clóset, digital",
    body: "Fotografía tus prendas por lotes. La IA las recorta, las cataloga y las deja listas para combinar. Diez prendas bastan para empezar.",
  },
  {
    title: "Qué me pongo hoy",
    body: "Tres outfits armados con la ropa que ya tienes, según el clima de tu ciudad y la ocasión. Cada uno te explica por qué funciona.",
  },
  {
    title: "Pruébatelo sin probártelo",
    body: "Mira el outfit puesto sobre tu propia foto antes de decidir. Sin espejo, sin desvestirte, sin adivinar.",
  },
  {
    title: "Aprende tu estilo",
    body: "Cada vez que aceptas o rechazas algo, ClosetAI entiende mejor qué te gusta. A las dos semanas ya no te propone lo que odias.",
  },
];

const promises = [
  "Tu clóset es gratis e ilimitado. Para siempre.",
  "Cero anuncios.",
  "Nunca cobramos por algo que ya construiste.",
  "Tus fotos son privadas y las puedes borrar de verdad.",
];

export default function Home() {
  return (
    <main className="flex-1">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <span className="font-display text-xl font-semibold tracking-tight">
          ClosetAI
        </span>
        <span className="rounded-full border border-border px-3 py-1 text-xs text-text-muted">
          En construcción
        </span>
      </header>

      <section className="mx-auto w-full max-w-5xl px-6 pt-10 pb-20 sm:pt-20">
        <h1 className="font-display text-5xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-7xl">
          Tu estilista,
          <br />
          en tu bolsillo.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-text-muted text-pretty">
          Fotografía tu ropa, arma tu clóset digital y deja que la inteligencia
          artificial te diga qué ponerte — y te lo muestre puesto, sobre tu
          propia foto.
        </p>
        <p className="mt-8 text-sm text-text-muted">
          Estamos construyendo ClosetAI en público. Pronto abrimos.
        </p>
      </section>

      <section className="border-y border-border bg-surface">
        <div className="mx-auto w-full max-w-5xl px-6 py-14 sm:py-20">
          <div className="grid gap-10 sm:grid-cols-2 sm:gap-x-12 sm:gap-y-14">
            {features.map((f) => (
              <article key={f.title}>
                <h2 className="font-display text-2xl font-semibold tracking-tight">
                  {f.title}
                </h2>
                <p className="mt-3 leading-relaxed text-text-muted text-pretty">
                  {f.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 py-20">
        <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Lo que no vamos a hacer
        </h2>
        <p className="mt-3 max-w-xl leading-relaxed text-text-muted text-pretty">
          Las apps de clóset digital suelen morir por lo mismo: te hacen
          catalogar tu ropa durante horas y después te cobran por verla.
          Nosotros no.
        </p>
        <ul className="mt-8 space-y-3">
          {promises.map((p) => (
            <li key={p} className="flex gap-3 leading-relaxed">
              <span aria-hidden className="text-accent">
                —
              </span>
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto w-full max-w-5xl px-6 py-10 text-sm text-text-muted">
          <p className="font-display text-base text-text">ClosetAI</p>
          <p className="mt-2">Hecho en México, en español.</p>
          <p className="mt-4">
            <a href="/privacidad" className="underline underline-offset-4 transition hover:text-text">
              Aviso de privacidad
            </a>
          </p>
        </div>
      </footer>
    </main>
  );
}

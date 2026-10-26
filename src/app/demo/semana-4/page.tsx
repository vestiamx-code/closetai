import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Video demo · Semana 4 · ClosetAI",
  description:
    "Recorrido de 2:32 por la portada nueva y /marketing: el titular A/B, la marca, la persona, el contenido de lanzamiento y un generador que no puede inventar cifras.",
};

/** Video de la Semana 4, con su propio enlace estable, como el de cada semana. */
export default function DemoSemana4() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <Link href="/" className="text-sm text-text-muted transition hover:text-text">
        ClosetAI
      </Link>

      <h1 className="mt-8 font-display text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
        Semana 4 · Decir solo lo que se puede probar
      </h1>
      <p className="mt-4 max-w-xl text-lg leading-relaxed text-text-muted text-pretty">
        Recorrido de 2:32 por la portada y <code className="text-text">/marketing</code> en producción: el
        titular que se mide con visitas reales, y un marketing que solo dice lo que está verificado.
      </p>

      <video
        controls
        preload="metadata"
        playsInline
        className="mt-8 w-full rounded-lg border border-border bg-black"
      >
        <source src="/semana-4-marketing.mp4" type="video/mp4" />
        Tu navegador no puede reproducir video.{" "}
        <a href="/semana-4-marketing.mp4" className="underline">
          Descarga el archivo
        </a>
        .
      </video>

      <h2 className="mt-12 font-display text-2xl font-semibold tracking-tight">Qué muestra</h2>
      <ul className="mt-4 space-y-2 text-text-muted">
        {[
          "Las dos versiones del titular, cada una para un visitante distinto",
          "La portada como argumento: problema, cómo funciona, datos con fuente, precio y privacidad",
          "La marca, y Sofía, la persona, con cada rasgo marcado como dato o hipótesis",
          "Los resultados A/B en vivo, sin ganador hasta tener muestra suficiente",
          "Los 10 posts aprobados, copiar uno, los 3 guiones y el calendario exportable",
          "El generador escribiendo un post nuevo, que se guarda como «sin revisar»",
          "El historial en GitHub",
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
        <Link href="/demo/semana-3" className="underline underline-offset-4">
          Ver el video de la Semana 3
        </Link>{" "}
        ·{" "}
        <a href="/semana-4-marketing.mp4" download className="underline underline-offset-4">
          Descargar este video
        </a>
      </p>
    </main>
  );
}

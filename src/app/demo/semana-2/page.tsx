import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Video demo · Semana 2 · ClosetAI",
  description:
    "Recorrido de 2:30 por /research: la investigación de ClosetAI con fuentes verificadas, el mapa de riesgos y una conversación real.",
};

/** Video de la Semana 2, con su propio enlace estable, como el de cada semana. */
export default function DemoSemana2() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <Link href="/" className="text-sm text-text-muted transition hover:text-text">
        ClosetAI
      </Link>

      <h1 className="mt-8 font-display text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
        Semana 2 · ¿El problema es real?
      </h1>
      <p className="mt-4 max-w-xl text-lg leading-relaxed text-text-muted text-pretty">
        Recorrido de 2:30 por <code className="text-text">/research</code> en producción: cada dato con su
        fuente, una pregunta respondida en vivo y una conversación real.
      </p>

      <video
        controls
        preload="metadata"
        playsInline
        className="mt-8 w-full rounded-lg border border-border bg-black"
      >
        <source src="/semana-2-research.mp4" type="video/mp4" />
        Tu navegador no puede reproducir video.{" "}
        <a href="/semana-2-research.mp4" className="underline">
          Descarga el archivo
        </a>
        .
      </video>

      <h2 className="mt-12 font-display text-2xl font-semibold tracking-tight">Qué muestra</h2>
      <ul className="mt-4 space-y-2 text-text-muted">
        {[
          "La página pública /research, sin cuenta",
          "El panel de resumen, calculado desde la base de datos",
          "Una pregunta en vivo y un informe que solo cita fuentes verificadas",
          "Los 5 referentes globales y la sección de México",
          "La tabla de competidores y sustitutos, con filtro y búsqueda sin acentos",
          "El mapa de riesgos, cada uno con su evidencia",
          "La conversación real de validación, sin nombre y con permiso",
          "Lo que se descartó por no poder verificarse, y el historial en GitHub",
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
        <Link href="/demo/semana-1" className="underline underline-offset-4">
          Ver el video de la Semana 1
        </Link>{" "}
        ·{" "}
        <a href="/semana-2-research.mp4" download className="underline underline-offset-4">
          Descargar este video
        </a>
      </p>
    </main>
  );
}

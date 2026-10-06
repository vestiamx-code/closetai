import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Video demo · Semana 3 · ClosetAI",
  description:
    "Recorrido de 2:19 por /product y /pricing: el mapa de funciones de ClosetAI y el simulador de ingresos, con cada supuesto marcado como verificado o no.",
};

/** Video de la Semana 3, con su propio enlace estable, como el de cada semana. */
export default function DemoSemana3() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <Link href="/" className="text-sm text-text-muted transition hover:text-text">
        ClosetAI
      </Link>

      <h1 className="mt-8 font-display text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
        Semana 3 · ¿Cuánto cuesta y cuánto deja?
      </h1>
      <p className="mt-4 max-w-xl text-lg leading-relaxed text-text-muted text-pretty">
        Recorrido de 2:19 por <code className="text-text">/product</code> y{" "}
        <code className="text-text">/pricing</code> en producción: qué hace ClosetAI función por función, y
        un simulador donde cada supuesto dice de dónde salió.
      </p>

      <video
        controls
        preload="metadata"
        playsInline
        className="mt-8 w-full rounded-lg border border-border bg-black"
      >
        <source src="/semana-3-pricing.mp4" type="video/mp4" />
        Tu navegador no puede reproducir video.{" "}
        <a href="/semana-3-pricing.mp4" className="underline">
          Descarga el archivo
        </a>
        .
      </video>

      <h2 className="mt-12 font-display text-2xl font-semibold tracking-tight">Qué muestra</h2>
      <ul className="mt-4 space-y-2 text-text-muted">
        {[
          "El mapa de funciones: 12 en vivo, 2 de esta semana y 2 que todavía no existen",
          "Los tres planes, cada uno con lo que nos cuesta servirlo",
          "El simulador, con los dos segmentos por separado",
          "Un supuesto movido en vivo, y el ingreso cambiando con él",
          "Los tres escenarios comparados: 1,449 · 3,217 · 6,958 pesos al mes",
          "La tabla de supuestos, donde lo verificado y lo supuesto no se mezclan",
          "Guardar un escenario: lo que se guarda es lo que calcula el servidor",
          "Los escenarios guardados, públicos y sin cuenta, y el historial en GitHub",
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
        <Link href="/demo/semana-2" className="underline underline-offset-4">
          Ver el video de la Semana 2
        </Link>{" "}
        ·{" "}
        <a href="/semana-3-pricing.mp4" download className="underline underline-offset-4">
          Descargar este video
        </a>
      </p>
    </main>
  );
}

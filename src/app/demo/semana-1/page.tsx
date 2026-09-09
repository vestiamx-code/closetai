import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Video demo · Semana 1 · ClosetAI",
  description:
    "Recorrido de 2:59 por /core, el núcleo de estilo: un módulo generativo público que funciona sin cuenta y sin subir fotos.",
};

/**
 * Video de la Semana 1, en página aparte del de la Semana 0 para que cada
 * entrega tenga su propio enlace estable.
 */
export default function DemoSemana1() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <Link href="/" className="text-sm text-text-muted transition hover:text-text">
        ClosetAI
      </Link>

      <h1 className="mt-8 font-display text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
        Semana 1 · El núcleo de estilo
      </h1>
      <p className="mt-4 max-w-xl text-lg leading-relaxed text-text-muted text-pretty">
        Recorrido de 2:59 por <code className="text-text">/core</code> en producción — sin cuenta,
        sin subir fotos y sin nada simulado.
      </p>

      <video
        controls
        preload="metadata"
        playsInline
        className="mt-8 w-full rounded-lg border border-border bg-black"
      >
        <source src="/semana-1-core.mp4" type="video/mp4" />
        Tu navegador no puede reproducir video.{" "}
        <a href="/semana-1-core.mp4" className="underline">
          Descarga el archivo
        </a>
        .
      </video>

      <h2 className="mt-12 font-display text-2xl font-semibold tracking-tight">Qué muestra</h2>
      <ul className="mt-4 space-y-2 text-text-muted">
        {[
          "El problema: la app pedía fotografiar diez prendas antes de dar nada",
          "/core abriéndose en el dominio propio, sin sesión iniciada",
          "Un texto escrito en palabras normales, no en vocabulario de moda",
          "El núcleo estructurado: esencia, principios, paleta, siluetas, qué evitar y una regla",
          "El guardado, y la fila nueva en la tabla core_outputs de Supabase",
          "La lista pública, que muestra el núcleo pero nunca lo que la persona escribió",
          "La prueba que importa: con un texto vago, el módulo admite que no sabe",
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
        <Link href="/demo" className="underline underline-offset-4">
          Ver el video de la Semana 0
        </Link>{" "}
        ·{" "}
        <a href="/semana-1-core.mp4" download className="underline underline-offset-4">
          Descargar este video
        </a>
      </p>
    </main>
  );
}

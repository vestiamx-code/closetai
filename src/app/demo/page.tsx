import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Video demo · ClosetAI",
  description:
    "Recorrido de 2:33 por ClosetAI funcionando en producción: clóset catalogado con IA, estilista, prueba virtual y pagos.",
};

/**
 * Página pública del video demo, para poder entregar un enlace en vez de un
 * archivo. Vive en el dominio propio a propósito: no depende de una cuenta de
 * terceros que pueda caducar o cambiar de política.
 */
export default function Demo() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <Link href="/" className="text-sm text-text-muted transition hover:text-text">
        ClosetAI
      </Link>

      <h1 className="mt-8 font-display text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
        Video demo
      </h1>
      <p className="mt-4 max-w-xl text-lg leading-relaxed text-text-muted text-pretty">
        Recorrido de 2:33 por ClosetAI funcionando en producción — no en una
        computadora local, y sin nada simulado.
      </p>

      <video
        controls
        preload="metadata"
        playsInline
        className="mt-8 w-full rounded-lg border border-border bg-black"
      >
        <source src="/demo.mp4" type="video/mp4" />
        Tu navegador no puede reproducir video.{" "}
        <a href="/demo.mp4" className="underline">
          Descarga el archivo
        </a>
        .
      </video>

      <h2 className="mt-12 font-display text-2xl font-semibold tracking-tight">Qué muestra</h2>
      <ul className="mt-4 space-y-2 text-text-muted">
        {[
          "El sitio en vivo en el dominio propio, closetai.lat",
          "Rutas privadas protegidas: sin sesión te manda a iniciar sesión",
          "El clóset, con cada prenda catalogada por IA desde una sola foto",
          "El estilista armando tres outfits con la ropa que ya existe, con su razón y el clima real",
          "Rechazar un outfit y que quede registrado con motivo",
          "Qué ha aprendido de ti — y que diga que todavía no te conoce en vez de inventarlo",
          "Prueba virtual sobre una foto base real",
          "Un pago real de Stripe con los créditos abonados",
          "El repositorio público con el historial de commits y el CI en verde",
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
        La narración es una voz sintetizada en español de México.{" "}
        <a href="/demo.mp4" download className="underline underline-offset-4">
          Descargar el video
        </a>
      </p>
    </main>
  );
}

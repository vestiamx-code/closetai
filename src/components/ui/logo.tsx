import Image from "next/image";

/**
 * Tamara's logo, "CLOSET AI", in one line for headers (chosen Oct 29, 2026).
 * The files come from her logo: docs/evidencia/marca/derivar-logo.py. Dark mode
 * gets lighter letters, because brown on near-black can't be read.
 */
export function Logo({ alto = 38, prioridad = false }: { alto?: number; prioridad?: boolean }) {
  // The files are 471 × 120.
  const ancho = Math.round((alto * 471) / 120);
  return (
    <>
      <Image
        src="/marca/logo-horizontal.png"
        alt="ClosetAI"
        width={ancho}
        height={alto}
        priority={prioridad}
        className="block dark:hidden"
      />
      <Image
        src="/marca/logo-horizontal-oscuro.png"
        alt="ClosetAI"
        width={ancho}
        height={alto}
        priority={prioridad}
        className="hidden dark:block"
      />
    </>
  );
}

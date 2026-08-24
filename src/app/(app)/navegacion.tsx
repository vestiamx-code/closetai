"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Navegación de la app, en dos formas.
 *
 * En escritorio, enlaces en el encabezado. En el teléfono no caben: con seis
 * secciones, "Tu estilo" se partía en dos líneas y "Salir" se salía de la
 * pantalla. Y esto es una app de teléfono antes que nada.
 *
 * Abajo va una barra fija, que además queda al alcance del pulgar. El precio es
 * que tapa el final de la página, así que el layout reserva ese espacio.
 */
const ENLACES = [
  { href: "/hoy", texto: "Hoy", icono: SolIcono },
  { href: "/closet", texto: "Clóset", icono: PerchaIcono },
  { href: "/probar", texto: "Probar", icono: EspejoIcono },
  { href: "/estilo", texto: "Estilo", icono: EstrellaIcono },
  { href: "/perfil", texto: "Perfil", icono: PersonaIcono },
];

function esActivo(ruta: string, href: string) {
  // `/closet/subir` y `/closet/[id]` también son el clóset.
  return ruta === href || ruta.startsWith(`${href}/`);
}

/** Enlaces del encabezado. Se ocultan en móvil: ahí manda la barra de abajo. */
export function NavegacionEscritorio() {
  const ruta = usePathname();

  return (
    <div className="hidden items-center gap-5 text-sm sm:flex">
      {ENLACES.map(({ href, texto }) => {
        const activo = esActivo(ruta, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={activo ? "page" : undefined}
            className={
              activo
                ? "relative text-text after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-full after:bg-text after:content-['']"
                : "text-text-muted transition hover:text-text"
            }
          >
            {texto === "Estilo" ? "Tu estilo" : texto}
          </Link>
        );
      })}
    </div>
  );
}

/** Barra inferior fija. Solo en teléfono. */
export function NavegacionMovil() {
  const ruta = usePathname();

  return (
    <nav
      aria-label="Secciones"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-bg/95 backdrop-blur sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-5">
        {ENLACES.map(({ href, texto, icono: Icono }) => {
          const activo = esActivo(ruta, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={activo ? "page" : undefined}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] transition ${
                  activo ? "text-text" : "text-text-muted"
                }`}
              >
                <Icono activo={activo} />
                {texto}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/* Iconos: trazo simple, 20px, para que se lean a tamaño chico. */
type P = { activo: boolean };
const base = "h-5 w-5";
const trazo = (activo: boolean) => (activo ? 1.9 : 1.5);

function SolIcono({ activo }: P) {
  return (
    <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={trazo(activo)} strokeLinecap="round" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}
function PerchaIcono({ activo }: P) {
  return (
    <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={trazo(activo)} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 8a2.2 2.2 0 1 1 2.2-2.2" />
      <path d="M12 8v2.5L3.5 16.4a1.3 1.3 0 0 0 .75 2.35h15.5a1.3 1.3 0 0 0 .75-2.35L12 10.5" />
    </svg>
  );
}
function EspejoIcono({ activo }: P) {
  return (
    <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={trazo(activo)} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="5" y="2.5" width="14" height="15" rx="7" />
      <path d="M12 17.5V21M9 21h6" />
    </svg>
  );
}
function EstrellaIcono({ activo }: P) {
  return (
    <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={trazo(activo)} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3.5l2.6 5.3 5.9.85-4.25 4.15 1 5.85L12 16.9l-5.25 2.75 1-5.85L3.5 9.65l5.9-.85z" />
    </svg>
  );
}
function PersonaIcono({ activo }: P) {
  return (
    <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={trazo(activo)} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </svg>
  );
}

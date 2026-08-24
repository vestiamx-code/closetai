"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Enlaces del encabezado, marcando dónde estás.
 *
 * Es client component solo por eso: `usePathname` necesita el navegador. Sin la
 * marca, las seis secciones se ven idénticas y hay que leer la URL para saber
 * dónde estás parada.
 */
const ENLACES = [
  { href: "/hoy", texto: "Hoy" },
  { href: "/closet", texto: "Clóset" },
  { href: "/probar", texto: "Probar" },
  { href: "/estilo", texto: "Tu estilo" },
  { href: "/perfil", texto: "Perfil" },
];

export function Navegacion() {
  const ruta = usePathname();

  return (
    <>
      {ENLACES.map(({ href, texto }) => {
        // `/closet/subir` y `/closet/[id]` también son el clóset.
        const activo = ruta === href || ruta.startsWith(`${href}/`);
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
            {texto}
          </Link>
        );
      })}
    </>
  );
}

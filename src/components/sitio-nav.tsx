"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Logo } from "@/components/ui/logo";

/**
 * The public site's one header (Week 6).
 *
 * Until now every public page linked only back to the homepage: six modules,
 * six islands. This header reaches all of them from anywhere.
 *
 * Ten links don't fit on a phone, so below `xl` they fold into a <details>
 * "Menu": it opens and closes without JavaScript. Its `key` is the route, so
 * it starts closed again on every page you go to.
 */
export const SECCIONES_PUBLICAS = [
  { href: "/product", texto: "Product" },
  { href: "/research", texto: "Research" },
  { href: "/core", texto: "Style core" },
  { href: "/pricing", texto: "Pricing" },
  { href: "/marketing", texto: "Marketing" },
  { href: "/chat", texto: "Chat" },
  { href: "/dashboard", texto: "Dashboard" },
  { href: "/docs", texto: "Docs" },
  { href: "/demo", texto: "Demo" },
] as const;

function esActivo(ruta: string, href: string) {
  return ruta === href || ruta.startsWith(`${href}/`);
}

export function SitioNav({
  ancho = "max-w-6xl",
  sobreFoto = false,
  prioridad = false,
}: {
  /** The page's own column width, so the header lines up with it. */
  ancho?: string;
  /** On the homepage the header sits on a photo and needs the text halo. */
  sobreFoto?: boolean;
  prioridad?: boolean;
}) {
  const ruta = usePathname();
  const halo = sobreFoto ? "sobre-foto" : "";

  return (
    <header className={`relative z-30 mx-auto flex w-full ${ancho} items-center justify-between gap-4 px-6 py-6`}>
      <Link href="/" aria-label="ClosetAI, home" className="shrink-0">
        <Logo prioridad={prioridad} />
      </Link>

      <nav aria-label="Main" className="hidden items-center gap-0.5 xl:flex" data-testid="nav-escritorio">
        {SECCIONES_PUBLICAS.map(({ href, texto }) => {
          const activo = esActivo(ruta, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={activo ? "page" : undefined}
              className={`${halo} rounded-full px-3 py-2 text-sm transition ${
                activo ? "font-medium text-text underline underline-offset-8" : "text-text/75 hover:text-text"
              }`}
            >
              {texto}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-2">
        <Link
          href="/sign-in"
          className="shrink-0 rounded-full border border-border bg-bg/60 px-5 py-2 text-sm transition hover:border-text"
        >
          Sign in
        </Link>

        <details key={ruta} className="group relative xl:hidden" data-testid="nav-movil">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-full border border-border bg-bg/60 px-4 py-2 text-sm [&::-webkit-details-marker]:hidden">
            Menu
            <span aria-hidden className="text-xs transition group-open:rotate-180">
              ▾
            </span>
          </summary>
          <nav
            aria-label="Main"
            className="absolute right-0 mt-2 w-56 rounded-2xl border border-border bg-bg p-2 shadow-lg"
          >
            <ul>
              {SECCIONES_PUBLICAS.map(({ href, texto }) => {
                const activo = esActivo(ruta, href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={activo ? "page" : undefined}
                      className={`block rounded-xl px-4 py-2.5 text-sm transition hover:bg-surface ${
                        activo ? "font-medium text-text" : "text-text-muted"
                      }`}
                    >
                      {texto}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </details>
      </div>
    </header>
  );
}

import Link from "next/link";

import { NavegacionEscritorio, NavegacionMovil } from "./navegacion";

import { salir } from "@/app/(auth)/actions";
import { requireUser } from "@/lib/auth";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  await requireUser();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-bg/85 backdrop-blur">
        <nav className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/closet" className="font-display text-lg font-semibold tracking-tight">
            ClosetAI
          </Link>
          <div className="flex items-center gap-5 text-sm">
            <NavegacionEscritorio />
            <form action={salir}>
              <button type="submit" className="text-text-muted transition hover:text-text">
                Salir
              </button>
            </form>
          </div>
        </nav>
      </header>
      <main className="flex-1">{children}</main>

      {/*
        Ancla la página. Sin él, las secciones cortas —Comprar, Tu estilo,
        Perfil— dejaban media pantalla en blanco y se veían a medio terminar.
        Y el aviso de privacidad hoy solo se alcanzaba desde la portada: si
        tratamos fotos del cuerpo como dato sensible, tiene que estar a mano
        desde dentro de la app, no solo desde fuera.
      */}
      <footer className="mt-16 border-t border-border pb-[calc(env(safe-area-inset-bottom)+4.5rem)] sm:pb-0">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-6 py-6 text-xs text-text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>Tu clóset es gratis e ilimitado. Tus fotos son tuyas y las puedes borrar.</p>
          <Link href="/privacidad" className="underline underline-offset-4 transition hover:text-text">
            Aviso de privacidad
          </Link>
        </div>
      </footer>

      <NavegacionMovil />
    </div>
  );
}

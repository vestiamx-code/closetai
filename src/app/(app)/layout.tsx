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
                Sign out
              </button>
            </form>
          </div>
        </nav>
      </header>
      <main className="flex-1">{children}</main>

      {/*
        Anchors the page. Without it, the short sections —Shop, Your style,
        Profile— left half the screen blank and looked unfinished.
        And the privacy notice was only reachable from the homepage: if we
        treat body photos as sensitive data, it has to be at hand from
        inside the app, not only from outside.
      */}
      <footer className="mt-16 border-t border-border pb-[calc(env(safe-area-inset-bottom)+4.5rem)] sm:pb-0">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-6 py-6 text-xs text-text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>Your closet is free and unlimited. Your photos are yours and you can delete them.</p>
          <Link href="/privacidad" className="underline underline-offset-4 transition hover:text-text">
            Privacy notice
          </Link>
        </div>
      </footer>

      <NavegacionMovil />
    </div>
  );
}

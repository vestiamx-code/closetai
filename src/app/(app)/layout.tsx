import Link from "next/link";

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
            <Link href="/closet" className="text-text-muted transition hover:text-text">
              Mi clóset
            </Link>
            <Link href="/perfil" className="text-text-muted transition hover:text-text">
              Perfil
            </Link>
            <form action={salir}>
              <button type="submit" className="text-text-muted transition hover:text-text">
                Salir
              </button>
            </form>
          </div>
        </nav>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}

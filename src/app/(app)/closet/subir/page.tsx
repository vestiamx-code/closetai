import type { Metadata } from "next";
import Link from "next/link";

import { Subidor } from "./subidor";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Agregar prendas" };

export default async function SubirPage() {
  const user = await requireUser();

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <Link href="/closet" className="text-sm text-text-muted underline underline-offset-4">
        ← Volver al clóset
      </Link>

      <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        Agregar prendas
      </h1>
      <p className="mt-2 leading-relaxed text-text-muted text-pretty">
        Toma la foto sobre un fondo liso y con buena luz. La IA reconoce la prenda, sus colores y
        cuándo ponértela — tú solo confirmas.
      </p>

      <Subidor userId={user.id} />

      <div className="mt-10 rounded-xl border border-border bg-surface p-5">
        <h2 className="font-display text-lg font-semibold">Para que salgan bien</h2>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-text-muted">
          <li>· Una prenda por foto, extendida o colgada.</li>
          <li>· Fondo liso: una pared, la cama, el piso.</li>
          <li>· Luz de día si se puede. La luz amarilla cambia los colores.</li>
          <li>· No importa si la foto sale pesada: se comprime sola antes de subir.</li>
        </ul>
      </div>
    </div>
  );
}

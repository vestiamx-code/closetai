import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Revisa tu correo" };

export default function RevisaTuCorreoPage() {
  return (
    <div className="text-center">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Revisa tu correo</h1>
      <p className="mt-4 leading-relaxed text-text-muted text-pretty">
        Te mandamos un enlace para confirmar tu cuenta. Ábrelo desde este mismo dispositivo y
        entras directo a tu clóset.
      </p>
      <p className="mt-6 text-sm text-text-muted">
        Si no llega en unos minutos, revisa tu carpeta de spam.
      </p>
      <p className="mt-8 text-sm">
        <Link href="/entrar" className="text-accent underline underline-offset-4">
          Volver a entrar
        </Link>
      </p>
    </div>
  );
}

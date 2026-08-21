import type { Metadata } from "next";
import Link from "next/link";

import { FormularioRecuperar } from "./formulario";

export const metadata: Metadata = { title: "Recuperar contraseña" };

export default function RecuperarPage() {
  return (
    <>
      <h1 className="font-display text-3xl font-semibold tracking-tight">Recuperar tu cuenta</h1>
      <p className="mt-2 text-text-muted">Te mandamos un enlace para poner una contraseña nueva.</p>
      <FormularioRecuperar />
      <p className="mt-6 text-center text-sm">
        <Link href="/entrar" className="text-text-muted underline underline-offset-4">
          Volver
        </Link>
      </p>
    </>
  );
}

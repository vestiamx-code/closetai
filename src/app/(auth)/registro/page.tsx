import type { Metadata } from "next";
import Link from "next/link";

import { FormularioRegistro } from "./formulario";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function RegistroPage() {
  return (
    <>
      <h1 className="font-display text-3xl font-semibold tracking-tight">Arma tu clóset</h1>
      <p className="mt-2 text-text-muted">
        Gratis, e ilimitado. Nunca te vamos a cobrar por ver tu propia ropa.
      </p>
      <FormularioRegistro />
      <p className="mt-6 text-center text-sm text-text-muted">
        ¿Ya tienes cuenta?{" "}
        <Link href="/entrar" className="text-accent underline underline-offset-4">
          Entrar
        </Link>
      </p>
    </>
  );
}

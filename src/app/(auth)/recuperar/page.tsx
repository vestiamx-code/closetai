import type { Metadata } from "next";
import Link from "next/link";

import { FormularioRecuperar } from "./formulario";

export const metadata: Metadata = { title: "Reset password" };

export default function RecuperarPage() {
  return (
    <>
      <h1 className="font-display text-3xl font-semibold tracking-tight">Recover your account</h1>
      <p className="mt-2 text-text-muted">We’ll send you a link to set a new password.</p>
      <FormularioRecuperar />
      <p className="mt-6 text-center text-sm">
        <Link href="/entrar" className="text-text-muted underline underline-offset-4">
          Back
        </Link>
      </p>
    </>
  );
}

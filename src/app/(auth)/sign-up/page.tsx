import type { Metadata } from "next";
import Link from "next/link";

import { FormularioRegistro } from "./formulario";

export const metadata: Metadata = { title: "Create account" };

export default function RegistroPage() {
  return (
    <>
      <h1 className="font-display text-3xl font-semibold tracking-tight">Build your closet</h1>
      <p className="mt-2 text-text-muted">
        Free and unlimited. We will never charge you to see your own clothes.
      </p>
      <FormularioRegistro />
      <p className="mt-6 text-center text-sm text-text-muted">
        Already have an account?{" "}
        <Link href="/sign-in" className="text-accent underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </>
  );
}

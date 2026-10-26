import type { Metadata } from "next";

import { FormularioNuevaContrasena } from "./formulario";

export const metadata: Metadata = { title: "New password" };

export default function NuevaContrasenaPage() {
  return (
    <>
      <h1 className="font-display text-3xl font-semibold tracking-tight">New password</h1>
      <p className="mt-2 text-text-muted">Enter the one you’ll use from now on.</p>
      <FormularioNuevaContrasena />
    </>
  );
}

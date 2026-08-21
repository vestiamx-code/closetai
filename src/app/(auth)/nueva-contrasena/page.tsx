import type { Metadata } from "next";

import { FormularioNuevaContrasena } from "./formulario";

export const metadata: Metadata = { title: "Nueva contraseña" };

export default function NuevaContrasenaPage() {
  return (
    <>
      <h1 className="font-display text-3xl font-semibold tracking-tight">Nueva contraseña</h1>
      <p className="mt-2 text-text-muted">Escribe la que vas a usar de ahora en adelante.</p>
      <FormularioNuevaContrasena />
    </>
  );
}

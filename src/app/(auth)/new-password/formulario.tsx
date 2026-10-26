"use client";

import { useActionState } from "react";

import { cambiarContrasena, type EstadoFormulario } from "../actions";
import { Aviso } from "@/components/ui/aviso";
import { Boton } from "@/components/ui/boton";
import { Campo } from "@/components/ui/campo";

export function FormularioNuevaContrasena() {
  const [estado, accion] = useActionState<EstadoFormulario, FormData>(cambiarContrasena, {});

  return (
    <form action={accion} className="mt-8 space-y-4">
      {estado.error ? <Aviso>{estado.error}</Aviso> : null}
      <Campo
        etiqueta="New password"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        ayuda="At least 8 characters."
        required
      />
      <Boton cargando="Saving…">Save</Boton>
    </form>
  );
}

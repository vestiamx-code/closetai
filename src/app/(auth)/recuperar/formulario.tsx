"use client";

import { useActionState } from "react";

import { pedirRecuperacion, type EstadoFormulario } from "../actions";
import { Aviso } from "@/components/ui/aviso";
import { Boton } from "@/components/ui/boton";
import { Campo } from "@/components/ui/campo";

export function FormularioRecuperar() {
  const [estado, accion] = useActionState<EstadoFormulario, FormData>(pedirRecuperacion, {});

  if (estado.aviso) {
    return (
      <div className="mt-8">
        <Aviso tipo="info">{estado.aviso}</Aviso>
      </div>
    );
  }

  return (
    <form action={accion} className="mt-8 space-y-4">
      {estado.error ? <Aviso>{estado.error}</Aviso> : null}
      <Campo etiqueta="Correo" name="email" type="email" autoComplete="email" required />
      <Boton cargando="Enviando…">Mandar enlace</Boton>
    </form>
  );
}

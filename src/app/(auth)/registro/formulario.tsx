"use client";

import { useActionState } from "react";

import { registrarse, type EstadoFormulario } from "../actions";
import { Aviso } from "@/components/ui/aviso";
import { Boton } from "@/components/ui/boton";
import { Campo } from "@/components/ui/campo";

export function FormularioRegistro() {
  const [estado, accion] = useActionState<EstadoFormulario, FormData>(registrarse, {});

  return (
    <form action={accion} className="mt-8 space-y-4">
      {estado.error ? <Aviso>{estado.error}</Aviso> : null}

      <Campo etiqueta="Tu nombre" name="nombre" autoComplete="given-name" placeholder="Tamara" required />
      <Campo
        etiqueta="Correo"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="tu@correo.com"
        required
      />
      <Campo
        etiqueta="Contraseña"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        ayuda="Mínimo 8 caracteres."
        required
      />

      <Boton cargando="Creando tu cuenta…">Crear cuenta</Boton>
    </form>
  );
}

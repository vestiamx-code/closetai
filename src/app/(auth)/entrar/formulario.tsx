"use client";

import Link from "next/link";
import { useActionState } from "react";

import { entrar, type EstadoFormulario } from "../actions";
import { Aviso } from "@/components/ui/aviso";
import { Boton } from "@/components/ui/boton";
import { Campo } from "@/components/ui/campo";

export function FormularioEntrar({
  destino,
  errorEnlace,
}: {
  destino?: string;
  errorEnlace?: string;
}) {
  const [estado, accion] = useActionState<EstadoFormulario, FormData>(entrar, {});

  return (
    <form action={accion} className="mt-8 space-y-4">
      {errorEnlace ? <Aviso>{errorEnlace}</Aviso> : null}
      {estado.error ? <Aviso>{estado.error}</Aviso> : null}

      {destino ? <input type="hidden" name="destino" value={destino} /> : null}

      <Campo
        etiqueta="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@email.com"
        required
      />
      <Campo
        etiqueta="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
      />

      <Boton cargando="Signing in…">Sign in</Boton>

      <p className="text-center text-sm">
        <Link href="/recuperar" className="text-text-muted underline underline-offset-4">
          I forgot my password
        </Link>
      </p>
    </form>
  );
}

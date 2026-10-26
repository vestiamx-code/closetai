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

      <Campo etiqueta="Your name" name="nombre" autoComplete="given-name" placeholder="Tamara" required />
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
        autoComplete="new-password"
        minLength={8}
        ayuda="At least 8 characters."
        required
      />

      <label className="flex gap-3 text-sm leading-relaxed text-text-muted">
        <input
          type="checkbox"
          name="consentimiento"
          required
          className="mt-0.5 size-4 shrink-0 accent-[var(--accent)]"
        />
        <span className="text-pretty">
          I understand how ClosetAI uses my photos and I accept the{" "}
          <a
            href="/privacy"
            target="_blank"
            className="text-accent underline underline-offset-4"
          >
            privacy notice
          </a>
          .
        </span>
      </label>

      <Boton cargando="Creating your account…">Create account</Boton>
    </form>
  );
}

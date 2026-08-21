import type { Metadata } from "next";
import Link from "next/link";

import { FormularioEntrar } from "./formulario";

export const metadata: Metadata = { title: "Entrar" };

const ERRORES: Record<string, string> = {
  "enlace-invalido": "Ese enlace no es válido. Pide uno nuevo.",
  "enlace-expirado": "El enlace expiró. Pide uno nuevo.",
};

export default async function EntrarPage({ searchParams }: PageProps<"/entrar">) {
  const params = await searchParams;
  const destino = typeof params.destino === "string" ? params.destino : undefined;
  const errorEnlace = typeof params.error === "string" ? ERRORES[params.error] : undefined;

  return (
    <>
      <h1 className="font-display text-3xl font-semibold tracking-tight">Qué bueno verte</h1>
      <p className="mt-2 text-text-muted">Entra a tu clóset.</p>
      <FormularioEntrar destino={destino} errorEnlace={errorEnlace} />
      <p className="mt-6 text-center text-sm text-text-muted">
        ¿Todavía no tienes cuenta?{" "}
        <Link href="/registro" className="text-accent underline underline-offset-4">
          Crear una
        </Link>
      </p>
    </>
  );
}

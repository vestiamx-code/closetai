import type { Metadata } from "next";
import Link from "next/link";

import { FormularioEntrar } from "./formulario";

export const metadata: Metadata = { title: "Sign in" };

const ERRORES: Record<string, string> = {
  "enlace-invalido": "That link isn't valid. Ask for a new one.",
  "enlace-expirado": "The link expired. Ask for a new one.",
};

export default async function EntrarPage({ searchParams }: PageProps<"/sign-in">) {
  const params = await searchParams;
  const destino = typeof params.destino === "string" ? params.destino : undefined;
  const errorEnlace = typeof params.error === "string" ? ERRORES[params.error] : undefined;

  return (
    <>
      <h1 className="font-display text-3xl font-semibold tracking-tight">Good to see you</h1>
      <p className="mt-2 text-text-muted">Sign in to your closet.</p>
      <FormularioEntrar destino={destino} errorEnlace={errorEnlace} />
      <p className="mt-6 text-center text-sm text-text-muted">
        Don’t have an account yet?{" "}
        <Link href="/sign-up" className="text-accent underline underline-offset-4">
          Create one
        </Link>
      </p>
    </>
  );
}

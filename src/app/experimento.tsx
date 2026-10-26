"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import { EXPERIMENTO, type Variante } from "@/lib/ab";

import { registrarEvento } from "./acciones-ab";

const DURACION_COOKIE = 60 * 60 * 24 * 365;

/**
 * The part of the experiment that lives in the browser: remember the visitor and
 * report that they saw the homepage.
 *
 * The variant already arrived chosen from the server, so the headline does not
 * flicker. All this does is save the cookie the first time —so they see the same
 * one when they come back— and record the view once.
 */
export function Experimento({
  visitante,
  variante,
  nuevo,
}: {
  visitante: string;
  variante: Variante;
  nuevo: boolean;
}) {
  const registrado = useRef(false);

  useEffect(() => {
    // In development React mounts twice; without this the view would be sent twice.
    // It doesn't happen in production, and the database only accepts one per visitor anyway.
    if (registrado.current) return;
    registrado.current = true;

    if (nuevo) {
      const seguro = location.protocol === "https:" ? "; Secure" : "";
      document.cookie = `cai_visitante=${visitante}; Max-Age=${DURACION_COOKIE}; Path=/; SameSite=Lax${seguro}`;
    }
    void registrarEvento({ experimento: EXPERIMENTO, variante, visitante, evento: "vista" });
  }, [visitante, variante, nuevo]);

  return null;
}

/** The button the experiment measures: "Start for free". */
export function BotonEmpezar({
  visitante,
  variante,
  className,
  children,
}: {
  visitante: string;
  variante: Variante;
  className: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href="/registro"
      data-cta="empezar"
      onClick={() => void registrarEvento({ experimento: EXPERIMENTO, variante, visitante, evento: "clic" })}
      className={className}
    >
      {children}
    </Link>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import type { Variante } from "@/lib/ab";

import { registrarEvento } from "./acciones-ab";

const DURACION_COOKIE = 60 * 60 * 24 * 365;

/**
 * La parte del experimento que vive en el navegador: recordar al visitante y
 * avisar que vio la portada.
 *
 * La variante ya llegó elegida desde el servidor, así que el titular no
 * parpadea. Lo único que hace esto es guardar la cookie la primera vez —para que
 * al volver vea la misma— y registrar la vista una sola vez.
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
    // En desarrollo React monta dos veces; sin esto la vista se mandaría doble.
    // En producción no pasa, y de todos modos la base solo acepta una por visitante.
    if (registrado.current) return;
    registrado.current = true;

    if (nuevo) {
      const seguro = location.protocol === "https:" ? "; Secure" : "";
      document.cookie = `cai_visitante=${visitante}; Max-Age=${DURACION_COOKIE}; Path=/; SameSite=Lax${seguro}`;
    }
    void registrarEvento({ experimento: "titular", variante, visitante, evento: "vista" });
  }, [visitante, variante, nuevo]);

  return null;
}

/** El botón que mide el experimento: «Empezar gratis». */
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
      onClick={() => void registrarEvento({ experimento: "titular", variante, visitante, evento: "clic" })}
      className={className}
    >
      {children}
    </Link>
  );
}

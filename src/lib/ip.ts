import "server-only";

import { createHash } from "node:crypto";
import { headers } from "next/headers";

/**
 * La huella de quien pide, para los límites de las páginas públicas.
 *
 * Las páginas sin cuenta —`/core`, `/research`, `/pricing`— se defienden
 * contando peticiones por IP. Para eso basta con **distinguir** una IP de otra:
 * no hace falta saber cuál es. Hasta la Semana 3 se guardaba entera y sin fecha
 * de borrado, que es justo lo que no se debe hacer con un dato que identifica a
 * una persona; desde aquí se guarda su hash con sal.
 *
 * La sal es una llave que ya vive en el entorno. Sin sal, hashear una IP no
 * serviría de nada: solo hay unos miles de millones y se pueden probar todas.
 */

export async function ipDeQuienPide(): Promise<string> {
  const h = await headers();
  // Detrás del proxy de Vercel la IP real llega en x-forwarded-for.
  return (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || "desconocida";
}

export function huellaDeIp(ip: string): string {
  const sal = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "sin-sal";
  return createHash("sha256").update(`${sal}:${ip}`).digest("hex");
}

/** La huella de quien está pidiendo esta petición, en un solo paso. */
export async function huellaDeQuienPide(): Promise<string> {
  return huellaDeIp(await ipDeQuienPide());
}

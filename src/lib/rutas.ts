/** Routes that need a signed-in session (the proxy sends anyone else to /sign-in). */
export const RUTAS_PRIVADAS = ["/closet", "/today", "/style", "/profile", "/try-on", "/buy", "/admin"];

export function esPrivada(ruta: string): boolean {
  return RUTAS_PRIVADAS.some((r) => ruta === r || ruta.startsWith(`${r}/`));
}

/**
 * `prefetch` for a link from a public page. A private route is never
 * prefetched: for a visitor without a session the proxy redirects the prefetch
 * to /sign-in, and that request stayed open (found by the Week 6 regression).
 */
export const precarga = (ruta: string) => (esPrivada(ruta) ? false : undefined);

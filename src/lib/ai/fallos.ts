/**
 * ¿El error viene del proveedor y no de lo que escribió la persona?
 *
 * Hay dos formas distintas de "Google no pudo", y ninguna es culpa de quien usa
 * la página:
 *
 *   · cuota    — 429 · RESOURCE_EXHAUSTED. Nos pasamos del límite del nivel
 *                gratuito; Google dice cuánto esperar.
 *   · saturado — 503 · UNAVAILABLE. El modelo está sobrecargado ("high demand")
 *                para todo el mundo; pasa solo en segundos.
 *
 * Hasta la Semana 2 solo se reconocía la primera. Un 503 caía en el cajón de
 * "no pude armar un informe con esa pregunta, formúlala de otra forma", y la
 * página le pedía a la persona que cambiara una pregunta que estaba bien. Lo
 * encontró la prueba e2e de /research contra producción, el 14-sep-2026.
 */

export type FalloDelProveedor = "cuota" | "saturado";

export function clasificarFalloDelProveedor(texto: string): FalloDelProveedor | null {
  if (/\b429\b/.test(texto) || /\bRESOURCE_EXHAUSTED\b/.test(texto)) return "cuota";
  if (/\b503\b/.test(texto) || /\bUNAVAILABLE\b/.test(texto) || /high demand|overloaded/i.test(texto)) {
    return "saturado";
  }
  return null;
}

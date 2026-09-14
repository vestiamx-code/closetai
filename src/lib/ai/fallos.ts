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

/** ¿La llamada se canceló porque se acabó su tiempo máximo? */
export function esTiempoAgotado(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return error.name === "AbortError" || error.name === "TimeoutError" || /aborted|timed? ?out/i.test(error.message);
}

/**
 * Llama al modelo principal y, si el proveedor falla, al de respaldo.
 *
 * Medido el 14-sep-2026, con la misma petición mínima: `gemini-3.5-flash`
 * respondió 503, 503 y un 200 que tardó 86 segundos; `gemini-3.5-flash-lite`,
 * 200 en medio segundo tres veces seguidas. Reintentar el mismo modelo saturado
 * solo alarga la espera de quien está frente a la pantalla.
 *
 * Cada intento tiene un tiempo máximo. Solo se cambia de modelo cuando la falla
 * es del proveedor (cuota, saturación o tiempo agotado): si la petición está
 * mal, otro modelo no la arregla, y ocultarlo sería peor.
 *
 * Devuelve qué modelo contestó de verdad, para que quede registrado.
 */
export async function conModeloDeRespaldo<T>(
  modelos: { principal: string; respaldo: string },
  llamada: (modelo: string, senal: AbortSignal) => Promise<T>,
  tiempoMaximoMs = 25_000,
): Promise<{ resultado: T; modelo: string; usoRespaldo: boolean }> {
  try {
    const resultado = await llamada(modelos.principal, AbortSignal.timeout(tiempoMaximoMs));
    return { resultado, modelo: modelos.principal, usoRespaldo: false };
  } catch (error) {
    const texto = error instanceof Error ? error.message : String(error);
    const motivo = clasificarFalloDelProveedor(texto) ?? (esTiempoAgotado(error) ? "tiempo agotado" : null);
    if (!motivo) throw error;

    console.warn(`[gemini] ${modelos.principal} no respondió (${motivo}); se usa ${modelos.respaldo}`);
    const resultado = await llamada(modelos.respaldo, AbortSignal.timeout(tiempoMaximoMs));
    return { resultado, modelo: modelos.respaldo, usoRespaldo: true };
  }
}

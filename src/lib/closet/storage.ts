import "server-only";

import { createClient } from "@/lib/supabase/server";

/** Minutos que vive una URL firmada. Corto a propósito: son fotos privadas. */
const TTL_SEGUNDOS = 60 * 15;

/**
 * Convierte rutas de Storage en URLs firmadas.
 * Los buckets son privados: sin firma no hay imagen, ni siquiera con el enlace.
 */
export async function firmarRutas(
  bucket: string,
  rutas: string[],
): Promise<Map<string, string>> {
  const mapa = new Map<string, string>();
  const limpias = rutas.filter(Boolean);
  if (limpias.length === 0) return mapa;

  const supabase = await createClient();
  const { data } = await supabase.storage.from(bucket).createSignedUrls(limpias, TTL_SEGUNDOS);

  for (const item of data ?? []) {
    if (item.signedUrl && item.path) mapa.set(item.path, item.signedUrl);
  }
  return mapa;
}

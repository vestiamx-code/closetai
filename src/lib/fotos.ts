import type { Seccion } from "@/lib/chat";

/**
 * A photo for each garment in /chat, from Pexels (free, licensed for this use).
 *
 * Tester 1 wrote "I thought that pictures were included", and Tamara asked for
 * the same. Store photos can't be copied: they are the stores' images. These are
 * inspiration, similar and not the exact garment, and the page says so and
 * credits the photographer, as Pexels asks.
 *
 * A photo is a nice-to-have: without a key, on an error or when too slow, the
 * garment simply has no photo and the chat works as before.
 */
export type Foto = {
  url: string;
  alt: string;
  fotografo: string;
  fotografoUrl: string;
  paginaUrl: string;
};

const TIEMPO_MAXIMO_MS = 3_000;

const PALABRA_SECCION: Record<Seccion, string> = { mujer: "women", hombre: "men", ambas: "" };

/** The search text: the garment in English, in the person's section. */
export function textoDeBusqueda(prenda: string, seccion: Seccion | null): string {
  return [prenda, seccion ? PALABRA_SECCION[seccion] : "", "fashion"].filter(Boolean).join(" ");
}

export async function buscarFoto(prenda: string, seccion: Seccion | null): Promise<Foto | null> {
  const llave = process.env.PEXELS_API_KEY;
  if (!llave) return null;

  const q = encodeURIComponent(textoDeBusqueda(prenda, seccion));
  try {
    const r = await fetch(`https://api.pexels.com/v1/search?query=${q}&per_page=1&orientation=portrait`, {
      headers: { Authorization: llave },
      signal: AbortSignal.timeout(TIEMPO_MAXIMO_MS),
    });
    if (!r.ok) {
      console.warn(`[fotos] Pexels answered ${r.status}`);
      return null;
    }
    const datos = await r.json();
    const f = datos?.photos?.[0];
    if (!f?.src?.medium || !f.url) return null;
    return {
      url: f.src.medium,
      alt: f.alt || prenda,
      fotografo: f.photographer ?? "Pexels",
      fotografoUrl: f.photographer_url ?? f.url,
      paginaUrl: f.url,
    };
  } catch (error) {
    console.warn("[fotos] no photo", error instanceof Error ? error.name : error);
    return null;
  }
}

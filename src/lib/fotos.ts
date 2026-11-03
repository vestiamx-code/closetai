import type { Seccion } from "@/lib/chat";

/**
 * A photo for each garment in /chat, from Unsplash (free, licensed for this use).
 *
 * Tester 1 wrote "I thought that pictures were included", and Tamara asked for
 * the same. Store photos can't be copied: they are the stores' images. These are
 * inspiration, similar and not the exact garment, and the page says so. Unsplash
 * asks for three things, all done here and in the chat: the image is served from
 * its own address (hotlinked), the photographer is credited, and the credit links
 * back with these utm parameters. (Pexels was the first choice; it paused new keys.)
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
const UTM = "utm_source=closetai&utm_medium=referral";

const PALABRA_SECCION: Record<Seccion, string> = { mujer: "women", hombre: "men", ambas: "" };

/** The search text: the garment in English, in the person's section. */
export function textoDeBusqueda(prenda: string, seccion: Seccion | null): string {
  return [prenda, seccion ? PALABRA_SECCION[seccion] : "", "fashion"].filter(Boolean).join(" ");
}

export async function buscarFoto(prenda: string, seccion: Seccion | null): Promise<Foto | null> {
  const llave = process.env.UNSPLASH_ACCESS_KEY;
  if (!llave) return null;

  const q = encodeURIComponent(textoDeBusqueda(prenda, seccion));
  try {
    const r = await fetch(
      `https://api.unsplash.com/search/photos?query=${q}&per_page=1&orientation=portrait&content_filter=high`,
      { headers: { Authorization: `Client-ID ${llave}` }, signal: AbortSignal.timeout(TIEMPO_MAXIMO_MS) },
    );
    if (!r.ok) {
      console.warn(`[fotos] Unsplash answered ${r.status}`);
      return null;
    }
    const datos = await r.json();
    const f = datos?.results?.[0];
    if (!f?.urls?.small || !f.links?.html) return null;
    return {
      url: f.urls.small,
      alt: f.alt_description || prenda,
      fotografo: f.user?.name ?? "Unsplash",
      fotografoUrl: `${f.user?.links?.html ?? "https://unsplash.com"}?${UTM}`,
      paginaUrl: `https://unsplash.com/?${UTM}`,
    };
  } catch (error) {
    console.warn("[fotos] no photo", error instanceof Error ? error.name : error);
    return null;
  }
}

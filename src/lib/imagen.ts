/**
 * Compresión de fotos en el navegador, antes de subirlas.
 *
 * Importa por tres razones: una foto de celular pesa 3-5 MB y el free tier de
 * Storage es 1 GB; subir 5 MB por prenda con datos móviles es lento y caro para
 * la usuaria; y el catalogador no necesita esa resolución para reconocer una
 * playera. El documento fija el objetivo en WebP ≤300 KB (§3.3 M2).
 */

const LADO_MAXIMO = 1400;
const PESO_OBJETIVO = 300 * 1024;

export async function comprimirAWebp(archivo: File): Promise<Blob> {
  const bitmap = await createImageBitmap(archivo);

  const escala = Math.min(1, LADO_MAXIMO / Math.max(bitmap.width, bitmap.height));
  const ancho = Math.round(bitmap.width * escala);
  const alto = Math.round(bitmap.height * escala);

  const canvas = document.createElement("canvas");
  canvas.width = ancho;
  canvas.height = alto;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Tu navegador no puede procesar imágenes");
  ctx.drawImage(bitmap, 0, 0, ancho, alto);
  bitmap.close();

  // Se baja la calidad por pasos hasta llegar al peso objetivo. Rara vez pasa
  // de la primera vuelta; el resto es para fotos muy texturizadas.
  for (const calidad of [0.82, 0.7, 0.58, 0.45]) {
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", calidad),
    );
    if (blob && (blob.size <= PESO_OBJETIVO || calidad === 0.45)) return blob;
  }

  throw new Error("No pudimos procesar esta imagen");
}

/** Nombre único y sin sorpresas: el original puede traer acentos o espacios. */
export function nombreDeArchivo(): string {
  return `${crypto.randomUUID()}.webp`;
}

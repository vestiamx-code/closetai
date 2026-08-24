/**
 * Compresión de fotos en el navegador, antes de subirlas.
 *
 * Importa por tres razones: una foto de celular pesa 3-5 MB y el free tier de
 * Storage es 1 GB; subir 5 MB por prenda con datos móviles es lento y caro para
 * la usuaria; y el catalogador no necesita esa resolución para reconocer una
 * playera. El documento fija el objetivo en WebP ≤300 KB (§3.3 M2).
 *
 * Pero eso vale para las prendas, no para la foto del cuerpo. El modelo de
 * prueba virtual devuelve el render **a la resolución de la foto que le das**:
 * si entra a 660 px, sale a 660 px y se ve pixeleado. La foto base no es una
 * miniatura, es el lienzo. Por eso hay dos perfiles.
 */

type Perfil = "prenda" | "cuerpo";

const PERFILES: Record<Perfil, { lado: number; peso: number; calidades: number[] }> = {
  // Solo tiene que ser reconocible por el catalogador y verse bien en una rejilla.
  prenda: { lado: 1400, peso: 300 * 1024, calidades: [0.82, 0.7, 0.58, 0.45] },
  // El render se genera a esta resolución. Aquí sí duele cada pixel que se pierde.
  cuerpo: { lado: 2048, peso: 1800 * 1024, calidades: [0.92, 0.86, 0.8, 0.72] },
};

export async function comprimirAWebp(archivo: File, perfil: Perfil = "prenda"): Promise<Blob> {
  const { lado, peso, calidades } = PERFILES[perfil];

  // `imageOrientation: "from-image"` no es opcional. Las fotos de celular traen
  // la rotación en los metadatos EXIF, no en los pixeles: el celular las guarda
  // acostadas y marca "esto va girado 90°". Sin esta opción el canvas dibuja los
  // pixeles crudos y la prenda queda de lado — pasó con una sudadera del clóset.
  const bitmap = await createImageBitmap(archivo, { imageOrientation: "from-image" });

  const escala = Math.min(1, lado / Math.max(bitmap.width, bitmap.height));
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
  for (const calidad of calidades) {
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", calidad),
    );
    if (blob && (blob.size <= peso || calidad === calidades[calidades.length - 1])) return blob;
  }

  throw new Error("No pudimos procesar esta imagen");
}

/**
 * Alto en pixeles por debajo del cual una foto de cuerpo da un render pixeleado.
 * Sale de la prueba del 22-ago-2026: la foto base medía 1286 px y el render
 * salió a esa misma altura, visiblemente blando.
 */
export const ALTO_MINIMO_CUERPO = 1200;

/** Alto en pixeles del archivo original, para avisar antes de subirlo. */
export async function altoOriginal(archivo: File): Promise<number> {
  const bitmap = await createImageBitmap(archivo, { imageOrientation: "from-image" });
  const alto = bitmap.height;
  bitmap.close();
  return alto;
}

/** Nombre único y sin sorpresas: el original puede traer acentos o espacios. */
export function nombreDeArchivo(): string {
  return `${crypto.randomUUID()}.webp`;
}

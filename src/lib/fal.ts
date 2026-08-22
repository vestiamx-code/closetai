import "server-only";

/**
 * Adapter de fal.ai: recorte de fondo (BiRefNet) y prueba virtual (FASHN).
 *
 * Mismo criterio que el adapter de Gemini: el resto de la app habla con este
 * módulo, nunca con fal directamente. Los modelos viven en constantes para que
 * cambiar de proveedor sea tocar un archivo — el documento contempla Nova
 * Canvas como plan B del try-on (§4.1).
 */

const BASE = "https://queue.fal.run";

/** Recorte de fondo. SOTA open source, ~$0.001 por imagen. */
const MODELO_RECORTE = "fal-ai/birefnet/v2";
/** Try-on. El especialista en preservar estampados y logos: fidelidad no negociable. */
const MODELO_TRYON = "fal-ai/fashn/tryon/v1.6";

export const COSTO_USD = {
  recorte: 0.001,
  tryon: 0.075,
} as const;

function llave(): string {
  const valor = process.env.FAL_KEY;
  if (!valor) throw new Error("Falta FAL_KEY");
  return valor;
}

export type ResultadoFal<T> = { ok: true; datos: T } | { ok: false; motivo: string };

/**
 * fal encola el trabajo y hay que ir preguntando por el resultado.
 * Se espera con un tope: un render colgado no puede dejar la petición viva
 * para siempre ni al usuario mirando un spinner eterno.
 */
async function ejecutar<T>(modelo: string, entrada: unknown, topeMs = 90_000): Promise<ResultadoFal<T>> {
  const cabeceras = {
    Authorization: `Key ${llave()}`,
    "Content-Type": "application/json",
  };

  let encolado: { status_url?: string; response_url?: string; detail?: string };
  try {
    const respuesta = await fetch(`${BASE}/${modelo}`, {
      method: "POST",
      headers: cabeceras,
      body: JSON.stringify(entrada),
    });
    encolado = await respuesta.json();
    if (!respuesta.ok) {
      return { ok: false, motivo: encolado?.detail ?? `fal respondió ${respuesta.status}` };
    }
  } catch (error) {
    return { ok: false, motivo: error instanceof Error ? error.message : "no se pudo contactar a fal" };
  }

  if (!encolado.status_url || !encolado.response_url) {
    return { ok: false, motivo: "fal no devolvió las URLs del trabajo" };
  }

  const limite = Date.now() + topeMs;
  while (Date.now() < limite) {
    await new Promise((r) => setTimeout(r, 1500));

    const estado = await fetch(encolado.status_url, { headers: cabeceras }).then((r) => r.json());

    if (estado.status === "COMPLETED") {
      const datos = await fetch(encolado.response_url!, { headers: cabeceras }).then((r) => r.json());

      // fal responde 200 aunque el trabajo haya fallado: el error viene dentro
      // del cuerpo, en `detail`. Sin esta comprobación, un fallo se devolvería
      // como éxito y reventaría más adelante, lejos de su causa.
      if (datos && typeof datos === "object" && "detail" in datos) {
        const detalle = (datos as { detail?: unknown }).detail;
        const mensaje = Array.isArray(detalle)
          ? String((detalle[0] as { msg?: string })?.msg ?? "el modelo rechazó la imagen")
          : String(detalle);
        return { ok: false, motivo: mensaje };
      }

      return { ok: true, datos: datos as T };
    }
    if (estado.status === "FAILED" || estado.error) {
      return { ok: false, motivo: "el modelo no pudo procesar la imagen" };
    }
  }

  return { ok: false, motivo: "el render tardó demasiado" };
}

/**
 * Quita el fondo de la foto de una prenda.
 * Sin esto, un clóset de fotos tomadas sobre la cama se ve como un álbum
 * desordenado en vez de un catálogo.
 */
export async function recortarFondo(
  imageUrl: string,
): Promise<ResultadoFal<{ image: { url: string } }>> {
  return ejecutar(MODELO_RECORTE, { image_url: imageUrl }, 60_000);
}

/**
 * Pone una prenda sobre la foto de la usuaria.
 *
 * Los cuatro parámetros de abajo no son afinación fina: sin ellos el render sale
 * mal de formas concretas, comprobadas contra el modelo real (22-ago-2026).
 *
 * `segmentation_free: false` es el más importante. El valor por defecto de FASHN
 * es `true`, que le dice al modelo que NO recorte la ropa que la usuaria ya trae
 * puesta: la prenda nueva se pega encima y queda como un babero sobre la
 * sudadera vieja. Con `false` el modelo segmenta y sustituye de verdad.
 *
 * `mode: "quality"` en vez del `balanced` por defecto. Es más lento — de ahí el
 * tope de tiempo más alto — pero esto se cobra un crédito, y un render feo por
 * ahorrar segundos es un crédito tirado.
 *
 * `garment_photo_type` no se puede dejar en `auto`: adivina, y cuando adivina mal
 * deforma la prenda. Se lo dice el catalogador, que ya miró la foto. Ojo: NO se
 * puede deducir de si la prenda tiene recorte — quitarle el fondo a una foto de
 * alguien con la sudadera puesta deja a la persona recortada, no la sudadera.
 */
export async function probarPrenda(params: {
  fotoUsuaria: string;
  fotoPrenda: string;
  categoria: "tops" | "bottoms" | "one-pieces";
  /** true si la foto muestra la prenda sola; false si alguien la trae puesta. */
  prendaSola: boolean;
}): Promise<ResultadoFal<{ images: Array<{ url: string }> }>> {
  return ejecutar(
    MODELO_TRYON,
    {
      model_image: params.fotoUsuaria,
      garment_image: params.fotoPrenda,
      category: params.categoria,
      mode: "quality",
      segmentation_free: false,
      garment_photo_type: params.prendaSola ? "flat-lay" : "model",
      output_format: "png",
    },
    180_000,
  );
}

/** Traduce la categoría del catalogador a la que espera FASHN. */
export function categoriaParaTryon(categoria: string | null): "tops" | "bottoms" | "one-pieces" | null {
  switch (categoria) {
    case "top":
    case "abrigo":
      return "tops";
    case "bottom":
      return "bottoms";
    case "vestido":
      return "one-pieces";
    default:
      // Calzado, accesorios y bolsas no se pueden probar virtualmente con este
      // modelo. Decirlo claro es mejor que devolver un render deforme.
      return null;
  }
}

"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { z } from "zod";

import { catalogGarment } from "@/lib/ai/gemini";
import { COSTO_USD, recortarFondo } from "@/lib/fal";
import { catalogoAColumnas } from "@/lib/closet/tipos";
import { revisarLimite } from "@/lib/limites";
import { createAdminClient } from "@/lib/supabase/admin";
import { actualizarPerfilEnSegundoPlano } from "@/lib/perfil-estilo";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

export type ResultadoCatalogacion =
  | { ok: true; id: string; subcategoria: string }
  | { ok: false; motivo: string };

const rutaSchema = z
  .string()
  .min(1)
  .regex(/^[0-9a-f-]{36}\/[A-Za-z0-9._-]+$/, "invalid path");

/**
 * Cataloga una prenda ya subida a Storage y la guarda en la base.
 *
 * Se llama desde el navegador después de subir la imagen. Como las Server
 * Actions son alcanzables por POST directo, vuelve a validar la sesión y a
 * comprobar que la ruta pertenezca a quien la manda — no basta con que el
 * formulario lo diga.
 */
export async function catalogarPrenda(rutaImagen: string): Promise<ResultadoCatalogacion> {
  const user = await requireUser();

  const limite = await revisarLimite(user.id, "catalog_garment");
  if (!limite.permitido) return { ok: false, motivo: limite.motivo };

  const ruta = rutaSchema.safeParse(rutaImagen);
  if (!ruta.success) return { ok: false, motivo: "Invalid image path." };

  // La convención es `<user_id>/<archivo>`: si el prefijo no es suyo, no sigue.
  if (!ruta.data.startsWith(`${user.id}/`)) {
    return { ok: false, motivo: "That image isn't yours." };
  }

  const supabase = await createClient();

  const { data: archivo, error: errorDescarga } = await supabase.storage
    .from("garments")
    .download(ruta.data);

  if (errorDescarga || !archivo) {
    return { ok: false, motivo: "We couldn't read the photo. Upload it again." };
  }

  const base64 = Buffer.from(await archivo.arrayBuffer()).toString("base64");
  const resultado = await catalogGarment(base64, archivo.type || "image/webp");

  // El costo se registra pase lo que pase: una llamada fallida también se cobra.
  const admin = createAdminClient();
  await admin.from("api_costs").insert({
    user_id: user.id,
    provider: "google",
    operation: "catalog_garment",
    est_cost_usd: resultado.meta.estCostUsd,
  });

  if (!resultado.ok) {
    // El detalle técnico va al log del servidor, no a la usuaria: a ella no le
    // sirve saber que el modelo devolvió JSON inválido, y a nosotros sí.
    console.error("[catalog] failed", {
      motivo: resultado.reason,
      detalle: resultado.message,
      modelo: resultado.meta.model,
      mimeType: archivo.type,
      bytes: archivo.size,
    });
    const motivo =
      resultado.reason === "rejected"
        ? `That doesn't look like a garment: ${resultado.message}`
        : "AI couldn't read this photo. Try a clearer one.";
    // Se borra la imagen huérfana para no dejar basura ocupando el bucket.
    await supabase.storage.from("garments").remove([ruta.data]);
    return { ok: false, motivo };
  }

  const { data: prenda, error } = await supabase
    .from("garments")
    .insert({
      user_id: user.id,
      image_path: ruta.data,
      status: "active",
      ai_meta: {
        confianza: resultado.garment.confianza,
        modelo: resultado.meta.model,
        version_prompt: resultado.meta.promptVersion,
        // Lo usa el try-on para decirle al modelo cómo leer la foto de la prenda.
        tipo_de_foto: resultado.garment.tipo_de_foto,
      },
      ...catalogoAColumnas(resultado.garment),
    })
    .select("id, subcategory")
    .single();

  if (error || !prenda) {
    return { ok: false, motivo: "We couldn't save the garment. Please try again." };
  }

  // El recorte de fondo va después de guardar, a propósito: si falla, la prenda
  // ya existe y se ve con su foto original. Es una mejora visual, no un requisito.
  void recortarEnSegundoPlano(prenda.id, user.id, ruta.data);

  revalidatePath("/closet");
  return { ok: true, id: prenda.id, subcategoria: prenda.subcategory ?? "garment" };
}

/** Cuánto vive la URL firmada que se le da a fal para descargar la imagen. */
const TTL_PARA_FAL = 60 * 10;

/**
 * Quita el fondo de la foto y guarda la versión limpia.
 *
 * Sin esto, un clóset fotografiado sobre la cama se ve como un álbum
 * desordenado. Con esto, se ve como un catálogo.
 *
 * Falla en silencio hacia la usuaria y ruidosamente en el log: la prenda sigue
 * siendo perfectamente usable con su foto original.
 *
 * Reintenta una vez. Los fallos que vimos en producción no fueron rechazos del
 * modelo — la misma imagen funcionó al volver a mandarla — sino tropiezos de red
 * o de cola. Sin reintento, la prenda se queda para siempre sin recorte, y eso
 * después se nota en el try-on: sin recorte hay que mandarle al modelo la foto
 * original, que suele ser alguien con la prenda puesta.
 */
async function recortarEnSegundoPlano(garmentId: string, userId: string, ruta: string) {
  try {
    const supabase = await createClient();
    const { data: firmada } = await supabase.storage
      .from("garments")
      .createSignedUrl(ruta, TTL_PARA_FAL);

    if (!firmada?.signedUrl) return;

    const admin = createAdminClient();

    let resultado = await recortarFondo(firmada.signedUrl);
    await admin.from("api_costs").insert({
      user_id: userId,
      provider: "fal",
      operation: "remove_background",
      est_cost_usd: COSTO_USD.recorte,
    });

    if (!resultado.ok) {
      console.warn("[cutout] first attempt failed, retrying", {
        garmentId,
        motivo: resultado.motivo,
      });
      await new Promise((listo) => setTimeout(listo, 1500));
      resultado = await recortarFondo(firmada.signedUrl);
      await admin.from("api_costs").insert({
        user_id: userId,
        provider: "fal",
        operation: "remove_background",
        est_cost_usd: COSTO_USD.recorte,
      });
    }

    if (!resultado.ok) {
      console.error("[cutout] could not remove the background after two attempts", {
        garmentId,
        motivo: resultado.motivo,
      });
      return;
    }

    const imagen = await fetch(resultado.datos.image.url).then((r) => r.arrayBuffer());
    const rutaLimpia = ruta.replace(/\.[^.]+$/, "") + "-limpia.png";

    const { error } = await admin.storage
      .from("garments")
      .upload(rutaLimpia, imagen, { contentType: "image/png", upsert: true });

    if (error) {
      console.error("[cutout] could not save the clean version", error);
      return;
    }

    await admin.from("garments").update({ clean_image_path: rutaLimpia }).eq("id", garmentId);
  } catch (error) {
    console.error("[cutout] failed", error);
  }
}

/**
 * Corrige a mano un atributo mal catalogado.
 * Cada corrección se guarda como `feedback_event` de tipo `tag_fix`: es la
 * materia prima del aprendizaje de gustos (M4), no solo un cambio de dato.
 */
export async function corregirPrenda(formData: FormData): Promise<{ error?: string }> {
  const user = await requireUser();

  const datos = z
    .object({
      id: z.string().uuid(),
      subcategory: z.string().trim().min(1).max(60),
      category: z.string().trim().min(1).max(20),
    })
    .safeParse({
      id: formData.get("id"),
      subcategory: formData.get("subcategory"),
      category: formData.get("category"),
    });

  if (!datos.success) return { error: "Check the details." };

  const supabase = await createClient();

  const { data: antes } = await supabase
    .from("garments")
    .select("subcategory, category")
    .eq("id", datos.data.id)
    .single();

  // RLS ya limita a las prendas propias; el .eq de user_id lo hace explícito.
  const { error } = await supabase
    .from("garments")
    .update({ subcategory: datos.data.subcategory, category: datos.data.category })
    .eq("id", datos.data.id)
    .eq("user_id", user.id);

  if (error) return { error: "We couldn't save the change." };

  await supabase.from("feedback_events").insert({
    user_id: user.id,
    type: "tag_fix",
    garment_id: datos.data.id,
    payload: { antes, despues: { subcategory: datos.data.subcategory, category: datos.data.category } },
  });

  after(() => actualizarPerfilEnSegundoPlano(user.id));

  revalidatePath("/closet");
  return {};
}

/** Elimina una prenda y su foto. El documento promete borrado real (§3.2). */
export async function eliminarPrenda(formData: FormData): Promise<{ error?: string }> {
  const user = await requireUser();
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) return { error: "Invalid garment." };

  const supabase = await createClient();

  const { data: prenda } = await supabase
    .from("garments")
    .select("image_path, clean_image_path")
    .eq("id", id.data)
    .eq("user_id", user.id)
    .single();

  if (!prenda) return { error: "We couldn't find that garment." };

  const { error } = await supabase.from("garments").delete().eq("id", id.data).eq("user_id", user.id);
  if (error) return { error: "We couldn't delete it." };

  // Los archivos no se van solos con el registro: hay que borrarlos aparte.
  const archivos = [prenda.image_path, prenda.clean_image_path].filter(Boolean) as string[];
  if (archivos.length) await supabase.storage.from("garments").remove(archivos);

  revalidatePath("/closet");
  return {};
}

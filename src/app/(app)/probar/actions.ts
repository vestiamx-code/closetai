"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth";
import { validarFotoBase } from "@/lib/ai/gemini";
import { cobrar, saldo } from "@/lib/credits";
import { categoriaParaTryon, COSTO_USD, probarPrenda } from "@/lib/fal";
import { estadoTryon } from "@/lib/gasto";
import { revisarLimite } from "@/lib/limites";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const rutaSchema = z
  .string()
  .regex(/^[0-9a-f-]{36}\/[A-Za-z0-9._-]+$/, "ruta inválida");

/** URL firmada larga: fal necesita poder descargar la imagen mientras renderiza. */
const TTL_PARA_FAL = 60 * 20;

export type ResultadoAvatar = { ok: true } | { ok: false; motivo: string };

/**
 * Registra y valida la foto base de la usuaria.
 * Se valida ANTES de permitir cualquier render: un crédito gastado en una foto
 * mala es dinero perdido y una decepción.
 */
export async function registrarFotoBase(rutaImagen: string): Promise<ResultadoAvatar> {
  const user = await requireUser();

  const ruta = rutaSchema.safeParse(rutaImagen);
  if (!ruta.success || !ruta.data.startsWith(`${user.id}/`)) {
    return { ok: false, motivo: "Esa imagen no es tuya." };
  }

  const supabase = await createClient();
  const { data: archivo } = await supabase.storage.from("avatars").download(ruta.data);
  if (!archivo) return { ok: false, motivo: "No pudimos leer la foto. Vuelve a subirla." };

  const base64 = Buffer.from(await archivo.arrayBuffer()).toString("base64");
  const validacion = await validarFotoBase(base64, archivo.type || "image/webp");

  const admin = createAdminClient();
  await admin.from("api_costs").insert({
    user_id: user.id,
    provider: "google",
    operation: "validate_avatar",
    est_cost_usd: validacion.estCostUsd,
  });

  if (!validacion.sirve) {
    // La foto rechazada se borra en el momento. Si es contenido inapropiado,
    // no puede quedarse ni un minuto en el bucket.
    await supabase.storage.from("avatars").remove([ruta.data]);
    return { ok: false, motivo: validacion.motivo };
  }

  // Solo una foto base activa a la vez: la nueva reemplaza a la anterior.
  await supabase.from("avatar_photos").update({ is_primary: false }).eq("user_id", user.id);

  const { error } = await supabase.from("avatar_photos").insert({
    user_id: user.id,
    image_path: ruta.data,
    is_primary: true,
    validation: "ok",
    validation_note: validacion.motivo,
  });

  if (error) return { ok: false, motivo: "No pudimos guardar tu foto." };

  revalidatePath("/probar");
  return { ok: true };
}

export type ResultadoTryon =
  | { ok: true; renderId: string; saldoRestante: number }
  | { ok: false; motivo: string; sinSaldo?: boolean };

/**
 * Prueba una prenda sobre la foto base.
 *
 * Orden deliberado: se valida todo, se renderiza, y **solo si el render salió
 * bien se cobra el crédito**. Cobrar antes sería cobrarle a la usuaria por un
 * error nuestro; el documento lo exige así (§3.3 M5: débito exactamente al éxito).
 */
export async function probar(garmentId: string): Promise<ResultadoTryon> {
  const user = await requireUser();

  const id = z.string().uuid().safeParse(garmentId);
  if (!id.success) return { ok: false, motivo: "Prenda inválida." };

  // El freno de gasto va primero: antes de tocar la base o llamar a fal.
  const estado = await estadoTryon();
  if (!estado.habilitado) return { ok: false, motivo: estado.motivo };

  const limite = await revisarLimite(user.id, "tryon");
  if (!limite.permitido) return { ok: false, motivo: limite.motivo };

  const supabase = await createClient();

  const [{ data: prenda }, { data: avatar }] = await Promise.all([
    supabase
      .from("garments")
      .select("id, image_path, clean_image_path, category, subcategory")
      .eq("id", id.data)
      .single(),
    supabase
      .from("avatar_photos")
      .select("id, image_path")
      .eq("is_primary", true)
      .eq("validation", "ok")
      .single(),
  ]);

  if (!prenda) return { ok: false, motivo: "No encontramos esa prenda." };
  if (!avatar) return { ok: false, motivo: "Primero sube una foto tuya de cuerpo completo." };

  const categoria = categoriaParaTryon(prenda.category);
  if (!categoria) {
    return {
      ok: false,
      motivo: `Todavía no puedo probarte ${prenda.subcategory ?? "esta prenda"} virtualmente. Por ahora funciona con ropa: tops, pantalones y vestidos.`,
    };
  }

  // Se revisa el saldo antes de gastar en el render, pero el cobro va después.
  if ((await saldo(user.id)) < 1) {
    return { ok: false, motivo: "Te quedaste sin créditos.", sinSaldo: true };
  }

  const rutaPrenda = prenda.clean_image_path ?? prenda.image_path;
  const [firmadaAvatar, firmadaPrenda] = await Promise.all([
    supabase.storage.from("avatars").createSignedUrl(avatar.image_path, TTL_PARA_FAL),
    supabase.storage.from("garments").createSignedUrl(rutaPrenda, TTL_PARA_FAL),
  ]);

  if (!firmadaAvatar.data?.signedUrl || !firmadaPrenda.data?.signedUrl) {
    return { ok: false, motivo: "No pudimos preparar las imágenes." };
  }

  const admin = createAdminClient();
  const { data: render } = await admin
    .from("tryon_renders")
    .insert({
      user_id: user.id,
      garment_ids: [prenda.id],
      avatar_photo_id: avatar.id,
      provider: "fashn",
      mode: "tryon",
      credits_charged: 0,
      status: "processing",
    })
    .select("id")
    .single();

  if (!render) return { ok: false, motivo: "No pudimos iniciar el render." };

  const resultado = await probarPrenda({
    fotoUsuaria: firmadaAvatar.data.signedUrl,
    fotoPrenda: firmadaPrenda.data.signedUrl,
    categoria,
  });

  await admin.from("api_costs").insert({
    user_id: user.id,
    provider: "fal",
    operation: "tryon",
    est_cost_usd: COSTO_USD.tryon,
  });

  if (!resultado.ok || !resultado.datos.images?.[0]?.url) {
    await admin.from("tryon_renders").update({ status: "failed" }).eq("id", render.id);
    // Sin cobrar: el fallo es nuestro, no de la usuaria.
    return { ok: false, motivo: "El render no salió bien. No te cobramos el crédito." };
  }

  // Guardar la imagen en nuestro Storage: la URL de fal expira.
  const imagen = await fetch(resultado.datos.images[0].url).then((r) => r.arrayBuffer());
  const rutaRender = `${user.id}/${render.id}.png`;
  await admin.storage
    .from("renders")
    .upload(rutaRender, imagen, { contentType: "image/png", upsert: true });

  // Ahora sí: el render existe, se cobra. `ref` es el id del render, y como es
  // único en el ledger, un reintento no puede cobrar dos veces.
  const cobro = await cobrar(user.id, 1, "tryon", render.id);
  if (!cobro.ok) {
    await admin.from("tryon_renders").update({ status: "failed" }).eq("id", render.id);
    return { ok: false, motivo: "Te quedaste sin créditos.", sinSaldo: true };
  }

  await admin
    .from("tryon_renders")
    .update({ status: "done", image_path: rutaRender, credits_charged: 1 })
    .eq("id", render.id);

  revalidatePath("/probar");
  return { ok: true, renderId: render.id, saldoRestante: cobro.saldoRestante };
}

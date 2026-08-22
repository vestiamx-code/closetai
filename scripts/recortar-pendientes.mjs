/**
 * Recorta el fondo de las prendas que se quedaron sin `clean_image_path`.
 *
 * Pasa por dos razones: un tropiezo de red en la subida (ya hay reintento, pero
 * las prendas viejas se quedaron así), o porque las sembró el script de demo,
 * que no pasa por el recorte.
 *
 * Importa más de lo que parece: sin recorte, el try-on recibe la foto original
 * —que suele ser alguien con la prenda puesta— en vez de la prenda sola.
 *
 *   node scripts/recortar-pendientes.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const env = {};
for (const linea of readFileSync(path.join(raiz, ".env.local"), "utf8").split("\n")) {
  const m = /^([A-Z0-9_]+)=(.*)$/.exec(linea.trim());
  if (m) env[m[1]] = m[2].split("#")[0].trim();
}

const supa = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const { data: pendientes, error } = await supa
  .from("garments")
  .select("id, user_id, image_path, subcategory")
  .is("clean_image_path", null)
  .eq("status", "active");

if (error) throw error;
console.log(`${pendientes.length} prenda(s) sin recorte\n`);

async function recortar(url) {
  const alta = await fetch("https://queue.fal.run/fal-ai/birefnet/v2", {
    method: "POST",
    headers: { Authorization: `Key ${env.FAL_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ image_url: url }),
  }).then((r) => r.json());
  if (!alta.status_url) return null;

  for (let i = 0; i < 40; i++) {
    await new Promise((s) => setTimeout(s, 2000));
    const estado = await fetch(alta.status_url, {
      headers: { Authorization: `Key ${env.FAL_KEY}` },
    }).then((r) => r.json());
    if (estado.status === "COMPLETED") {
      const res = await fetch(alta.response_url, {
        headers: { Authorization: `Key ${env.FAL_KEY}` },
      }).then((r) => r.json());
      return res?.image?.url ?? null;
    }
    if (estado.status === "FAILED") return null;
  }
  return null;
}

let listas = 0;
for (const p of pendientes) {
  const { data: firmada } = await supa.storage.from("garments").createSignedUrl(p.image_path, 900);
  if (!firmada?.signedUrl) {
    console.log(`  ✗ ${p.subcategory}: no se pudo firmar la URL`);
    continue;
  }

  const url = await recortar(firmada.signedUrl);
  if (!url) {
    console.log(`  ✗ ${p.subcategory}: el recorte falló`);
    continue;
  }

  const bytes = await fetch(url).then((r) => r.arrayBuffer());
  const rutaLimpia = p.image_path.replace(/\.[^.]+$/, "") + "-limpia.png";
  const { error: errSubida } = await supa.storage
    .from("garments")
    .upload(rutaLimpia, bytes, { contentType: "image/png", upsert: true });
  if (errSubida) {
    console.log(`  ✗ ${p.subcategory}: ${errSubida.message}`);
    continue;
  }

  await supa.from("garments").update({ clean_image_path: rutaLimpia }).eq("id", p.id);
  await supa.from("api_costs").insert({
    user_id: p.user_id,
    provider: "fal",
    operation: "remove_background",
    est_cost_usd: 0.001,
  });
  console.log(`  ✓ ${p.subcategory}`);
  listas++;
}

console.log(`\n${listas} de ${pendientes.length} recortadas.`);

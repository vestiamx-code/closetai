/**
 * Clasifica cómo está fotografiada cada prenda ya catalogada: la prenda sola, o
 * alguien con ella puesta.
 *
 * Las prendas catalogadas con el prompt v1 no traen `tipo_de_foto`, y sin ese
 * dato el try-on asume "puesta" — conservador, pero equivocado para una foto de
 * catálogo, y el render sale peor.
 *
 *   node scripts/rellenar-tipo-de-foto.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";
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
const ia = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

const { data: prendas, error } = await supa
  .from("garments")
  .select("id, user_id, image_path, subcategory, ai_meta")
  .eq("status", "active");
if (error) throw error;

const faltantes = prendas.filter((p) => !p.ai_meta?.tipo_de_foto);
console.log(`${faltantes.length} de ${prendas.length} sin tipo_de_foto\n`);

for (const p of faltantes) {
  const { data: archivo } = await supa.storage.from("garments").download(p.image_path);
  if (!archivo) {
    console.log(`  ✗ ${p.subcategory}: no se pudo leer`);
    continue;
  }
  const base64 = Buffer.from(await archivo.arrayBuffer()).toString("base64");

  const r = await ia.models.generateContent({
    model: env.GEMINI_MODEL_VISION,
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType: archivo.type || "image/webp", data: base64 } },
          {
            text: `¿Cómo está fotografiada esta prenda? Responde SOLO JSON: {"tipo_de_foto":"prenda_sola|puesta"}
- "prenda_sola": la prenda está sola — extendida, colgada, en maniquí, o foto de catálogo. También si alguien la sostiene con la mano sin traerla puesta.
- "puesta": una persona la trae puesta.
Ante la duda, responde "puesta".`,
          },
        ],
      },
    ],
    config: { responseMimeType: "application/json", temperature: 0 },
  });

  const limpio = (r.text ?? "").trim().replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```$/, "");
  let tipo;
  try {
    const j = JSON.parse(limpio);
    tipo = (Array.isArray(j) ? j[0] : j)?.tipo_de_foto;
  } catch {
    /* respuesta ilegible */
  }
  if (tipo !== "prenda_sola" && tipo !== "puesta") {
    console.log(`  ✗ ${p.subcategory}: respuesta ilegible (${limpio.slice(0, 40)})`);
    continue;
  }

  await supa
    .from("garments")
    .update({ ai_meta: { ...(p.ai_meta ?? {}), tipo_de_foto: tipo } })
    .eq("id", p.id);
  await supa.from("api_costs").insert({
    user_id: p.user_id,
    provider: "google",
    operation: "catalog_garment",
    est_cost_usd: 0.0003,
  });
  console.log(`  ✓ ${p.subcategory} → ${tipo}`);
}

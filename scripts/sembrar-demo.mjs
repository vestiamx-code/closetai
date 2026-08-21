/**
 * Siembra una cuenta de demostración con prendas catalogadas de verdad.
 *
 * Para qué sirve: grabar el video de la rúbrica y probar la interfaz a mano sin
 * tener que fotografiar ropa cada vez. Las prendas son dibujos generados por
 * código, no fotos de nadie.
 *
 *   node scripts/sembrar-demo.mjs
 *
 * Requiere .env.local con SUPABASE_SERVICE_ROLE_KEY y GEMINI_API_KEY.
 * Borra y recrea la cuenta demo en cada corrida.
 */
import { randomUUID } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

for (const linea of readFileSync(path.join(raiz, ".env.local"), "utf8").split("\n")) {
  const m = /^([A-Z0-9_]+)=(.*)$/.exec(linea.trim());
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].split("#")[0].trim();
}

const CORREO = "demo@closetai.lat";
const CONTRASENA = process.env.DEMO_PASSWORD ?? `Demo-${randomUUID().slice(0, 12)}!`;

const supa = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const modelo = process.env.GEMINI_MODEL_VISION ?? "gemini-3.5-flash-lite";

// El prompt se lee del módulo real, para que la demo use exactamente el mismo.
const fuentePrompt = readFileSync(path.join(raiz, "src/lib/ai/prompts/catalog-garment.ts"), "utf8");
const prompt = fuentePrompt.split("`")[1].split("` as const")[0];

const { data: existentes } = await supa.auth.admin.listUsers();
for (const u of existentes?.users ?? []) {
  if (u.email === CORREO) {
    const { data: archivos } = await supa.storage.from("garments").list(u.id, { limit: 100 });
    const rutas = (archivos ?? []).map((f) => `${u.id}/${f.name}`);
    if (rutas.length) await supa.storage.from("garments").remove(rutas);
    await supa.auth.admin.deleteUser(u.id);
  }
}

const { data: creada, error } = await supa.auth.admin.createUser({
  email: CORREO,
  password: CONTRASENA,
  email_confirm: true,
  user_metadata: { full_name: "Demo" },
});
if (error) throw error;
const userId = creada.user.id;

const carpeta = path.join(raiz, "src/tests/fixtures");
const imagenes = readdirSync(carpeta).filter((f) => f.endsWith(".png"));

for (const nombre of imagenes) {
  const bytes = readFileSync(path.join(carpeta, nombre));
  const destino = `${userId}/${randomUUID()}.png`;

  const { error: errorSubida } = await supa.storage
    .from("garments")
    .upload(destino, bytes, { contentType: "image/png" });
  if (errorSubida) {
    console.log(`  ✗ ${nombre}: ${errorSubida.message}`);
    continue;
  }

  const respuesta = await ai.models.generateContent({
    model: modelo,
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType: "image/png", data: bytes.toString("base64") } },
          { text: prompt },
        ],
      },
    ],
    config: { responseMimeType: "application/json", temperature: 0.2 },
  });

  let j = JSON.parse((respuesta.text ?? "").replace(/^```json\s*|\s*```$/g, ""));
  if (Array.isArray(j)) j = j[0];
  if (!j || j.error) {
    console.log(`  ✗ ${nombre}: ${j?.error ?? "sin respuesta"}`);
    continue;
  }

  const { error: errorInsert } = await supa.from("garments").insert({
    user_id: userId,
    image_path: destino,
    status: "active",
    category: j.categoria,
    subcategory: j.subcategoria,
    colors: j.colores,
    pattern: j.patron,
    material: j.material_aparente,
    styles: j.estilos,
    seasons: j.temporadas,
    occasions: j.ocasiones,
    styling_note: j.notas_styling,
    ai_meta: { confianza: j.confianza, modelo, version_prompt: 1 },
  });

  console.log(errorInsert ? `  ✗ ${nombre}: ${errorInsert.message}` : `  ✓ ${j.subcategoria} — ${j.colores.join(", ")}`);
  await new Promise((r) => setTimeout(r, 4000)); // el free tier limita peticiones por minuto
}

console.log(`\nCuenta demo lista:\n  ${CORREO}\n  ${CONTRASENA}`);

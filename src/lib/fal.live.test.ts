// @vitest-environment node
/**
 * Prueba EN VIVO: llama a la API real y, en el caso del try-on, cuesta dinero.
 * No corre en `pnpm test:unit` ni en CI. Para correrla:
 *
 *   PRUEBAS_VIVAS=1 pnpm test:unit
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

function cargarEnv() {
  try {
    const ruta = fileURLToPath(new URL("../../.env.local", import.meta.url));
    for (const linea of readFileSync(ruta, "utf8").split("\n")) {
      const m = /^([A-Z0-9_]+)=(.*)$/.exec(linea.trim());
      if (!m) continue;
      const valor = m[2].split("#")[0].trim();
      if (valor && !process.env[m[1]]) process.env[m[1]] = valor;
    }
  } catch {
    /* sin .env.local */
  }
}
cargarEnv();

const haySupabase = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
);

describe.skipIf(!process.env.PRUEBAS_VIVAS || !process.env.FAL_KEY || !haySupabase)("fal.ai real", () => {
  it("recorta el fondo de una prenda del clóset", { timeout: 90_000 }, async () => {
    // Se usa una URL firmada de Storage, igual que en producción: así la prueba
    // ejercita el mismo camino que va a recorrer una foto de verdad.
    const { createClient } = await import("@supabase/supabase-js");
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    );

    const { data: prenda } = await admin
      .from("garments")
      .select("image_path")
      .eq("status", "active")
      .limit(1)
      .single();

    if (!prenda) return; // sin clóset sembrado no hay nada que recortar

    const { data: firmada } = await admin.storage
      .from("garments")
      .createSignedUrl(prenda.image_path, 600);

    if (!firmada?.signedUrl) throw new Error("no se pudo firmar la imagen");

    const { recortarFondo } = await import("./fal");
    const r = await recortarFondo(firmada.signedUrl);

    console.log("recorte:", JSON.stringify(r).slice(0, 220));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.datos.image.url).toMatch(/^https?:\/\//);
  });

  it("reporta como fallo una imagen que fal no puede descargar", { timeout: 60_000 }, async () => {
    // fal responde 200 con el error dentro del cuerpo; el adapter debe traducirlo.
    const { recortarFondo } = await import("./fal");
    const r = await recortarFondo("https://closetai.lat/no-existe-esta-imagen.jpg");
    expect(r.ok).toBe(false);
    if (!r.ok) console.log("motivo:", r.motivo);
  });
});

describe("categoriaParaTryon", () => {
  it("mapea las categorías del catalogador a las de FASHN", async () => {
    const { categoriaParaTryon } = await import("./fal");
    expect(categoriaParaTryon("top")).toBe("tops");
    expect(categoriaParaTryon("abrigo")).toBe("tops");
    expect(categoriaParaTryon("bottom")).toBe("bottoms");
    expect(categoriaParaTryon("vestido")).toBe("one-pieces");
  });

  it("devuelve null para lo que no se puede probar virtualmente", async () => {
    const { categoriaParaTryon } = await import("./fal");
    // Decirlo claro es mejor que devolver un render deforme.
    expect(categoriaParaTryon("calzado")).toBeNull();
    expect(categoriaParaTryon("bolsa")).toBeNull();
    expect(categoriaParaTryon("accesorio")).toBeNull();
    expect(categoriaParaTryon(null)).toBeNull();
  });
});

describe.skipIf(!process.env.PRUEBAS_VIVAS || !process.env.FAL_KEY)("try-on real (FASHN)", () => {
  it(
    "pone una prenda sobre la foto de una persona",
    { timeout: 180_000 },
    async () => {
      const { probarPrenda } = await import("./fal");

      // Imágenes de ejemplo del propio fal: la prueba mide que el modelo y el
      // adapter funcionen, no la calidad con fotos caseras — eso se verifica
      // con una foto real, que es un paso humano.
      const r = await probarPrenda({
        fotoUsuaria: "https://storage.googleapis.com/falserverless/example_inputs/model.png",
        fotoPrenda: "https://storage.googleapis.com/falserverless/example_inputs/garment.webp",
        categoria: "tops",
      });

      console.log("try-on:", JSON.stringify(r).slice(0, 240));
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.datos.images[0].url).toMatch(/^https?:\/\//);
      }
    },
  );
});

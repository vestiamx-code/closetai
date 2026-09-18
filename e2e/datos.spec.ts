import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

import { cargarEnv } from "./entorno";

/**
 * Lo que la base le da a una cuenta nueva, antes de que la persona toque nada.
 *
 * Nace de un bug real: la migración 001 declaraba la ciudad por omisión como
 * 'Ciudad de México', pero al aplicarse en la Semana 0 el texto se leyó como
 * Mac Roman y la base guardó «Ciudad de M√©xico». Toda cuenta nueva nacía así y
 * lo mostraba en «Qué me pongo hoy». Ninguna prueba lo vio durante un mes,
 * porque ninguna leía la ciudad: el clima funcionaba igual. Lo destapó la suite
 * del estilista el 18-sep-2026.
 *
 * Esta prueba no puede usar una cuenta existente: tiene que ser recién creada,
 * porque lo que se prueba es el valor por omisión de la base.
 */

cargarEnv();

const URL_SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const LLAVE = process.env.SUPABASE_SERVICE_ROLE_KEY;

test.describe("Datos de una cuenta nueva", () => {
  test.skip(!URL_SUPABASE || !LLAVE, "Faltan credenciales: la prueba se salta");
  test("nace con la ciudad bien escrita, byte por byte", async () => {
    // Crea y borra una cuenta: no depende del navegador, basta con correrla una vez.
    test.skip(test.info().project.name !== "desktop-chrome", "Solo corre en un perfil");

    const admin = createClient(URL_SUPABASE!, LLAVE!, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data, error } = await admin.auth.admin.createUser({
      email: `e2e-datos-${Date.now()}@closetai.lat`,
      password: "Prueba-Datos-2026!",
      email_confirm: true,
    });
    if (error) throw error;
    const id = data.user!.id;

    try {
      const { data: perfil } = await admin.from("profiles").select("city").eq("id", id).single();
      const ciudad = perfil?.city ?? "";
      // Se comparan los bytes, no solo el texto: así el mensaje dice exactamente qué llegó.
      expect(
        Buffer.from(ciudad, "utf8").toString("hex"),
        `la cuenta nueva nació con ${JSON.stringify(ciudad)}`,
      ).toBe(Buffer.from("Ciudad de México", "utf8").toString("hex"));
    } finally {
      await admin.auth.admin.deleteUser(id);
    }
  });
});

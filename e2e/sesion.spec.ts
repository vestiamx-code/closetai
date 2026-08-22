import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

import { cargarEnv } from "./entorno";

/**
 * Regresión: la sesión tiene que sobrevivir a navegar entre rutas privadas.
 *
 * En producción se caía sola. `proxy.ts` redirige en dos casos, y en ambos
 * devolvía un `NextResponse.redirect()` nuevo, sin las cookies que `getUser()`
 * acababa de refrescar. Supabase rota el token: al descartar el nuevo, el
 * navegador se quedaba con uno ya anulado y la siguiente navegación aparecía
 * como si nunca hubiera entrado.
 *
 * No lo detectamos antes porque las pruebas comprobaban que la página "cargara
 * sin error" — y la pantalla de inicio de sesión carga perfectamente. Por eso
 * aquí se afirma lo contrario: que el formulario de entrar NO está.
 */

cargarEnv();

const URL_SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const LLAVE_SERVICIO = process.env.SUPABASE_SERVICE_ROLE_KEY;
const hayCredenciales = Boolean(URL_SUPABASE && LLAVE_SERVICIO);

const CORREO = `e2e-sesion-${Date.now()}@closetai.lat`;
const CONTRASENA = "Prueba-Sesion-2026!";

const RUTAS_PRIVADAS = ["/closet", "/hoy", "/estilo", "/probar", "/comprar", "/perfil"];

test.describe.configure({ mode: "serial" });

test.describe("La sesión sobrevive", () => {
  test.skip(!hayCredenciales, "Faltan credenciales: la prueba se salta");

  let userId = "";
  const admin = () =>
    createClient(URL_SUPABASE!, LLAVE_SERVICIO!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

  test.beforeAll(async () => {
    const { data, error } = await admin().auth.admin.createUser({
      email: CORREO,
      password: CONTRASENA,
      email_confirm: true,
      user_metadata: { full_name: "Prueba Sesión" },
    });
    if (error) throw error;
    userId = data.user!.id;
  });

  test.afterAll(async () => {
    if (userId) await admin().auth.admin.deleteUser(userId);
  });

  test("después de entrar, ninguna ruta privada vuelve a pedir contraseña", async ({ page }) => {
    await page.goto("/entrar");
    await page.getByLabel("Correo").fill(CORREO);
    await page.getByLabel("Contraseña").fill(CONTRASENA);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/closet/);

    for (const ruta of RUTAS_PRIVADAS) {
      await page.goto(ruta);
      // Lo que importa: seguimos donde pedimos, no en /entrar.
      await expect(page, `la sesión se cayó al ir a ${ruta}`).toHaveURL(new RegExp(`${ruta}$`));
      // Y no hay campo de contraseña, que es como se veía la falla.
      await expect(page.getByLabel("Contraseña")).toHaveCount(0);
    }
  });

  test("volver a /entrar con sesión te manda al clóset y la sesión sigue viva", async ({ page }) => {
    await page.goto("/entrar");
    await page.getByLabel("Correo").fill(CORREO);
    await page.getByLabel("Contraseña").fill(CONTRASENA);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/closet/);

    // Esta es la redirección que borraba las cookies refrescadas.
    await page.goto("/entrar");
    await expect(page).toHaveURL(/\/closet/);

    await page.goto("/perfil");
    await expect(page).toHaveURL(/\/perfil$/);
    await expect(page.getByLabel("Contraseña")).toHaveCount(0);
  });
  /**
   * Esta es la prueba que de verdad fija la falla.
   *
   * El fallo solo aparece cuando Supabase **rota** el token, y eso solo pasa
   * cuando el de acceso ya venció. Recién entrada nunca vence: por eso vivió
   * hasta producción sin que ninguna prueba lo tocara.
   *
   * Y no basta con comprobar que la navegación "funciona": Supabase acepta el
   * mismo refresh token repetido durante unos segundos, así que la petición
   * siguiente alcanza a reparar la cookie y la falla queda tapada. Cuando ese
   * margen se agota — en producción, con arranques en frío de por medio — la
   * sesión se muere.
   *
   * Por eso aquí se afirma lo estrecho y exacto: la **respuesta de redirección**
   * tiene que traer la cookie nueva. Es justo el invariante que se rompía.
   */
  test("la redirección misma entrega el token rotado", async ({ page, context }) => {
    await page.goto("/entrar");
    await page.getByLabel("Correo").fill(CORREO);
    await page.getByLabel("Contraseña").fill(CONTRASENA);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/closet/);

    const sesion = (await context.cookies()).find((c) => /^sb-.*-auth-token(\.0)?$/.test(c.name));
    expect(sesion, "no se encontró la cookie de sesión").toBeTruthy();

    // @supabase/ssr guarda `base64-<json en base64url>`.
    const crudo = decodeURIComponent(sesion!.value);
    expect(crudo.startsWith("base64-"), `formato inesperado: ${crudo.slice(0, 12)}`).toBe(true);
    const json = JSON.parse(Buffer.from(crudo.slice("base64-".length), "base64url").toString("utf8"));

    // Envejecer el token de acceso; el refresh token sigue vivo.
    json.expires_at = Math.floor(Date.now() / 1000) - 60;
    json.expires_in = 0;
    await context.addCookies([
      { ...sesion!, value: "base64-" + Buffer.from(JSON.stringify(json), "utf8").toString("base64url") },
    ]);

    // Capturar la redirección de /entrar -> /closet, que es la rama culpable.
    // `headersArray()` es asíncrono, así que se guardan las respuestas y se leen
    // las cabeceras después de navegar.
    const redirecciones: import("@playwright/test").Response[] = [];
    page.on("response", (r) => {
      if (r.status() >= 300 && r.status() < 400) redirecciones.push(r);
    });

    await page.goto("/entrar");
    await expect(page).toHaveURL(/\/closet/);

    const laRedireccion = redirecciones.find((r) => new URL(r.url()).pathname === "/entrar");
    expect(laRedireccion, "no hubo redirección desde /entrar").toBeTruthy();
    const cabeceras = await laRedireccion!.headersArray();
    const traeSesion = cabeceras.some(
      (h) => h.name.toLowerCase() === "set-cookie" && /^sb-.*-auth-token/.test(h.value),
    );
    expect(
      traeSesion,
      "la redirección se fue sin la cookie refrescada: el navegador se queda con el token anulado",
    ).toBe(true);

    await page.goto("/perfil");
    await expect(page).toHaveURL(/\/perfil$/);
    await expect(page.getByLabel("Contraseña")).toHaveCount(0);
  });
});

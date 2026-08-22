import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { supabaseConfigured } from "@/lib/supabase/env";

/**
 * En Next 16 este archivo se llama `proxy.ts`, no `middleware.ts`.
 * `middleware.js` quedó deprecado y renombrado; la documentación de esta versión
 * lo dice explícitamente. Todos los tutoriales de Supabase todavía usan el nombre
 * viejo: con ese nombre el archivo no se ejecutaría y la sesión nunca se
 * refrescaría — sin un solo error visible.
 *
 * Hace dos cosas:
 *   1. Refresca el token de la sesión antes de renderizar (los Server Components
 *      no pueden escribir cookies, así que este es el único lugar donde se puede).
 *   2. Manda a `/entrar` a quien no tenga sesión y quiera entrar a la app.
 */

/** Rutas que exigen sesión iniciada. */
const RUTAS_PRIVADAS = ["/closet", "/hoy", "/estilo", "/perfil", "/probar", "/comprar", "/admin"];

/** Rutas de autenticación: si ya tienes sesión, no tiene sentido volver a ellas. */
const RUTAS_DE_ENTRADA = ["/entrar", "/registro"];

export async function proxy(request: NextRequest) {
  const { pathname: rutaPedida } = request.nextUrl;

  // Sin configuración de Supabase no hay cuentas posibles. Puede pasar en el
  // build de CI, o en un despliegue al que todavía no se le cargaron las
  // variables. En vez de reventar con un 500 en producción, la app se comporta
  // como lo que es en ese momento: una landing. La rama principal nunca queda rota.
  if (!supabaseConfigured()) {
    const necesitaCuenta = [...RUTAS_PRIVADAS, ...RUTAS_DE_ENTRADA].some((r) =>
      rutaPedida.startsWith(r),
    );
    if (!necesitaCuenta) return NextResponse.next();

    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Sobre HTTPS las cookies de sesión tienen que ir marcadas `Secure`. En
  // local (http://localhost) no, o el navegador las descarta.
  const esHttps = request.nextUrl.protocol === "https:";

  let response = NextResponse.next({ request });

  /**
   * Redirigir SIN perder la sesión.
   *
   * `getUser()` puede rotar el token: Supabase devuelve uno nuevo y anula el
   * anterior. Esas cookies nuevas se escriben en `response`. Si redirigimos con
   * un `NextResponse.redirect()` recién creado, se van sin las cookies: el
   * navegador se queda con el token viejo, que ya no sirve, y la sesión se cae
   * sola en la siguiente navegación. Hay que copiarlas a mano.
   */
  const redirigirConSesion = (url: URL) => {
    const redireccion = NextResponse.redirect(url);
    for (const cookie of response.cookies.getAll()) {
      redireccion.cookies.set(cookie);
    }
    return redireccion;
  };

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, { ...options, secure: esHttps });
          }
        },
      },
    },
  );

  // getUser() valida el token contra Supabase. getSession() solo lee la cookie,
  // que el navegador puede haber manipulado: no sirve para decidir accesos.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = rutaPedida;

  if (!user && RUTAS_PRIVADAS.some((ruta) => pathname.startsWith(ruta))) {
    const url = request.nextUrl.clone();
    url.pathname = "/entrar";
    // Para regresarla a donde iba después de iniciar sesión.
    url.searchParams.set("destino", pathname);
    return redirigirConSesion(url);
  }

  if (user && RUTAS_DE_ENTRADA.some((ruta) => pathname.startsWith(ruta))) {
    const url = request.nextUrl.clone();
    url.pathname = "/closet";
    url.search = "";
    return redirigirConSesion(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Todo menos archivos estáticos e imágenes: cada ejecución cuesta, y refrescar
     * la sesión al pedir un .png no sirve de nada.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)",
  ],
};

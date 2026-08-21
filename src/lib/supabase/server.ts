import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { supabaseAnonKey, supabaseUrl } from "./env";

/**
 * Cliente para Server Components, Server Actions y Route Handlers.
 * Actúa con la sesión de la usuaria: RLS aplica igual que en el navegador.
 *
 * En Next 16 `cookies()` es asíncrona, de ahí el await.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Los Server Components no pueden escribir cookies. No es un problema:
          // el refresco de sesión lo hace `proxy.ts` antes de renderizar.
        }
      },
    },
  });
}

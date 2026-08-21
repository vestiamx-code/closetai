import "server-only";

import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { createClient } from "./supabase/server";

/**
 * Devuelve la usuaria de la sesión, o la manda a iniciar sesión.
 *
 * `proxy.ts` ya bloquea las rutas privadas, pero las Server Actions son
 * alcanzables por POST directo sin pasar por una página — la documentación de
 * Next lo advierte. Por eso cada acción vuelve a comprobar aquí. La verificación
 * duplicada es intencional.
 */
export async function requireUser(): Promise<User> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/entrar");
  return user;
}

/** La usuaria si hay sesión, `null` si no. Para pantallas que sirven a ambas. */
export async function getUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

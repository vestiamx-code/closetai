/**
 * Lectura perezosa de la configuración de Supabase.
 *
 * A propósito NO se leen las variables al importar el módulo: el build de
 * producción se ejecuta sin secretos (en CI y en el primer deploy de Vercel), y
 * si esto explotara al importarse, la rama principal quedaría rota. Falla solo
 * cuando alguien de verdad intenta hablar con Supabase.
 */

export function supabaseUrl(): string {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!value) throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL");
  return value;
}

export function supabaseAnonKey(): string {
  const value = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!value) throw new Error("Falta NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return value;
}

export function supabaseServiceKey(): string {
  const value = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!value) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY");
  return value;
}

/** ¿Hay configuración suficiente para hablar con Supabase? */
export function supabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

"use client";

import { createBrowserClient } from "@supabase/ssr";

import { supabaseAnonKey, supabaseUrl } from "./env";

/**
 * Cliente para el navegador. Usa la llave pública: todo lo que pueda hacer está
 * limitado por las políticas RLS de la base de datos.
 */
export function createClient() {
  return createBrowserClient(supabaseUrl(), supabaseAnonKey());
}

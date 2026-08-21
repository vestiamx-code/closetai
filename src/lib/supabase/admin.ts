import "server-only";

import { createClient } from "@supabase/supabase-js";

import { supabaseServiceKey, supabaseUrl } from "./env";

/**
 * Cliente con la llave de servicio. **Se salta RLS por completo.**
 *
 * Solo para operaciones que la usuaria no puede hacer por sí misma y que el
 * servidor debe garantizar: abonar créditos tras un pago de Stripe, escribir
 * renders, registrar costos de API, borrar una cuenta con todo y archivos.
 *
 * Regla: cada llamada que use este cliente tiene que comprobar por su cuenta
 * de quién es el dato. Aquí no hay red de seguridad.
 */
export function createAdminClient() {
  return createClient(supabaseUrl(), supabaseServiceKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

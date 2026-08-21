-- ClosetAI — migración 004: corrige los permisos de las funciones de créditos.
--
-- La migración 002 hacía `revoke all on function … from public, anon, authenticated`
-- con la intención de que solo el servidor pudiera mover créditos. El error: en
-- Postgres el rol `public` no son "los visitantes", son TODOS los roles. Al
-- revocarle a `public` se le quitó el permiso también a `service_role`, que es
-- justamente quien necesita ejecutarlas.
--
-- Detectado el 20-ago-2026 probando el flujo real contra la base de producción:
-- `debit_credits` devolvía `42501 permission denied for function`.
--
-- La intención original se mantiene: NADIE que no sea el servidor puede tocar
-- créditos. Solo que ahora el servidor sí puede.

grant execute on function public.debit_credits(uuid, numeric, text, text) to service_role;
grant execute on function public.credit_balance(uuid) to service_role;

-- `credit_balance` recibe un uuid como parámetro y es SECURITY DEFINER: si se le
-- diera a `authenticated`, cualquier usuaria podría consultar el saldo de otra
-- pasando su id. El saldo del usuario se lee desde el servidor, o desde
-- `credit_ledger` con la sesión del propio usuario (RLS lo filtra).

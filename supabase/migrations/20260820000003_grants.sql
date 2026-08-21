-- ClosetAI — migración 003: privilegios de la Data API.
--
-- El proyecto se creó con "Automatically expose new tables" DESACTIVADO, que es
-- lo que Supabase recomienda: ninguna tabla queda accesible por accidente. El
-- costo es que hay que otorgar los privilegios a mano, aquí.
--
-- Modelo de seguridad en dos capas:
--   1. GRANT decide qué ROLES pueden tocar la tabla (esto).
--   2. RLS decide qué FILAS ve cada usuario (migración 001).
-- Un GRANT amplio con RLS estricta es el patrón normal de Supabase: sin política
-- que lo permita, la operación se deniega aunque el privilegio exista.

grant usage on schema public to anon, authenticated, service_role;

-- `anon` (visitante sin sesión) no recibe privilegios sobre ninguna tabla:
-- en ClosetAI no hay datos públicos. Solo necesita el esquema para el flujo de auth.

grant select, insert, update, delete on all tables in schema public
  to authenticated, service_role;

grant usage, select on all sequences in schema public
  to authenticated, service_role;

-- Las tablas que se creen después heredan lo mismo, para que una migración futura
-- no quede muda sin que nadie se dé cuenta.
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated, service_role;

alter default privileges in schema public
  grant usage, select on sequences to authenticated, service_role;

-- Semana 1 · Núcleo de estilo generado en /core
--
-- `/core` es público y guarda sin sesión: es justo lo que la función quiere
-- demostrar, que se puede recibir valor antes de registrarse. Eso obliga a ser
-- explícita con la seguridad en vez de apoyarse en "solo usuarias con cuenta".
--
--   · user_id es opcional: si alguien con sesión lo guarda, queda ligado.
--   · La lectura pública NO expone el texto que la persona escribió — solo el
--     núcleo generado. El texto de entrada puede ser muy personal.

create table if not exists public.core_outputs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,

  -- Lo que escribió la persona. Nunca se muestra en la lista pública.
  entrada text not null check (char_length(entrada) between 40 and 1000),

  -- El núcleo generado, ya validado por el contrato zod antes de llegar aquí.
  nucleo jsonb not null,

  modelo text,
  version_prompt int,
  created_at timestamptz not null default now()
);

create index if not exists core_outputs_created_idx on public.core_outputs (created_at desc);

alter table public.core_outputs enable row level security;

-- Cualquiera puede leer los núcleos guardados: es la "dashboard preview" de la
-- página pública. La columna `entrada` se protege en la vista, no aquí.
create policy "núcleos visibles para todos"
  on public.core_outputs for select
  using (true);

-- Escribir solo desde el servidor (service_role). Sin esto, cualquiera podría
-- insertar filas directo contra la API de Supabase saltándose el contrato zod
-- y el límite por IP.
revoke insert, update, delete on public.core_outputs from anon, authenticated;

grant select on public.core_outputs to anon, authenticated;
grant all on public.core_outputs to service_role;

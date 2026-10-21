-- Semana 4 · Motor de marketing y experimento A/B de la portada
--
-- Tres tablas:
--   · marketing_assets: el contenido (posts, guiones, días del calendario, el texto
--     de la portada) y lo que genere el generador. Lectura pública: todas sus
--     columnas son públicas.
--   · ab_experiments: los experimentos y sus variantes. Lectura pública.
--   · ab_events: una vista y un clic por visitante. SIN lectura pública: guarda el
--     hash de un id de visitante, y la regla desde la Semana 3 es que una tabla se
--     abre a la llave pública solo si todas sus columnas son públicas.
--
-- Escritura: solo service_role, en las tres.

-- ---------------------------------------------------------------------------
-- Contenido de marketing
-- ---------------------------------------------------------------------------
create table if not exists public.marketing_assets (
  id text primary key check (id ~ '^[a-z0-9-]{2,60}$'),
  tipo text not null check (tipo in ('landing', 'post', 'guion', 'dia')),
  canal text check (canal is null or canal in ('instagram', 'tiktok')),
  formato text check (formato is null or formato in ('post', 'carrusel', 'video')),
  titulo text not null,
  cuerpo text not null default '',
  -- Láminas de un carrusel, tomas de un guion, hashtags, el día del calendario y
  -- la pieza que se publica ese día. jsonb porque cada tipo trae lo suyo.
  detalle jsonb not null default '{}'::jsonb,
  -- Quién lo escribió y si una persona lo aprobó. El generador siempre guarda
  -- 'generado_ia' con aprobado = false: aprobarlo es trabajo de una persona.
  origen text not null check (origen in ('redactado_ia_aprobado', 'generado_ia')),
  aprobado boolean not null default false,
  aprobado_por text,
  aprobado_el date,
  constraint aprobado_lleva_quien check (not aprobado or (aprobado_por is not null and aprobado_el is not null)),
  constraint generado_no_nace_aprobado check (origen <> 'generado_ia' or not aprobado),
  orden smallint not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists marketing_assets_tipo_idx on public.marketing_assets (tipo, orden);

-- ---------------------------------------------------------------------------
-- Experimentos A/B
-- ---------------------------------------------------------------------------
create table if not exists public.ab_experiments (
  id text primary key check (id ~ '^[a-z0-9-]{2,40}$'),
  nombre text not null,
  hipotesis text not null,
  -- [{ "id": "a", "texto": "..." }, { "id": "b", "texto": "..." }]
  variantes jsonb not null check (jsonb_array_length(variantes) = 2),
  metrica text not null,
  inicio date not null,
  activo boolean not null default true
);

create table if not exists public.ab_events (
  id bigint generated always as identity primary key,
  experimento text not null references public.ab_experiments(id),
  variante text not null check (variante in ('a', 'b')),
  evento text not null check (evento in ('vista', 'clic')),
  visitante_hash text not null check (visitante_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  -- La unidad del experimento es la persona, no la recarga: una vista y un clic
  -- por visitante. Sin esto, alguien que recarga diez veces movería el resultado.
  constraint un_evento_por_visitante unique (experimento, visitante_hash, evento)
);

create index if not exists ab_events_conteo_idx on public.ab_events (experimento, variante, evento);

-- ---------------------------------------------------------------------------
-- Permisos
-- ---------------------------------------------------------------------------
alter table public.marketing_assets enable row level security;
alter table public.ab_experiments enable row level security;
alter table public.ab_events enable row level security;

create policy "contenido visible para todos" on public.marketing_assets for select using (true);
create policy "experimentos visibles para todos" on public.ab_experiments for select using (true);
-- ab_events no lleva policy de lectura.

revoke insert, update, delete on public.marketing_assets from anon, authenticated;
revoke insert, update, delete on public.ab_experiments from anon, authenticated;
revoke all on public.ab_events from anon, authenticated;

grant select on public.marketing_assets to anon, authenticated;
grant select on public.ab_experiments to anon, authenticated;
grant all on public.marketing_assets, public.ab_experiments, public.ab_events to service_role;

-- ---------------------------------------------------------------------------
-- El experimento de la portada (decidido por Tamara el 21 de octubre de 2026)
-- ---------------------------------------------------------------------------
insert into public.ab_experiments (id, nombre, hipotesis, variantes, metrica, inicio, activo) values
  ('titular', 'Titular de la portada',
   'El lenguaje de una clienta real («no sé qué ponerme») convence más que el lenguaje de marca.',
   '[{"id": "a", "texto": "Tu estilista, en tu bolsillo."}, {"id": "b", "texto": "Ya tienes qué ponerte."}]'::jsonb,
   'Visitantes que hacen clic en «Empezar gratis», sobre visitantes que vieron la portada',
   '2026-10-21', true)
on conflict (id) do update set
  nombre = excluded.nombre, hipotesis = excluded.hipotesis, variantes = excluded.variantes,
  metrica = excluded.metrica;

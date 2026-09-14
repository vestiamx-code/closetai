-- Semana 2 · Investigación y benchmarking en /research
--
-- La investigación de mercado deja de vivir en un markdown y pasa a la base de
-- datos, porque en esta semana es evidencia: cada fila trae la fuente que la
-- sostiene y la fecha en que alguien la abrió y la comprobó.
--
-- Fuente de verdad: docs/evidencia/INVESTIGACION-SEMANA-2.md. Ningún dato entra
-- aquí sin estar allá con su fuente.
--
-- Seguridad, igual que core_outputs:
--   · lectura pública — /research es público;
--   · escritura solo desde el servidor. Sin esto, cualquiera podría insertar un
--     "competidor" directo contra la API y aparecería en la página como verificado.

-- ---------------------------------------------------------------------------
-- Competidores, sustitutos, referentes y datos de mercado
-- ---------------------------------------------------------------------------
create table if not exists public.research_sources (
  id text primary key check (id ~ '^[a-z0-9-]{2,40}$'),
  nombre text not null,
  tipo text not null check (tipo in ('competidor', 'sustituto', 'referente', 'mercado')),
  pais text,
  dato_clave text not null,
  precio text,
  leccion text,
  amenaza smallint check (amenaza between 1 and 3),
  referente_global boolean not null default false,
  de_mexico boolean not null default false,
  fuente_nombre text not null,
  fuente_url text not null check (fuente_url ~ '^https://'),
  fuente_extra_url text check (fuente_extra_url is null or fuente_extra_url ~ '^https://'),
  verificado_el date not null,
  orden smallint not null default 0
);

-- ---------------------------------------------------------------------------
-- Riesgos: probabilidad × impacto, cada uno atado a su evidencia
-- ---------------------------------------------------------------------------
create table if not exists public.research_risks (
  id text primary key check (id ~ '^[a-z0-9-]{2,40}$'),
  riesgo text not null,
  probabilidad smallint not null check (probabilidad between 1 and 3),
  impacto smallint not null check (impacto between 1 and 3),
  mitigacion text not null,
  -- ids de research_sources. Postgres no permite llave foránea sobre un arreglo;
  -- una prueba e2e comprueba que cada id exista.
  evidencia text[] not null default '{}'
);

-- ---------------------------------------------------------------------------
-- Conversaciones reales de validación
--
-- NO se siembra. La llena Tamara con una conversación que de verdad ocurrió.
-- El check de consentimiento no es decorativo: sin permiso, la fila no entra.
-- ---------------------------------------------------------------------------
create table if not exists public.validation_conversations (
  id uuid primary key default gen_random_uuid(),
  fecha date not null,
  perfil text not null,
  citas text[] not null check (cardinality(citas) >= 1),
  confirmo text,
  contradijo text,
  sorpresa text,
  consentimiento boolean not null check (consentimiento),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Informes guardados desde la página
-- ---------------------------------------------------------------------------
create table if not exists public.research_outputs (
  id uuid primary key default gen_random_uuid(),
  pregunta text not null check (char_length(pregunta) between 20 and 500),
  -- Ya validado por el contrato zod —y sus citas contra research_sources— antes de llegar aquí.
  informe jsonb not null,
  modelo text,
  version_prompt int,
  created_at timestamptz not null default now()
);

create index if not exists research_outputs_created_idx on public.research_outputs (created_at desc);

-- ---------------------------------------------------------------------------
-- RLS y permisos
-- ---------------------------------------------------------------------------
alter table public.research_sources enable row level security;
alter table public.research_risks enable row level security;
alter table public.validation_conversations enable row level security;
alter table public.research_outputs enable row level security;

create policy "investigación visible para todos" on public.research_sources for select using (true);
create policy "riesgos visibles para todos" on public.research_risks for select using (true);
create policy "validaciones visibles para todos" on public.validation_conversations for select using (true);
create policy "informes visibles para todos" on public.research_outputs for select using (true);

-- `from anon, authenticated` y no `from public`: en Postgres `public` son todos
-- los roles, service_role incluido. Ya nos pasó en la Semana 0.
revoke insert, update, delete on public.research_sources from anon, authenticated;
revoke insert, update, delete on public.research_risks from anon, authenticated;
revoke insert, update, delete on public.validation_conversations from anon, authenticated;
revoke insert, update, delete on public.research_outputs from anon, authenticated;

grant select on public.research_sources, public.research_risks,
  public.validation_conversations, public.research_outputs to anon, authenticated;
grant all on public.research_sources, public.research_risks,
  public.validation_conversations, public.research_outputs to service_role;

-- ---------------------------------------------------------------------------
-- Datos verificados el 14-sep-2026
-- ---------------------------------------------------------------------------
insert into public.research_sources
  (id, nombre, tipo, pais, dato_clave, precio, leccion, amenaza, referente_global, de_mexico,
   fuente_nombre, fuente_url, fuente_extra_url, verificado_el, orden)
values
  ('whering', 'Whering', 'competidor', 'Reino Unido',
   '10 millones de usuarios, sobre todo Gen Z; ronda de 7 M USD en julio de 2026 con eBay Ventures y Google AI Futures Fund',
   'Freemium', 'El clóset gratis escala: es la puerta de entrada, no el producto', 3, true, false,
   'tech.eu', 'https://tech.eu/2026/07/07/whering-lands-7m-as-digital-wardrobe-platform-reaches-10m-users/', null,
   '2026-09-14', 10),

  ('acloset', 'Acloset', 'competidor', 'Corea del Sur',
   '4.4 estrellas con 5.1 mil calificaciones en App Store; la ficha declara que tiene publicidad',
   '$3.99 a $24.99 USD al mes', 'Cobrar por tamaño de clóset castiga a quien más catalogó', 2, false, false,
   'App Store', 'https://apps.apple.com/us/app/acloset-ai-fashion-assistant/id1542311809', null,
   '2026-09-14', 20),

  ('stylebook', 'Stylebook', 'competidor', 'Estados Unidos',
   'Pago único, sin suscripción; solo funciona en iPhone y iPad',
   '$4.99 USD una sola vez', 'El pago único barato es un modelo que existe y dura', 1, true, false,
   'Stylebook (FAQ)', 'https://www.stylebookapp.com/faq.html', null,
   '2026-09-14', 30),

  ('style-dna', 'Style DNA', 'competidor', 'Reino Unido',
   '3 M USD de ingreso anual a fines de 2023; 300 mil usuarios activos y 70 mil de pago',
   'Freemium más comisión', 'El nicho monetiza, pero no sin capital: ahorros, luego ángeles y un fondo', 2, true, false,
   'Starter Story', 'https://www.starterstory.com/stories/your-personal-ai-stylist-app', null,
   '2026-09-14', 40),

  ('alta', 'Alta', 'competidor', 'Estados Unidos',
   'Ronda semilla de 11 M USD en junio de 2025, liderada por Menlo Ventures y con el fondo de la familia Arnault',
   null, 'El capital apuesta por estilista más compra, en Estados Unidos', 2, false, false,
   'TechCrunch', 'https://techcrunch.com/2025/06/16/alta-raises-11m-to-bring-clueless-fashion-tech-to-life-with-all-star-investors/', null,
   '2026-09-14', 50),

  ('doji', 'Doji', 'competidor', 'Estados Unidos',
   'Ronda semilla de 14 M USD en mayo de 2025, liderada por Thrive Capital; por invitación en más de 80 países',
   null, 'El try-on con avatar es la apuesta más capitalizada de la categoría', 2, false, false,
   'TechCrunch', 'https://techcrunch.com/2025/05/15/doji-raises-14m-to-make-virtual-try-ons-fun-through-ai-avatars', null,
   '2026-09-14', 60),

  ('indyx', 'Indyx', 'competidor', 'Estados Unidos',
   'Catalogar tu clóset es gratis; por 295 USD ellos catalogan 100 prendas por ti',
   'Estilista desde $15 USD al mes', 'Hay quien paga 295 USD por no fotografiar su ropa: la fricción es real', 1, true, false,
   'Indyx', 'https://www.myindyx.com/how-it-works', null,
   '2026-09-14', 70),

  ('apps-espanol', 'Apps de clóset en español', 'competidor', 'Varios',
   'Existen en App Store con interfaz en español; ninguna de las revisadas se presenta con tallas, tiendas o precios de México',
   'Variable', 'Traducir no es localizar: el hueco no es el idioma, es México', 2, false, true,
   'App Store', 'https://apps.apple.com/us/app/ia-outfit-planner-estilista/id6748238625?l=es-MX',
   'https://apps.apple.com/ni/app/cl%C3%B3set-virtual-y-outfits/id6761612983',
   '2026-09-14', 80),

  ('closet-ai-ios', 'Closet AI – Outfit Planner', 'competidor', null,
   'Una app con el mismo nombre en iPhone; menos de mil descargas',
   'Pro a $4.99 USD al mes', 'Mismo nombre en la misma tienda', 2, false, false,
   'Ficha de la app', 'https://mwm.ai/es/apps/closet-ai-outfit-planner/6761792851', null,
   '2026-09-14', 90),

  ('google-tryon', 'Try-on de Google', 'sustituto', 'Estados Unidos',
   'Google cerró Doppl el 30 de abril de 2026 y pasó el try-on a su buscador; reportado en Latinoamérica en mayo de 2026, sin confirmar México por nombre',
   'Gratis', 'Si Google regala el try-on, el valor tiene que venir de tu clóset', 3, true, false,
   'Google Labs', 'https://support.google.com/labs/answer/16537062?hl=en',
   'https://www.thetechoutlook.com/new-release/software-apps/googles-virtual-try-on-feature-now-available-in-latin-america/',
   '2026-09-14', 100),

  ('gotrendier', 'GoTrendier', 'sustituto', 'México',
   'Más de 8 millones de usuarios; 4.6 estrellas con 74 mil calificaciones en App Store México',
   'Comisión de 14% más $14 MXN', 'La segunda mano ya tiene escala en México: integrarla, no competirle', 1, false, true,
   'App Store México', 'https://apps.apple.com/mx/app/gotrendier-compra-y-vende-moda/id1110389914', null,
   '2026-09-14', 110),

  ('chicisimo', 'Chicisimo', 'referente', 'España',
   'Fundada en 2010; cerró en 2020 sin encontrar comprador',
   null, 'Murió sin monetizar; sus fundadores dijeron que se les escapó la segunda mano', 1, false, false,
   'Capital', 'https://capital.es/2020/10/22/cierra-la-start-up-espanola-de-moda-chicisimo/', null,
   '2026-09-14', 120),

  ('mx-compradores', 'Compradores digitales en México', 'mercado', 'México',
   'Más de 77 millones en 2025; eran 37 millones en 2018',
   null, 'El canal existe y se duplicó en siete años', null, false, true,
   'Milenio con datos de AMVO', 'https://www.milenio.com/negocios/mexico-supera-77-millones-compradores-digitales-2025-amvo', null,
   '2026-09-14', 200),

  ('mx-ropa', 'Ropa en línea en México', 'mercado', 'México',
   'El 59% de los compradores digitales compra ropa',
   null, 'La ropa ya se compra en línea: no hay que convencer a nadie de eso', null, false, true,
   'Milenio con datos de AMVO', 'https://www.milenio.com/negocios/mexico-supera-77-millones-compradores-digitales-2025-amvo', null,
   '2026-09-14', 210),

  ('mx-satisfaccion', 'Experiencia de compra de moda en línea', 'mercado', 'México',
   'Más del 50% planeó comprar moda en línea, pero solo el 35% calificó su experiencia como muy satisfactoria',
   null, 'Hay interés y hay insatisfacción: ese espacio es el hueco', null, false, true,
   'AMVO', 'https://blog.amvo.org.mx/blog/moda-en-ecommerce-2025-alto-inter%C3%A9s-baja-conversi%C3%B3n', null,
   '2026-09-14', 220)
on conflict (id) do update set
  nombre = excluded.nombre, tipo = excluded.tipo, pais = excluded.pais,
  dato_clave = excluded.dato_clave, precio = excluded.precio, leccion = excluded.leccion,
  amenaza = excluded.amenaza, referente_global = excluded.referente_global,
  de_mexico = excluded.de_mexico, fuente_nombre = excluded.fuente_nombre,
  fuente_url = excluded.fuente_url, fuente_extra_url = excluded.fuente_extra_url,
  verificado_el = excluded.verificado_el, orden = excluded.orden;

insert into public.research_risks (id, riesgo, probabilidad, impacto, mitigacion, evidencia)
values
  ('friccion', 'La gente abandona antes de catalogar su ropa', 3, 3,
   '/core da valor sin fotos; captura por lotes; 10 prendas para empezar', '{indyx}'),
  ('google-gratis', 'Google regala el try-on en su buscador', 3, 2,
   'El try-on no es el producto; el producto es vestirte con lo que ya tienes', '{google-tryon}'),
  ('nombre', 'Ya existe una app llamada «Closet AI»', 3, 2,
   'Verificar en el IMPI y decidir el nombre antes de invertir en marca', '{closet-ai-ios}'),
  ('capital', 'Competidores con 7 a 14 M USD de capital', 3, 2,
   'Competir donde no están: México, español y presupuesto', '{whering,alta,doji}'),
  ('whering-mx', 'Whering llega en serio a México', 2, 3,
   'Localización real —tallas, tiendas, precios en MXN— que traducir no da', '{whering,apps-espanol}'),
  ('monetizar', 'Nadie paga', 2, 3,
   'Pago único de $100 MXN; validarlo en conversaciones reales antes de subir el precio', '{chicisimo,stylebook,style-dna}'),
  ('satisfaccion', 'Mucho interés en moda en línea, poca satisfacción', 2, 2,
   'Prometer menos y mostrar el resultado antes de cobrar', '{mx-satisfaccion}')
on conflict (id) do update set
  riesgo = excluded.riesgo, probabilidad = excluded.probabilidad, impacto = excluded.impacto,
  mitigacion = excluded.mitigacion, evidencia = excluded.evidencia;

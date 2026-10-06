-- Semana 3 · Arquitectura de producto y simulador de precios (/product y /pricing)
--
-- Cuatro tablas. Tres son contenido verificable —planes, funciones y supuestos—;
-- la cuarta guarda los escenarios que la gente simula.
--
-- Seguridad, con una diferencia respecto a las semanas anteriores:
--   · planes, funciones y supuestos: lectura pública (son la página);
--   · escenarios: NI SIQUIERA lectura pública. La página los muestra, pero los
--     lee el servidor. La razón es la fila misma: guarda el hash de la IP de
--     quien simuló, y eso no tiene por qué estar al alcance de cualquiera con la
--     llave pública. En la Semana 1, `core_outputs` se dejó con lectura abierta
--     "porque la columna se protege en la vista" y el texto de la gente quedó
--     legible desde fuera. Esta tabla no repite ese error.
--   · escritura: solo service_role, en las cuatro.

-- ---------------------------------------------------------------------------
-- Los tres planes
-- ---------------------------------------------------------------------------
create table if not exists public.pricing_plans (
  id text primary key check (id ~ '^[a-z0-9-]{2,40}$'),
  nombre text not null,
  precio_mxn integer not null check (precio_mxn >= 0),
  -- 'gratis' no cobra; 'unico' se cobra una sola vez; 'recarga' se puede repetir.
  cobro text not null check (cobro in ('gratis', 'unico', 'recarga')),
  resumen text not null,
  incluye text[] not null check (cardinality(incluye) >= 1),
  -- Qué nos cuesta servir este plan. Va en la página: un precio sin su costo
  -- al lado es una opinión.
  costo_nota text not null,
  orden smallint not null default 0
);

-- ---------------------------------------------------------------------------
-- Mapa de funciones: qué hace ClosetAI, en qué plan entra y si ya existe
-- ---------------------------------------------------------------------------
create table if not exists public.pricing_features (
  id text primary key check (id ~ '^[a-z0-9-]{2,40}$'),
  nombre text not null,
  descripcion text not null,
  grupo text not null check (grupo in ('closet', 'estilista', 'probador', 'compras', 'publico')),
  plan_id text not null references public.pricing_plans(id),
  -- El estado es honesto a propósito: 'planeado' significa que no existe.
  estado text not null check (estado in ('vivo', 'esta_semana', 'planeado')),
  ruta text check (ruta is null or ruta ~ '^/'),
  orden smallint not null default 0
);

-- ---------------------------------------------------------------------------
-- Supuestos del simulador: cada número con su origen y si está verificado
-- ---------------------------------------------------------------------------
create table if not exists public.pricing_assumptions (
  id text primary key check (id ~ '^[a-z0-9-]{2,40}$'),
  concepto text not null,
  valor text not null,
  origen text not null,
  fuente_url text check (fuente_url is null or fuente_url ~ '^https://'),
  verificado boolean not null default false,
  verificado_el date,
  -- Decir "verificado" sin fecha es exactamente lo que esta tabla evita.
  constraint verificado_lleva_fecha check (not verificado or verificado_el is not null),
  -- Si entra en la aritmética del simulador o solo da contexto.
  en_el_calculo boolean not null default true,
  orden smallint not null default 0
);

-- ---------------------------------------------------------------------------
-- Escenarios guardados
-- ---------------------------------------------------------------------------
create table if not exists public.pricing_scenarios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (char_length(btrim(nombre)) between 2 and 60),
  escenario text not null check (escenario in ('conservador', 'base', 'optimista')),
  -- Lo que se pidió y lo que calculó el servidor. Se guardan los dos para poder
  -- rehacer la cuenta después y ver si el modelo cambió.
  supuestos jsonb not null,
  resultado jsonb not null,
  -- El límite por hora necesita distinguir IPs, no conocerlas.
  ip_hash text not null check (ip_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now()
);

create index if not exists pricing_scenarios_creado_idx on public.pricing_scenarios (created_at desc);
create index if not exists pricing_scenarios_ip_idx on public.pricing_scenarios (ip_hash, created_at desc);

-- ---------------------------------------------------------------------------
-- Permisos
-- ---------------------------------------------------------------------------
alter table public.pricing_plans enable row level security;
alter table public.pricing_features enable row level security;
alter table public.pricing_assumptions enable row level security;
alter table public.pricing_scenarios enable row level security;

create policy "planes visibles para todos" on public.pricing_plans for select using (true);
create policy "funciones visibles para todos" on public.pricing_features for select using (true);
create policy "supuestos visibles para todos" on public.pricing_assumptions for select using (true);
-- pricing_scenarios no lleva policy de lectura: nadie la lee con la llave pública.

revoke insert, update, delete on public.pricing_plans from anon, authenticated;
revoke insert, update, delete on public.pricing_features from anon, authenticated;
revoke insert, update, delete on public.pricing_assumptions from anon, authenticated;
revoke all on public.pricing_scenarios from anon, authenticated;

grant select on public.pricing_plans to anon, authenticated;
grant select on public.pricing_features to anon, authenticated;
grant select on public.pricing_assumptions to anon, authenticated;
grant all on public.pricing_plans, public.pricing_features, public.pricing_assumptions,
  public.pricing_scenarios to service_role;

-- ---------------------------------------------------------------------------
-- Datos: los planes decididos en el Documento Maestro §2.3
-- ---------------------------------------------------------------------------
insert into public.pricing_plans (id, nombre, precio_mxn, cobro, resumen, incluye, costo_nota, orden) values
  ('gratis', 'Gratis', 0, 'gratis',
   'El clóset digital completo, para siempre. Nunca se cobra por trabajo que ya hiciste.',
   array[
     'Clóset ilimitado, con catalogación por IA',
     '3 outfits del día generados por IA',
     'Un try-on de muestra',
     'Núcleo de estilo e investigación, sin cuenta'
   ],
   'Nos cuesta ~0.01 USD por persona al mes. Catalogar una prenda cuesta ~0.0003 USD.', 1),

  ('completo', 'ClosetAI Completo', 100, 'unico',
   'Un solo pago, para siempre. La decisión de no cobrar mensualidad es deliberada.',
   array[
     'Estilista IA sin límite',
     'Avatar para probarte la ropa',
     '30 créditos de try-on',
     'Qué te falta en el clóset, con recomendaciones de compra'
   ],
   'Costo máximo comprometido por venta: 2.25 USD, si se usan los 30 créditos.', 2),

  ('recarga', 'Recarga de créditos', 49, 'recarga',
   'Para quien se acabó sus créditos y quiere seguir probándose ropa.',
   array['20 créditos de try-on', 'No caducan', 'Se puede repetir'],
   'Nos cuesta ~1.50 USD si se usan los 20 créditos.', 3)
on conflict (id) do update set
  nombre = excluded.nombre, precio_mxn = excluded.precio_mxn, cobro = excluded.cobro,
  resumen = excluded.resumen, incluye = excluded.incluye, costo_nota = excluded.costo_nota,
  orden = excluded.orden;

-- ---------------------------------------------------------------------------
-- Datos: el mapa de funciones. 'vivo' significa que hoy funciona en producción.
-- ---------------------------------------------------------------------------
insert into public.pricing_features (id, nombre, descripcion, grupo, plan_id, estado, ruta, orden) values
  ('catalogar', 'Catalogación por IA', 'Subes la foto de una prenda y la IA llena categoría, colores, patrón, material, temporadas y ocasiones.', 'closet', 'gratis', 'vivo', '/closet', 1),
  ('closet', 'Clóset digital', 'Todas tus prendas en un solo lugar, con el fondo recortado.', 'closet', 'gratis', 'vivo', '/closet', 2),
  ('hoy', 'Qué me pongo hoy', 'Outfits para el clima de tu ciudad, con lo que ya tienes.', 'estilista', 'gratis', 'vivo', '/hoy', 3),
  ('aprende', 'Aprende de tus reacciones', 'Cuando aceptas o rechazas un outfit, el estilista ajusta su idea de tu estilo.', 'estilista', 'gratis', 'vivo', '/hoy', 4),
  ('estilista', 'Estilista IA sin límite', 'Outfits sin tope diario y para la ocasión que le pidas.', 'estilista', 'completo', 'vivo', '/hoy', 5),
  ('avatar', 'Avatar de cuerpo completo', 'Tu foto base para probarte la ropa. Funciona sin que salga tu cara.', 'probador', 'completo', 'vivo', '/probar', 6),
  ('tryon', 'Probarte la ropa', 'Ves la prenda puesta en ti, conservando estampados y logos.', 'probador', 'completo', 'vivo', '/probar', 7),
  ('creditos', 'Créditos y su historial', 'Cada try-on gasta un crédito, y puedes ver en qué se fueron.', 'probador', 'recarga', 'vivo', '/comprar', 8),
  ('huecos', 'Qué te falta', 'Las prendas puente que multiplicarían tus combinaciones.', 'compras', 'completo', 'vivo', '/comprar', 9),
  ('recomendaciones', 'Recomendaciones de compra', 'Qué comprar y dónde, con precios en pesos.', 'compras', 'completo', 'vivo', '/comprar', 10),
  ('nucleo', 'Núcleo de estilo', 'Describes tu estilo en un párrafo y te devuelve tu núcleo. Sin cuenta.', 'publico', 'gratis', 'vivo', '/core', 11),
  ('investigacion', 'Investigación con fuentes', 'La evidencia de que el problema es real, con cada dato enlazado a su fuente.', 'publico', 'gratis', 'vivo', '/research', 12),
  ('mapa', 'Mapa del producto', 'Esta página: qué hace ClosetAI y en qué plan entra cada cosa.', 'publico', 'gratis', 'esta_semana', '/product', 13),
  ('simulador', 'Simulador de precios', 'Mueves los supuestos y ves qué pasa con el ingreso y el margen.', 'publico', 'gratis', 'esta_semana', '/pricing', 14),
  ('explorar', 'Modo explorar', 'Looks rápidos y más baratos, a media crédito, para cuando solo quieres ver ideas.', 'probador', 'completo', 'planeado', null, 15),
  ('afiliados', 'Compra desde la recomendación', 'Comprar en Amazon México o Mercado Libre desde la recomendación, con el tamaño correcto.', 'compras', 'gratis', 'planeado', null, 16)
on conflict (id) do update set
  nombre = excluded.nombre, descripcion = excluded.descripcion, grupo = excluded.grupo,
  plan_id = excluded.plan_id, estado = excluded.estado, ruta = excluded.ruta, orden = excluded.orden;

-- ---------------------------------------------------------------------------
-- Datos: los supuestos. La columna que importa es `verificado`.
-- ---------------------------------------------------------------------------
insert into public.pricing_assumptions (id, concepto, valor, origen, fuente_url, verificado, verificado_el, en_el_calculo, orden) values
  ('precio-completo', 'Precio del plan Completo', '100 MXN, una sola vez',
   'Decisión de producto del Documento Maestro §2.3; es lo que cobra Stripe hoy', null, true, '2026-08-20', true, 1),
  ('precio-recarga', 'Precio de la recarga', '49 MXN por 20 créditos',
   'Decisión de producto del Documento Maestro §2.3', null, true, '2026-08-20', true, 2),
  ('costo-render', 'Costo de un try-on', '0.075 USD por render',
   'Tarifa publicada de FASHN v1.6 en fal.ai', 'https://fal.ai/models/fal-ai/fashn/tryon/v1.6', true, '2026-08-20', true, 3),
  ('costo-catalogo', 'Costo de catalogar una prenda', '0.0003 USD',
   'Gemini 3.5 Flash-Lite, medido al construir el clóset', null, true, '2026-08-20', true, 4),
  ('comision-stripe', 'Comisión de Stripe México', '3.6% + 3 MXN, más IVA',
   'Tarifas de Stripe México', 'https://stripe.com/mx/pricing', true, '2026-08-20', true, 5),
  ('tipo-cambio', 'Tipo de cambio', '18.87 MXN por USD',
   'Se mueve todos los días. Aquí está fijo para que la cuenta sea reproducible', null, false, null, true, 6),
  ('costo-gratis', 'Lo que cuesta un usuario gratis', '0.01 USD al mes',
   'Estimación del Documento Maestro §2.3, no medida con usuarios reales', null, false, null, true, 7),
  ('registros', 'Registros nuevos al mes', '400 en el núcleo, 120 en 36+',
   'Supuesto. ClosetAI no ha hecho campañas: no hay dato propio todavía', null, false, null, true, 8),
  ('conversion-completo', 'Cuántos compran el plan Completo', '3% de quien se registra',
   'Supuesto. Ninguna persona ha pagado todavía', null, false, null, true, 9),
  ('conversion-recarga', 'Cuántos compran una recarga', '8% de quien ya pagó, cada mes',
   'Supuesto. Ninguna persona ha comprado créditos todavía', null, false, null, true, 10),
  ('creditos-mes', 'Créditos usados al mes', '6 por persona de pago',
   'Supuesto. La conversación de la Semana 2 habló de 40 prendas, no de créditos', null, false, null, true, 11),
  ('mes-tipico', 'Qué modela el simulador', 'Un mes típico, repetido 12 veces',
   'Decisión: no se modela retención ni abandono porque no hay un solo cliente de pago del cual aprenderlos', null, true, '2026-10-06', true, 12),
  ('afiliados', 'Ingreso por afiliados', 'No se cuenta',
   'Amazon México paga 10% en moda, pero ClosetAI no ha generado una sola venta: contarlo sería inventar ingreso', 'https://afiliados.amazon.com.mx/', false, null, false, 13),
  ('mercado-mx', 'Tamaño del mercado', '77 M de compradores digitales en México; 59% compra ropa',
   'AMVO, vía Milenio. Verificado en la investigación de la Semana 2', 'https://www.milenio.com/negocios/mexico-supera-77-millones-compradores-digitales-2025-amvo', true, '2026-09-14', false, 14),
  ('precio-categoria', 'Qué funciona en la categoría', 'Stylebook lleva 17 años con un pago único de 4.99 USD; Style DNA factura ~3 M USD al año con suscripción',
   'Investigación de la Semana 2', null, true, '2026-09-14', false, 15)
on conflict (id) do update set
  concepto = excluded.concepto, valor = excluded.valor, origen = excluded.origen,
  fuente_url = excluded.fuente_url, verificado = excluded.verificado,
  verificado_el = excluded.verificado_el, en_el_calculo = excluded.en_el_calculo, orden = excluded.orden;

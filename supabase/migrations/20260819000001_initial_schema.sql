-- Vestia — migración 001: esquema inicial
-- Fuente: docs/DOCUMENTO-MAESTRO.md, Apéndice B (transcrito íntegro).

create extension if not exists "pgcrypto";

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text, avatar_url text, city text default 'Ciudad de México',
  size_top text, size_bottom text, size_shoes text,
  plan text not null default 'free' check (plan in ('free','lifetime')),
  gender_presentation text, onboarding_done boolean default false,
  created_at timestamptz default now()
);

create table garments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  image_path text not null, clean_image_path text,
  category text, subcategory text, colors text[] default '{}',
  pattern text, material text, styles text[] default '{}',
  seasons text[] default '{}', occasions text[] default '{}',
  ai_meta jsonb default '{}'::jsonb, styling_note text,
  status text not null default 'active' check (status in ('active','archived','processing','failed')),
  created_at timestamptz default now()
);

create table outfits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text, occasion text, weather jsonb, explanation text,
  source text not null default 'ai' check (source in ('ai','manual')),
  status text default 'suggested' check (status in ('suggested','accepted','rejected','favorite','worn')),
  created_at timestamptz default now()
);

create table outfit_items (
  outfit_id uuid references outfits(id) on delete cascade,
  garment_id uuid references garments(id) on delete cascade,
  slot text, primary key (outfit_id, garment_id)
);

create table feedback_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null check (type in ('accept','reject','comment','favorite','wear','tag_fix','rec_click','profile_fix')),
  outfit_id uuid references outfits(id) on delete set null,
  garment_id uuid references garments(id) on delete set null,
  payload jsonb default '{}'::jsonb, processed boolean default false,
  created_at timestamptz default now()
);

create table style_profiles (
  user_id uuid primary key references profiles(id) on delete cascade,
  profile jsonb not null default '{}'::jsonb,
  version int not null default 0, updated_at timestamptz default now()
);

create table avatar_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  image_path text not null, is_primary boolean default false,
  validation text default 'pending' check (validation in ('pending','ok','rejected')),
  validation_note text, created_at timestamptz default now()
);

create table tryon_renders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  outfit_id uuid references outfits(id) on delete set null,
  garment_ids uuid[] not null, avatar_photo_id uuid references avatar_photos(id),
  provider text not null, mode text not null default 'tryon' check (mode in ('tryon','explore')),
  credits_charged numeric(4,1) not null, image_path text,
  status text default 'processing' check (status in ('processing','done','failed')),
  created_at timestamptz default now()
);

create table credit_ledger (
  id bigint generated always as identity primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  delta numeric(6,1) not null, reason text not null,
  ref text, created_at timestamptz default now()
);
create index on credit_ledger (user_id);

create table purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  stripe_session_id text unique not null, product text not null,
  amount_mxn int not null, status text default 'pending',
  created_at timestamptz default now()
);

create table shopping_recs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  gap jsonb not null, products jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

create table affiliate_clicks (
  id bigint generated always as identity primary key,
  user_id uuid references profiles(id) on delete set null,
  retailer text not null, target_url text not null,
  rec_id uuid references shopping_recs(id) on delete set null,
  created_at timestamptz default now()
);

create table api_costs (
  id bigint generated always as identity primary key,
  user_id uuid, provider text not null, operation text not null,
  est_cost_usd numeric(8,5) not null, created_at timestamptz default now()
);

-- RLS: TODA tabla la activa; owner-only para tablas de usuario
alter table profiles enable row level security;
alter table garments enable row level security;
alter table outfits enable row level security;
alter table outfit_items enable row level security;
alter table feedback_events enable row level security;
alter table style_profiles enable row level security;
alter table avatar_photos enable row level security;
alter table tryon_renders enable row level security;
alter table credit_ledger enable row level security;
alter table purchases enable row level security;
alter table shopping_recs enable row level security;
alter table affiliate_clicks enable row level security;
alter table api_costs enable row level security;

create policy "own profile" on profiles for all using (auth.uid() = id);
create policy "own garments" on garments for all using (auth.uid() = user_id);
create policy "own outfits" on outfits for all using (auth.uid() = user_id);
create policy "own outfit_items" on outfit_items for all
  using (exists (select 1 from outfits o where o.id = outfit_id and o.user_id = auth.uid()));
create policy "own feedback" on feedback_events for all using (auth.uid() = user_id);
create policy "own style" on style_profiles for select using (auth.uid() = user_id);
create policy "own avatar" on avatar_photos for all using (auth.uid() = user_id);
create policy "own renders" on tryon_renders for select using (auth.uid() = user_id);
create policy "own ledger" on credit_ledger for select using (auth.uid() = user_id);
create policy "own purchases" on purchases for select using (auth.uid() = user_id);
create policy "own recs" on shopping_recs for select using (auth.uid() = user_id);
-- Escrituras de renders/ledger/purchases/style/recs/api_costs/affiliate_clicks: solo service role (server).
-- api_costs y affiliate_clicks quedan con RLS activada y SIN política: nadie lee salvo service role. Intencional.

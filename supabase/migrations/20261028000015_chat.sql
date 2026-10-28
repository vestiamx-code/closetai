-- Week 5 · /chat, the guided "What should I wear?" assistant
--
-- Four tables, all closed to the public key (RLS on, no policies, privileges
-- revoked): conversations can be personal, and the rule since Week 3 is that a
-- table opens to the public key only if every column is public. The page reads
-- totals and the testers' summaries through the server.
--
--   · chat_sessions: one conversation. The intake answers, whether it is a test
--     and which tester, and the human checkpoint (needs_review, why, reviewed).
--   · chat_messages: what the person wrote and what the assistant answered.
--   · chat_ratings: thumbs up or down, one per assistant answer.
--   · chat_test_summaries: what each external tester wrote at the end.

create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  -- A salted hash of the connection, never the IP: it counts conversations per
  -- hour for the abuse limit and identifies nobody.
  visitante_hash text not null check (visitante_hash ~ '^[0-9a-f]{64}$'),
  -- { "ocasion": "...", "clima": "...", "estilo": "..." }, filled one by one.
  intake jsonb not null default '{}'::jsonb,
  -- Automated tests carry the x-cai-prueba header; their rows are kept but marked.
  es_prueba boolean not null default false,
  tester smallint check (tester is null or tester between 1 and 3),
  consentimiento_at timestamptz,
  constraint tester_con_consentimiento check (tester is null or consentimiento_at is not null),
  -- The human checkpoint.
  needs_review boolean not null default false,
  motivo_revision text check (motivo_revision is null or motivo_revision in
    ('autolesion', 'dieta', 'cuerpo', 'salud', 'datos_personales', 'fuera_de_tema', 'sensible')),
  revisado_at timestamptz,
  constraint revision_lleva_motivo check (not needs_review or motivo_revision is not null)
);

create index if not exists chat_sessions_por_revisar_idx
  on public.chat_sessions (created_at desc) where needs_review and revisado_at is null;
create index if not exists chat_sessions_limite_idx on public.chat_sessions (visitante_hash, created_at);

create table if not exists public.chat_messages (
  id bigint generated always as identity primary key,
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  created_at timestamptz not null default now(),
  rol text not null check (rol in ('usuaria', 'asistente')),
  contenido text not null check (char_length(contenido) between 1 and 2000),
  -- The outfit card { titulo, prendas[], tip }, when there is one.
  datos jsonb,
  -- Set when the answer is a guardrail instead of a model answer.
  guardrail text check (guardrail is null or guardrail in
    ('autolesion', 'dieta', 'cuerpo', 'salud', 'datos_personales', 'fuera_de_tema', 'sensible')),
  -- Which model answered; null for guardrail answers and for the person's messages.
  modelo text
);

create index if not exists chat_messages_session_idx on public.chat_messages (session_id, created_at);

create table if not exists public.chat_ratings (
  id bigint generated always as identity primary key,
  -- One rating per answer: rating twice doesn't count twice.
  message_id bigint not null unique references public.chat_messages(id) on delete cascade,
  rating smallint not null check (rating in (-1, 1)),
  created_at timestamptz not null default now()
);

create table if not exists public.chat_test_summaries (
  id bigint generated always as identity primary key,
  session_id uuid not null unique references public.chat_sessions(id) on delete cascade,
  tester smallint not null check (tester between 1 and 3),
  funciono text not null check (char_length(funciono) between 3 and 600),
  confuso text not null default '' check (char_length(confuso) <= 600),
  puntaje smallint not null check (puntaje between 1 and 5),
  created_at timestamptz not null default now()
);

alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.chat_ratings enable row level security;
alter table public.chat_test_summaries enable row level security;
-- No policies on purpose: only the service key reads or writes.

revoke all on public.chat_sessions, public.chat_messages, public.chat_ratings, public.chat_test_summaries
  from anon, authenticated;
grant all on public.chat_sessions, public.chat_messages, public.chat_ratings, public.chat_test_summaries
  to service_role;

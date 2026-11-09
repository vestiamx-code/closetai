-- Week 6 · The full-site tests, and the IPs that should have gone in Week 3.
--
-- 1. site_test_summaries: what testers 4 and 5 write after walking through the
--    whole site from /demo?test=4 and ?test=5. Testers 1–3 are Week 5's, in
--    chat_test_summaries. No name is stored: the tester number, the consent
--    time, and what they wrote to be shown.
--
-- 2. api_costs: since Week 3 the public pages log a salted hash of the
--    connection, never the IP. The rows written before that still held the raw
--    IP in `provider` (found on Nov 9, 2026, while building /dashboard). The
--    rate limits only look at the last hour, so those rows are useless for
--    anything but identifying someone. The cost and the operation stay; the IP
--    goes.

create table if not exists public.site_test_summaries (
  id bigint generated always as identity primary key,
  tester smallint not null check (tester between 4 and 5),
  consentimiento_at timestamptz not null,
  -- The steps of the walkthrough they actually did, by id.
  paginas text[] not null default '{}' check (cardinality(paginas) <= 12),
  funciono text not null check (char_length(funciono) between 3 and 800),
  confuso text not null default '' check (char_length(confuso) <= 800),
  puntaje smallint not null check (puntaje between 1 and 5),
  lo_usaria text not null check (lo_usaria in ('si', 'tal_vez', 'no')),
  -- Automated tests carry the x-cai-prueba header; their rows are marked, never shown.
  es_prueba boolean not null default false,
  created_at timestamptz not null default now()
);

-- One real summary per tester: a second one from the same link is refused.
create unique index if not exists site_test_summaries_un_tester
  on public.site_test_summaries (tester) where not es_prueba;

alter table public.site_test_summaries enable row level security;
-- No policies on purpose: only the service key reads or writes.
revoke all on public.site_test_summaries from anon, authenticated;
grant all on public.site_test_summaries to service_role;

update public.api_costs
   set provider = 'ip:removed'
 where provider like 'ip:%'
   and provider !~ '^ip:[0-9a-f]{64}$'
   and provider <> 'ip:removed';

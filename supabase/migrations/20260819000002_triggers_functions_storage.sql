-- Vestia — migración 002: piezas que el Apéndice B da por supuestas pero no define.
-- Sin esto, el esquema 001 no funciona en runtime (ver docs/evidencia/DECISION_NOTES.md).

-- 1) profiles + style_profiles se crean solos al registrarse (todo el esquema tiene FK a profiles).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  insert into public.style_profiles (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2) Créditos: saldo = SUM(delta). Débito atómico y no duplicable.
--    ref único (session de Stripe, id de render) => un reintento nunca cobra ni abona dos veces.
create unique index credit_ledger_ref_unique on credit_ledger (ref) where ref is not null;

create or replace function public.credit_balance(p_user uuid)
returns numeric language sql stable security definer set search_path = public as $$
  select coalesce(sum(delta), 0) from public.credit_ledger where user_id = p_user;
$$;

create or replace function public.debit_credits(
  p_user uuid, p_amount numeric, p_reason text, p_ref text default null
) returns numeric language plpgsql security definer set search_path = public as $$
declare v_balance numeric;
begin
  if p_amount <= 0 then
    raise exception 'amount_must_be_positive';
  end if;

  -- Serializa por usuario dentro de la transacción: dos renders simultáneos no pueden
  -- leer el mismo saldo y gastarlo dos veces.
  perform pg_advisory_xact_lock(hashtextextended(p_user::text, 0));

  select coalesce(sum(delta), 0) into v_balance from public.credit_ledger where user_id = p_user;
  if v_balance < p_amount then
    raise exception 'insufficient_credits';
  end if;

  insert into public.credit_ledger (user_id, delta, reason, ref)
  values (p_user, -p_amount, p_reason, p_ref);

  return v_balance - p_amount;
end; $$;

-- Solo el servidor (service role) mueve créditos. El cliente jamás.
revoke all on function public.debit_credits(uuid, numeric, text, text) from public, anon, authenticated;
revoke all on function public.credit_balance(uuid) from public, anon;

-- 3) Storage: buckets privados. Acceso solo por URL firmada generada server-side.
insert into storage.buckets (id, name, public) values
  ('garments', 'garments', false),
  ('avatars',  'avatars',  false),
  ('renders',  'renders',  false)
on conflict (id) do nothing;

-- Convención de rutas: <bucket>/<user_id>/<archivo>
create policy "own garment files" on storage.objects for all
  using      (bucket_id = 'garments' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'garments' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "own avatar files" on storage.objects for all
  using      (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- Renders: el usuario los lee, solo el servidor los escribe.
create policy "own render files" on storage.objects for select
  using (bucket_id = 'renders' and (storage.foldername(name))[1] = auth.uid()::text);

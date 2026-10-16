create table public.activation_attempts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  window_start timestamptz not null default now(),
  attempts integer not null default 0
);
alter table public.activation_attempts enable row level security;
revoke all on public.activation_attempts from anon, authenticated;

create function public.provision_card(card_public_id text, verifier text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare card uuid;
begin
  insert into public.physical_cards(public_id) values(card_public_id) returning id into card;
  insert into public.activation_codes(card_id,code_hash) values(card,verifier);
  return card;
end;
$$;
revoke all on function public.provision_card(text,text) from public, anon, authenticated;
grant execute on function public.provision_card(text,text) to service_role;

create function public.activate_card(activation_code text, target_profile uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  attempt public.activation_attempts;
  activation_id uuid;
  card uuid;
  public_id_value text;
begin
  if auth.uid() is null then return jsonb_build_object('error','unauthorized'); end if;
  -- A row lock serializes concurrent attempts per account. Errors are returned, not raised:
  -- raising would roll back the limiter and permit unlimited invalid attempts.
  insert into public.activation_attempts(user_id,attempts) values(auth.uid(),1)
    on conflict(user_id) do update set
      attempts=case when activation_attempts.window_start < now()-interval '15 minutes' then 1 else activation_attempts.attempts+1 end,
      window_start=case when activation_attempts.window_start < now()-interval '15 minutes' then now() else activation_attempts.window_start end
    returning * into attempt;
  if attempt.attempts > 10 then return jsonb_build_object('error','rate_limited'); end if;
  if activation_code is null or length(trim(activation_code)) not between 20 and 128 or not exists(select 1 from public.profiles where id=target_profile and owner_id=auth.uid()) then
    return jsonb_build_object('error','invalid_code');
  end if;
  select a.id,c.id,c.public_id into activation_id,card,public_id_value
    from public.activation_codes a join public.physical_cards c on c.id=a.card_id
    where a.code_hash=encode(extensions.digest(trim(activation_code),'sha256'),'hex')
      and a.used_at is null and c.status='unassigned' and c.owner_id is null
    for update of a, c;
  if card is null then return jsonb_build_object('error','invalid_code'); end if;
  update public.activation_codes set used_at=now(),used_by=auth.uid() where id=activation_id and used_at is null;
  update public.physical_cards set owner_id=auth.uid(),profile_id=target_profile,status='active',activated_at=now() where id=card;
  return jsonb_build_object('public_id',public_id_value);
end;
$$;
revoke all on function public.activate_card(text,uuid) from public, anon;
grant execute on function public.activate_card(text,uuid) to authenticated;

create function public.resolve_card(card_public_id text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'status',case when c.status='unassigned' then 'unassigned' when c.status='active' and p.published then 'active' else 'unavailable' end,
    'slug',case when c.status='active' and p.published then p.slug else null end)
  from public.physical_cards c left join public.profiles p on p.id=c.profile_id where c.public_id=card_public_id;
$$;
revoke all on function public.resolve_card(text) from public;
grant execute on function public.resolve_card(text) to anon, authenticated;

create function public.set_card_enabled(card_id uuid, enabled boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'unauthorized'; end if;
  update public.physical_cards set status=case when enabled then 'active' else 'disabled' end
    where id=card_id and owner_id=auth.uid() and activated_at is not null and profile_id is not null;
  if not found then raise exception 'card_not_found'; end if;
end;
$$;
revoke all on function public.set_card_enabled(uuid,boolean) from public, anon;
grant execute on function public.set_card_enabled(uuid,boolean) to authenticated;

-- Preserve the existing profile/card schema and add server-managed administration.
alter table public.profiles add column if not exists data jsonb not null default '{}';
alter table public.profiles add column if not exists last_seen timestamptz;
update public.profiles p set data = coalesce((select data from public.personal_profiles d where d.profile_id=p.id),(select data from public.business_profiles d where d.profile_id=p.id),'{}') where p.data='{}';
alter table public.physical_cards drop constraint if exists physical_cards_public_id_check;
alter table public.physical_cards add constraint physical_cards_public_id_check check(public_id ~ '^([1-9][0-9]{0,8}|VC[A-Z0-9]{6,30})$');
create table if not exists public.vcard_sessions(token text primary key,user_id uuid not null references auth.users(id) on delete cascade,expires timestamptz not null);
create index if not exists vcard_sessions_expires_idx on public.vcard_sessions(expires);
create index if not exists vcard_sessions_user_idx on public.vcard_sessions(user_id);
create table if not exists public.vcard_rate_limits(key text primary key,window_start timestamptz not null default now(),attempts integer not null default 1);
alter table public.vcard_sessions enable row level security;
alter table public.vcard_rate_limits enable row level security;
revoke all on public.vcard_sessions,public.vcard_rate_limits from anon,authenticated;
grant all on public.vcard_sessions,public.vcard_rate_limits to service_role;
-- Service-role-only RPCs: the browser never receives the service key.
create or replace function public.vcard_rate_limit(p_key text) returns boolean language plpgsql security invoker set search_path='' as $$
declare n integer;
begin
 delete from public.vcard_rate_limits where window_start<now()-interval '1 day';
 insert into public.vcard_rate_limits(key) values(p_key) on conflict(key) do update set
 attempts=case when vcard_rate_limits.window_start<now()-interval '15 minutes' then 1 else vcard_rate_limits.attempts+1 end,
 window_start=case when vcard_rate_limits.window_start<now()-interval '15 minutes' then now() else vcard_rate_limits.window_start end returning attempts into n;
 return n<=30;
end $$;
create or replace function public.vcard_create_card(p_id text,p_hash text) returns text language plpgsql security invoker set search_path='' as $$
declare v_id text; v_uuid uuid;
begin
 perform pg_advisory_xact_lock(728149);
 v_id:=nullif(p_id,'');
 if v_id is null then select (coalesce(max(public_id::bigint),0)+1)::text into v_id from public.physical_cards where public_id ~ '^[1-9][0-9]{0,8}$'; end if;
 if v_id !~ '^[1-9][0-9]{0,8}$' then raise exception 'Invalid card number'; end if;
 insert into public.physical_cards(public_id,status) values(v_id,'unassigned') returning id into v_uuid;
 insert into public.activation_codes(card_id,code_hash) values(v_uuid,p_hash);
 return v_id;
end $$;
create or replace function public.vcard_activate(p_hash text,p_user uuid) returns text language plpgsql security invoker set search_path='' as $$
declare v_card uuid; v_code uuid; v_profile uuid; v_public text;
begin
 select a.id,c.id,c.public_id into v_code,v_card,v_public from public.activation_codes a join public.physical_cards c on a.card_id=c.id
 where a.code_hash=p_hash and a.used_at is null and c.owner_id is null and c.status='unassigned' for update of a,c;
 if v_card is null then return null; end if;
 select id into v_profile from public.profiles where owner_id=p_user;
 if v_profile is null then return null; end if;
 update public.activation_codes set used_at=now(),used_by=p_user where id=v_code;
 update public.physical_cards set owner_id=p_user,profile_id=v_profile,status='active',activated_at=now() where id=v_card;
 return v_public;
end $$;
create or replace function public.vcard_reissue(p_id text,p_hash text) returns text language plpgsql security invoker set search_path='' as $$
declare v_card uuid;
begin
 select id into v_card from public.physical_cards where public_id=p_id and owner_id is null for update;
 if v_card is null then return null; end if;
 delete from public.activation_codes where card_id=v_card;
 insert into public.activation_codes(card_id,code_hash) values(v_card,p_hash);
 return p_id;
end $$;
create or replace function public.vcard_overview() returns jsonb language sql security invoker set search_path='' as $$
 select jsonb_build_object('stats',jsonb_build_object(
 'users',(select count(*) from public.profiles where owner_id is not null),
 'activeUsers',(select count(distinct owner_id) from public.profiles where last_seen>now()-interval '30 days'),
 'totalCards',(select count(*) from public.physical_cards),
 'activeCards',(select count(*) from public.physical_cards where status='active'),
 'activeLinks',(select count(*) from public.physical_cards c join public.profiles p on p.id=c.profile_id where c.status='active' and p.published),
 'publishedProfiles',(select count(*) from public.profiles where published)),
 'cards',coalesce((select jsonb_agg(jsonb_build_object('id',c.public_id,'disabled',case when c.status='disabled' then 1 else 0 end,'created',c.created_at,'owner',c.owner_id) order by c.created_at desc,c.public_id) from public.physical_cards c),'[]'::jsonb));
$$;
revoke all on function public.vcard_rate_limit(text),public.vcard_create_card(text,text),public.vcard_activate(text,uuid),public.vcard_reissue(text,text),public.vcard_overview() from public,anon,authenticated;
grant execute on function public.vcard_rate_limit(text),public.vcard_create_card(text,text),public.vcard_activate(text,uuid),public.vcard_reissue(text,text),public.vcard_overview() to service_role;

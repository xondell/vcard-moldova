create extension if not exists pgcrypto with schema extensions;

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users(id) on delete cascade,
  type text not null check (type in ('personal', 'business')),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{2,47}$'),
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.personal_profiles (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  data jsonb not null default '{}' check (jsonb_typeof(data) = 'object' and octet_length(data::text) <= 20000)
);
create table public.business_profiles (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  data jsonb not null default '{}' check (jsonb_typeof(data) = 'object' and octet_length(data::text) <= 20000)
);
create table public.physical_cards (
  id uuid primary key default gen_random_uuid(),
  public_id text not null unique check (public_id ~ '^VC[A-Z0-9]{6,30}$'),
  owner_id uuid references auth.users(id) on delete set null,
  profile_id uuid references public.profiles(id) on delete set null,
  status text not null default 'unassigned' check (status in ('unassigned','active','disabled')),
  activated_at timestamptz,
  created_at timestamptz not null default now(),
  check (status <> 'active' or (owner_id is not null and profile_id is not null))
);
create index physical_cards_owner_idx on public.physical_cards(owner_id);
create index physical_cards_profile_idx on public.physical_cards(profile_id);
create table public.activation_codes (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null unique references public.physical_cards(id) on delete cascade,
  code_hash text not null unique check (code_hash ~ '^[a-f0-9]{64}$'),
  used_at timestamptz,
  used_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.personal_profiles enable row level security;
alter table public.business_profiles enable row level security;
alter table public.physical_cards enable row level security;
alter table public.activation_codes enable row level security;

revoke all on public.profiles, public.personal_profiles, public.business_profiles, public.physical_cards from anon, authenticated;
grant select on public.profiles, public.personal_profiles, public.business_profiles, public.physical_cards to authenticated;
revoke all on public.activation_codes from anon, authenticated;
create policy profiles_owner_read on public.profiles for select to authenticated using (auth.uid() = owner_id);
create policy personal_owner_read on public.personal_profiles for select to authenticated using (
  exists (select 1 from public.profiles p where p.id = profile_id and p.owner_id = auth.uid())
);
create policy business_owner_read on public.business_profiles for select to authenticated using (
  exists (select 1 from public.profiles p where p.id = profile_id and p.owner_id = auth.uid())
);
create policy cards_owner_read on public.physical_cards for select to authenticated using (auth.uid() = owner_id);

create function public.create_user_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  profile_type text := case when new.raw_user_meta_data->>'profile_type' = 'business' then 'business' else 'personal' end;
  profile_id uuid := gen_random_uuid();
begin
  insert into public.profiles(id,owner_id,type,slug)
    values(profile_id,new.id,profile_type,'v-' || replace(profile_id::text,'-',''));
  if profile_type = 'personal' then
    insert into public.personal_profiles(profile_id) values(profile_id);
  else
    insert into public.business_profiles(profile_id) values(profile_id);
  end if;
  return new;
end;
$$;
revoke all on function public.create_user_profile() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.create_user_profile();

-- Deleting an auth user must detach physical cards before FK cleanup. Public IDs remain permanent.
create function public.detach_user_cards() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.physical_cards set status='disabled', owner_id=null, profile_id=null where owner_id=old.id;
  return old;
end;
$$;
revoke all on function public.detach_user_cards() from public, anon, authenticated;
create trigger before_auth_user_deleted before delete on auth.users for each row execute function public.detach_user_cards();

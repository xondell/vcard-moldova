-- Opaque media names avoid exposing auth/profile UUIDs publicly.
-- Public readers may download with RLS, but may NOT mint bearer signed URLs.
-- https://supabase.com/docs/guides/storage/security/access-control
drop policy media_owner_insert on storage.objects;
drop policy media_read on storage.objects;
drop policy media_owner_delete on storage.objects;
create policy media_owner_insert on storage.objects for insert to authenticated with check (
  bucket_id='profile-media' and owner_id=auth.uid()::text
  and name ~ '^[a-f0-9-]+\.(jpg|png|webp)$'
  and exists(select 1 from public.profiles where owner_id=auth.uid())
);
create policy media_read on storage.objects for select to anon, authenticated using (
  bucket_id='profile-media' and (
    owner_id=auth.uid()::text or (
      storage.allow_any_operation(array['object.get_authenticated','object.get_authenticated_info'])
      and public.can_read_profile_media(name)
    )
  )
);
create policy media_owner_delete on storage.objects for delete to authenticated using (
  bucket_id='profile-media' and owner_id=auth.uid()::text
);

create or replace function public.valid_web_url(value text) returns boolean
language sql immutable set search_path = '' as $$
  select coalesce(value = '' or (
    length(value) <= 2048
    and value ~ '^https?://[A-Za-z0-9][A-Za-z0-9.-]*(:[0-9]+)?([/?#][^[:space:]]*)?$'
    and value !~ '[[:cntrl:]]'
    and (substring(value from '^https?://[^/:?#]+:([0-9]+)') is null
      or substring(value from '^https?://[^/:?#]+:([0-9]+)')::numeric between 1 and 65535)
  ),false);
$$;

create or replace function public.validate_profile_data(data jsonb, profile_type text, owner uuid, profile uuid) returns void
language plpgsql set search_path = '' as $$
declare k text; v jsonb; item jsonb;
begin
  if data is null or jsonb_typeof(data) <> 'object' or octet_length(data::text) > 20000 then raise exception 'invalid_profile'; end if;
  for k,v in select * from jsonb_each(data) loop
    if not (k = any(array['fullName','title','company','bio','phone','email','website','location','name','category','description','address','mapsUrl','hours','socials','actions','avatarPath','coverPath'])) then raise exception 'invalid_field'; end if;
    if k not in ('hours','socials','actions') and (jsonb_typeof(v) <> 'string' or length(v #>> '{}') > 2048) then raise exception 'invalid_field'; end if;
    if k in ('website','mapsUrl') and not public.valid_web_url(v #>> '{}') then raise exception 'invalid_url'; end if;
    if k in ('avatarPath','coverPath') and (v #>> '{}') <> '' and not exists(
      select 1 from storage.objects o where o.bucket_id='profile-media' and o.name=(v #>> '{}') and o.owner_id=$3::text
    ) then raise exception 'invalid_image_path'; end if;
    if k in ('phone','email') and (v #>> '{}') ~ '[[:cntrl:]]' then raise exception 'invalid_contact'; end if;
  end loop;
  if coalesce(data->>'email','') <> '' and (data->>'email') !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'invalid_email'; end if;
  if data ? 'socials' then
    if jsonb_typeof(data->'socials') <> 'object' then raise exception 'invalid_socials'; end if;
    for k,v in select * from jsonb_each(data->'socials') loop
      if k not in ('instagram','telegram','linkedin','facebook','tiktok','whatsapp','website') or jsonb_typeof(v) <> 'string' or not public.valid_web_url(v #>> '{}') then raise exception 'invalid_socials'; end if;
    end loop;
  end if;
  if data ? 'hours' then
    if jsonb_typeof(data->'hours') <> 'array' then raise exception 'invalid_hours'; end if;
    if jsonb_array_length(data->'hours') > 14 then raise exception 'invalid_hours'; end if;
    for item in select * from jsonb_array_elements(data->'hours') loop
      if jsonb_typeof(item) <> 'string' or length(item #>> '{}') > 200 then raise exception 'invalid_hours'; end if;
    end loop;
  end if;
  if data ? 'actions' then
    if jsonb_typeof(data->'actions') <> 'array' then raise exception 'invalid_actions'; end if;
    if jsonb_array_length(data->'actions') > 10 then raise exception 'invalid_actions'; end if;
    for item in select * from jsonb_array_elements(data->'actions') loop
      if jsonb_typeof(item) <> 'object' or jsonb_typeof(item->'label') is distinct from 'string' or length(item->>'label') not between 1 and 100
        or jsonb_typeof(item->'url') is distinct from 'string' or coalesce(item->>'url','') = '' or not public.valid_web_url(item->>'url')
        or jsonb_typeof(item->'icon') is distinct from 'string' or length(item->>'icon') > 32 then raise exception 'invalid_action'; end if;
    end loop;
  end if;
  if profile_type = 'personal' and data ?| array['name','category','description','address','mapsUrl','hours','actions','coverPath'] then raise exception 'invalid_type'; end if;
  if profile_type = 'business' and data ?| array['fullName','title','company','bio','location'] then raise exception 'invalid_type'; end if;
end;
$$;

-- No account metadata is exposed by these public read functions.
-- Security-definer functions are narrow capabilities with explicit authorization.
-- https://supabase.com/docs/guides/database/functions#security-definer-vs-invoker
create function public.valid_web_url(value text) returns boolean
language sql immutable set search_path = '' as $$
  select value = '' or (length(value) <= 2048 and value ~ '^https?://[A-Za-z0-9][A-Za-z0-9.-]*(:[0-9]+)?([/?#][^[:space:]]*)?$' and value !~ '[[:cntrl:]]');
$$;

create function public.validate_profile_data(data jsonb, profile_type text, owner uuid, profile uuid) returns void
language plpgsql set search_path = '' as $$
declare k text; v jsonb; item jsonb;
begin
  if jsonb_typeof(data) <> 'object' or octet_length(data::text) > 20000 then raise exception 'invalid_profile'; end if;
  for k,v in select * from jsonb_each(data) loop
    if not (k = any(array['fullName','title','company','bio','phone','email','website','location','name','category','description','address','mapsUrl','hours','socials','actions','avatarPath','coverPath'])) then raise exception 'invalid_field'; end if;
    if k not in ('hours','socials','actions') and (jsonb_typeof(v) <> 'string' or length(v #>> '{}') > 2048) then raise exception 'invalid_field'; end if;
    if k in ('website','mapsUrl') and not public.valid_web_url(v #>> '{}') then raise exception 'invalid_url'; end if;
    if k in ('avatarPath','coverPath') and (v #>> '{}') <> '' and (v #>> '{}') !~ ('^' || owner::text || '/' || profile::text || '/[a-f0-9-]+\.(jpg|png|webp)$') then raise exception 'invalid_image_path'; end if;
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
        or jsonb_typeof(item->'url') is distinct from 'string' or coalesce(item->>'url','') = '' or not public.valid_web_url(item->>'url') then raise exception 'invalid_action'; end if;
    end loop;
  end if;
  if profile_type = 'personal' and data ?| array['name','category','description','address','mapsUrl','hours','actions','coverPath'] then raise exception 'invalid_type'; end if;
  if profile_type = 'business' and data ?| array['fullName','title','company','bio','location'] then raise exception 'invalid_type'; end if;
end;
$$;
revoke all on function public.validate_profile_data(jsonb,text,uuid,uuid) from public, anon, authenticated;

create function public.get_owned_profile() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(pp.data,bp.data,'{}'::jsonb) || jsonb_build_object('id',p.id,'type',p.type,'slug',p.slug,'published',p.published)
  from public.profiles p left join public.personal_profiles pp on pp.profile_id=p.id left join public.business_profiles bp on bp.profile_id=p.id
  where p.owner_id=auth.uid();
$$;
revoke all on function public.get_owned_profile() from public, anon;
grant execute on function public.get_owned_profile() to authenticated;

create function public.save_profile(profile_slug text, profile_data jsonb, is_published boolean) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare p public.profiles;
begin
  if auth.uid() is null then raise exception 'unauthorized'; end if;
  select * into p from public.profiles where owner_id=auth.uid() for update;
  if p.id is null then raise exception 'profile_not_found'; end if;
  if profile_slug is null or profile_slug !~ '^[a-z0-9][a-z0-9-]{2,47}$' or is_published is null then raise exception 'invalid_profile'; end if;
  perform public.validate_profile_data(profile_data,p.type,auth.uid(),p.id);
  if is_published and length(trim(coalesce(case when p.type='personal' then profile_data->>'fullName' else profile_data->>'name' end,''))) = 0 then raise exception 'name_required'; end if;
  update public.profiles set slug=profile_slug,published=is_published,updated_at=now() where id=p.id;
  if p.type='personal' then update public.personal_profiles set data=profile_data where profile_id=p.id;
  else update public.business_profiles set data=profile_data where profile_id=p.id; end if;
  return public.get_owned_profile();
end;
$$;
revoke all on function public.save_profile(text,jsonb,boolean) from public, anon;
grant execute on function public.save_profile(text,jsonb,boolean) to authenticated;

create function public.get_public_profile(profile_slug text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(pp.data,bp.data,'{}'::jsonb) || jsonb_build_object('type',p.type,'slug',p.slug)
  from public.profiles p left join public.personal_profiles pp on pp.profile_id=p.id left join public.business_profiles bp on bp.profile_id=p.id
  where p.slug=profile_slug and p.published=true;
$$;
revoke all on function public.get_public_profile(text) from public;
grant execute on function public.get_public_profile(text) to anon, authenticated;

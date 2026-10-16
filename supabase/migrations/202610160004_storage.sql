insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('profile-media','profile-media',false,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=false,file_size_limit=5242880,allowed_mime_types=array['image/jpeg','image/png','image/webp'];

create function public.can_read_profile_media(object_name text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(
    select 1 from public.profiles p
    left join public.personal_profiles pp on pp.profile_id=p.id
    left join public.business_profiles bp on bp.profile_id=p.id
    where p.published and (coalesce(pp.data,bp.data)->>'avatarPath'=object_name or bp.data->>'coverPath'=object_name)
  );
$$;
revoke all on function public.can_read_profile_media(text) from public;
grant execute on function public.can_read_profile_media(text) to anon, authenticated;

create policy media_owner_insert on storage.objects for insert to authenticated with check (
  bucket_id='profile-media' and (storage.foldername(name))[1]=auth.uid()::text
  and exists(select 1 from public.profiles p where p.owner_id=auth.uid() and p.id::text=(storage.foldername(name))[2])
  and name ~ '^[a-f0-9-]+/[a-f0-9-]+/[a-f0-9-]+\.(jpg|png|webp)$'
);
create policy media_read on storage.objects for select to anon, authenticated using (
  bucket_id='profile-media' and ((storage.foldername(name))[1]=auth.uid()::text or public.can_read_profile_media(name))
);
create policy media_owner_delete on storage.objects for delete to authenticated using (
  bucket_id='profile-media' and (storage.foldername(name))[1]=auth.uid()::text
);

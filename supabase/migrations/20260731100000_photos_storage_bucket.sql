-- Phase 1C: private photos storage bucket (server-only via service role)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'photos',
  'photos',
  false,
  4194304,
  array['image/jpeg', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Block direct anon/authenticated storage access; API uses service role.
create policy photos_deny_anon_select on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'photos' and false);

create policy photos_deny_anon_insert on storage.objects
  for insert
  to anon, authenticated
  with check (bucket_id = 'photos' and false);

create policy photos_deny_anon_update on storage.objects
  for update
  to anon, authenticated
  using (bucket_id = 'photos' and false);

create policy photos_deny_anon_delete on storage.objects
  for delete
  to anon, authenticated
  using (bucket_id = 'photos' and false);

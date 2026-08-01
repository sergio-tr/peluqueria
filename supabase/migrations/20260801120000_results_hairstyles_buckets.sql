-- Private Storage buckets for AI results and hairstyle assets (server-only via service role)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('results', 'results', false, 8388608, array['image/jpeg', 'image/webp', 'image/png']),
  ('hairstyles', 'hairstyles', false, 8388608, array['image/jpeg', 'image/webp', 'image/png'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and policyname = 'results_deny_anon_select') then
    create policy results_deny_anon_select on storage.objects for select to anon, authenticated using (bucket_id = 'results' and false);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and policyname = 'results_deny_anon_insert') then
    create policy results_deny_anon_insert on storage.objects for insert to anon, authenticated with check (bucket_id = 'results' and false);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and policyname = 'results_deny_anon_update') then
    create policy results_deny_anon_update on storage.objects for update to anon, authenticated using (bucket_id = 'results' and false);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and policyname = 'results_deny_anon_delete') then
    create policy results_deny_anon_delete on storage.objects for delete to anon, authenticated using (bucket_id = 'results' and false);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and policyname = 'hairstyles_deny_anon_select') then
    create policy hairstyles_deny_anon_select on storage.objects for select to anon, authenticated using (bucket_id = 'hairstyles' and false);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and policyname = 'hairstyles_deny_anon_insert') then
    create policy hairstyles_deny_anon_insert on storage.objects for insert to anon, authenticated with check (bucket_id = 'hairstyles' and false);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and policyname = 'hairstyles_deny_anon_update') then
    create policy hairstyles_deny_anon_update on storage.objects for update to anon, authenticated using (bucket_id = 'hairstyles' and false);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and policyname = 'hairstyles_deny_anon_delete') then
    create policy hairstyles_deny_anon_delete on storage.objects for delete to anon, authenticated using (bucket_id = 'hairstyles' and false);
  end if;
end $$;

-- V22 — Contractor Packet Photo Storage
-- Creates a private Supabase Storage bucket for homeowner-safe photos attached to contractor packets.
-- Object paths must start with the authenticated user's UUID:
-- <user_id>/<lead_or_session_id>/<prompt_id>-<timestamp>.jpg

insert into storage.buckets (id, name, public)
values ('contractor-packet-photos', 'contractor-packet-photos', false)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Users can upload their own contractor packet photos'
  ) then
    create policy "Users can upload their own contractor packet photos"
      on storage.objects for insert
      with check (
        bucket_id = 'contractor-packet-photos'
        and auth.uid()::text = (storage.foldername(name))[1]
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Users can read their own contractor packet photos'
  ) then
    create policy "Users can read their own contractor packet photos"
      on storage.objects for select
      using (
        bucket_id = 'contractor-packet-photos'
        and auth.uid()::text = (storage.foldername(name))[1]
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Users can update their own contractor packet photos'
  ) then
    create policy "Users can update their own contractor packet photos"
      on storage.objects for update
      using (
        bucket_id = 'contractor-packet-photos'
        and auth.uid()::text = (storage.foldername(name))[1]
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Users can delete their own contractor packet photos'
  ) then
    create policy "Users can delete their own contractor packet photos"
      on storage.objects for delete
      using (
        bucket_id = 'contractor-packet-photos'
        and auth.uid()::text = (storage.foldername(name))[1]
      );
  end if;
end $$;

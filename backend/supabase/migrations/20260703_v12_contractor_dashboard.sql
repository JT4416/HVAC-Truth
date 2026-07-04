-- V12 additions: contractor dashboard, verified access, lead activity, notes, and availability windows

create table if not exists public.contractor_dashboard_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  contractor_id uuid references public.contractors(id) on delete cascade,
  business_name text,
  role text not null default 'owner' check (role in ('owner', 'manager', 'dispatcher', 'technician')),
  dashboard_status text not null default 'pending' check (dashboard_status in ('pending', 'active', 'suspended')),
  verification_status text not null default 'needs_review' check (verification_status in ('verified', 'needs_review', 'rejected')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, contractor_id)
);

create table if not exists public.contractor_lead_activity (
  id uuid primary key default gen_random_uuid(),
  contractor_id uuid references public.contractors(id) on delete cascade,
  lead_request_id uuid references public.contractor_lead_requests(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  activity_type text not null check (activity_type in ('viewed', 'accepted', 'declined', 'scheduled', 'note_added', 'preferences_updated')),
  activity_summary text,
  created_at timestamptz default now()
);

create table if not exists public.contractor_notes (
  id uuid primary key default gen_random_uuid(),
  contractor_id uuid references public.contractors(id) on delete cascade,
  lead_request_id uuid references public.contractor_lead_requests(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  note_body text not null,
  created_at timestamptz default now()
);

create table if not exists public.contractor_availability_windows (
  id uuid primary key default gen_random_uuid(),
  contractor_id uuid references public.contractors(id) on delete cascade,
  day_of_week text not null check (day_of_week in ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
  start_time time not null,
  end_time time not null,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.contractor_lead_recipients add column if not exists updated_at timestamptz;

alter table public.contractor_dashboard_users enable row level security;
alter table public.contractor_lead_activity enable row level security;
alter table public.contractor_notes enable row level security;
alter table public.contractor_availability_windows enable row level security;

create policy "Users can read their own contractor dashboard access" on public.contractor_dashboard_users
  for select using (auth.uid() = user_id);

create policy "Verified dashboard users can read lead activity" on public.contractor_lead_activity
  for select using (
    exists (
      select 1 from public.contractor_dashboard_users cdu
      where cdu.contractor_id = contractor_lead_activity.contractor_id
        and cdu.user_id = auth.uid()
        and cdu.dashboard_status = 'active'
        and cdu.verification_status = 'verified'
    )
  );

create policy "Verified dashboard users can create lead activity" on public.contractor_lead_activity
  for insert with check (
    exists (
      select 1 from public.contractor_dashboard_users cdu
      where cdu.contractor_id = contractor_lead_activity.contractor_id
        and cdu.user_id = auth.uid()
        and cdu.dashboard_status = 'active'
        and cdu.verification_status = 'verified'
    )
  );

create policy "Verified dashboard users can read contractor notes" on public.contractor_notes
  for select using (
    exists (
      select 1 from public.contractor_dashboard_users cdu
      where cdu.contractor_id = contractor_notes.contractor_id
        and cdu.user_id = auth.uid()
        and cdu.dashboard_status = 'active'
        and cdu.verification_status = 'verified'
    )
  );

create policy "Verified dashboard users can create contractor notes" on public.contractor_notes
  for insert with check (
    exists (
      select 1 from public.contractor_dashboard_users cdu
      where cdu.contractor_id = contractor_notes.contractor_id
        and cdu.user_id = auth.uid()
        and cdu.dashboard_status = 'active'
        and cdu.verification_status = 'verified'
    )
  );

create policy "Verified dashboard users can read availability windows" on public.contractor_availability_windows
  for select using (
    exists (
      select 1 from public.contractor_dashboard_users cdu
      where cdu.contractor_id = contractor_availability_windows.contractor_id
        and cdu.user_id = auth.uid()
        and cdu.dashboard_status = 'active'
        and cdu.verification_status = 'verified'
    )
  );

create policy "Verified dashboard users can create availability windows" on public.contractor_availability_windows
  for insert with check (
    exists (
      select 1 from public.contractor_dashboard_users cdu
      where cdu.contractor_id = contractor_availability_windows.contractor_id
        and cdu.user_id = auth.uid()
        and cdu.dashboard_status = 'active'
        and cdu.verification_status = 'verified'
    )
  );

create index if not exists contractor_dashboard_users_user_id_idx on public.contractor_dashboard_users(user_id);
create index if not exists contractor_dashboard_users_contractor_id_idx on public.contractor_dashboard_users(contractor_id);
create index if not exists contractor_lead_activity_contractor_idx on public.contractor_lead_activity(contractor_id);
create index if not exists contractor_lead_activity_lead_idx on public.contractor_lead_activity(lead_request_id);
create index if not exists contractor_notes_contractor_lead_idx on public.contractor_notes(contractor_id, lead_request_id);
create index if not exists contractor_availability_contractor_idx on public.contractor_availability_windows(contractor_id);

-- V12 business rule:
-- Only contractors with an active contractor_dashboard_users row and verified status should see dashboard leads.
-- Unverified contractors remain on V9 public contact routing until their claim is reviewed and approved.

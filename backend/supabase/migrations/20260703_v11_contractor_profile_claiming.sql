-- V11 additions: contractor profile claiming, verification, service areas, and lead preferences

create table if not exists public.contractor_profile_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  contractor_id uuid references public.contractors(id) on delete set null,
  business_name text not null,
  contact_name text not null,
  contact_role text,
  contact_email text not null,
  contact_phone text,
  website text,
  license_number text,
  service_zip_codes jsonb not null default '[]'::jsonb,
  service_radius_miles integer,
  emergency_service boolean default false,
  lead_preferences jsonb not null default '[]'::jsonb,
  verification_notes text,
  claim_status text not null default 'submitted' check (claim_status in ('draft', 'submitted', 'needs_review', 'verified', 'rejected')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.contractor_service_areas (
  id uuid primary key default gen_random_uuid(),
  contractor_id uuid references public.contractors(id) on delete cascade,
  claim_id uuid references public.contractor_profile_claims(id) on delete set null,
  zip_code text not null,
  radius_miles integer,
  emergency_service boolean default false,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.contractor_lead_preferences (
  id uuid primary key default gen_random_uuid(),
  contractor_id uuid references public.contractors(id) on delete cascade,
  claim_id uuid references public.contractor_profile_claims(id) on delete set null,
  preferred_method text not null check (preferred_method in ('dashboard', 'email', 'phone', 'sms', 'website_form')),
  destination text,
  active boolean default true,
  created_at timestamptz default now()
);

alter table public.contractor_profile_claims enable row level security;
alter table public.contractor_service_areas enable row level security;
alter table public.contractor_lead_preferences enable row level security;

create policy "Users can create their own contractor profile claims" on public.contractor_profile_claims
  for insert with check (auth.uid() = user_id);

create policy "Users can read their own contractor profile claims" on public.contractor_profile_claims
  for select using (auth.uid() = user_id);

create policy "Users can update their own draft or review-needed claims" on public.contractor_profile_claims
  for update using (auth.uid() = user_id and claim_status in ('draft', 'needs_review'))
  with check (auth.uid() = user_id);

create policy "Anyone can read active contractor service areas" on public.contractor_service_areas
  for select using (active = true);

create policy "Anyone can read active contractor lead preferences" on public.contractor_lead_preferences
  for select using (active = true);

alter table public.contractors add column if not exists claimed_by_user_id uuid references public.profiles(id) on delete set null;
alter table public.contractors add column if not exists claimed_at timestamptz;
alter table public.contractors add column if not exists verification_status text check (verification_status in ('unclaimed', 'claim_submitted', 'needs_review', 'verified', 'rejected')) default 'unclaimed';
alter table public.contractors add column if not exists verified_at timestamptz;
alter table public.contractors add column if not exists lead_preferences jsonb not null default '[]'::jsonb;
alter table public.contractors add column if not exists service_zip_codes jsonb not null default '[]'::jsonb;

create index if not exists contractor_profile_claims_user_id_idx on public.contractor_profile_claims(user_id);
create index if not exists contractor_profile_claims_contractor_id_idx on public.contractor_profile_claims(contractor_id);
create index if not exists contractor_profile_claims_status_idx on public.contractor_profile_claims(claim_status);
create index if not exists contractor_service_areas_zip_idx on public.contractor_service_areas(zip_code);
create index if not exists contractor_lead_preferences_contractor_idx on public.contractor_lead_preferences(contractor_id);

-- Future admin/review workflow:
-- When a claim is verified, copy claim details into contractors, create service area rows,
-- create lead preference rows, set hvac_truth_verified = true, and set accepts_dashboard_leads based on preferences.

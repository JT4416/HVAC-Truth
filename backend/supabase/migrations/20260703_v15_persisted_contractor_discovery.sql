-- V15 additions: persisted contractor discovery records

alter table public.contractors
  add column if not exists normalized_business_key text,
  add column if not exists discovery_sources jsonb not null default '[]'::jsonb,
  add column if not exists source_ids jsonb not null default '{}'::jsonb;

create unique index if not exists contractors_google_place_id_unique_idx
  on public.contractors(google_place_id)
  where google_place_id is not null;

create unique index if not exists contractors_yelp_business_id_unique_idx
  on public.contractors(yelp_business_id)
  where yelp_business_id is not null;

create index if not exists contractors_normalized_business_key_idx
  on public.contractors(normalized_business_key)
  where normalized_business_key is not null;

create index if not exists contractors_discovery_sources_idx
  on public.contractors using gin(discovery_sources);

create index if not exists contractors_source_ids_idx
  on public.contractors using gin(source_ids);

create table if not exists public.contractor_discovery_match_events (
  id uuid primary key default gen_random_uuid(),
  discovery_run_id uuid references public.contractor_discovery_runs(id) on delete set null,
  contractor_id uuid references public.contractors(id) on delete set null,
  business_name text not null,
  zip_code text,
  match_method text not null default 'unknown',
  provider_sources jsonb not null default '[]'::jsonb,
  provider_source_ids jsonb not null default '{}'::jsonb,
  persisted boolean default false,
  created_at timestamptz default now()
);

alter table public.contractor_discovery_match_events enable row level security;

create policy "Anyone can read contractor discovery match events" on public.contractor_discovery_match_events
  for select using (true);

create index if not exists contractor_discovery_match_events_contractor_idx
  on public.contractor_discovery_match_events(contractor_id, created_at);

create index if not exists contractor_discovery_match_events_run_idx
  on public.contractor_discovery_match_events(discovery_run_id, created_at);

-- V15 rule:
-- Provider search results should be persisted or matched to existing contractor records
-- before they are returned to the mobile app. This gives V14 dashboard routing a real contractor ID.

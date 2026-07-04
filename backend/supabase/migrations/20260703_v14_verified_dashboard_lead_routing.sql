-- V14 additions: verified dashboard lead routing

alter table public.contractor_lead_recipients
  add column if not exists dashboard_delivery_status text not null default 'not_applicable'
    check (dashboard_delivery_status in ('not_applicable', 'dashboard_ready', 'viewed', 'accepted', 'declined', 'scheduled', 'closed')),
  add column if not exists dashboard_delivery_ready_at timestamptz,
  add column if not exists dashboard_delivery_notes text;

update public.contractor_lead_recipients
set dashboard_delivery_status = 'dashboard_ready',
    dashboard_delivery_ready_at = coalesce(dashboard_delivery_ready_at, created_at),
    homeowner_action_required = false,
    recipient_status = case when recipient_status = 'selected' then 'sent' else recipient_status end
where delivery_method = 'verified_dashboard';

update public.contractor_lead_recipients
set dashboard_delivery_status = 'not_applicable'
where delivery_method <> 'verified_dashboard'
  and dashboard_delivery_status = 'dashboard_ready';

create index if not exists contractor_lead_recipients_dashboard_routing_idx
  on public.contractor_lead_recipients(contractor_id, delivery_method, dashboard_delivery_status, created_at);

create index if not exists contractor_lead_recipients_verified_dashboard_request_idx
  on public.contractor_lead_recipients(lead_request_id, delivery_method)
  where delivery_method = 'verified_dashboard';

create table if not exists public.verified_dashboard_lead_routing_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  lead_request_id uuid references public.contractor_lead_requests(id) on delete cascade,
  recipient_id uuid references public.contractor_lead_recipients(id) on delete cascade,
  contractor_id uuid references public.contractors(id) on delete set null,
  contractor_name text,
  routing_status text not null default 'prepared'
    check (routing_status in ('prepared', 'dashboard_ready', 'public_fallback', 'blocked', 'error')),
  routing_reason text,
  created_at timestamptz default now()
);

alter table public.verified_dashboard_lead_routing_events enable row level security;

create policy "Users can read their verified dashboard routing events" on public.verified_dashboard_lead_routing_events
  for select using (auth.uid() = user_id);

create policy "Users can create their verified dashboard routing events" on public.verified_dashboard_lead_routing_events
  for insert with check (auth.uid() = user_id);

create policy "Verified dashboard users can read their routing events" on public.verified_dashboard_lead_routing_events
  for select using (
    exists (
      select 1 from public.contractor_dashboard_users cdu
      where cdu.user_id = auth.uid()
        and cdu.contractor_id = verified_dashboard_lead_routing_events.contractor_id
        and cdu.dashboard_status = 'active'
        and cdu.verification_status = 'verified'
    )
  );

create index if not exists verified_dashboard_lead_routing_events_request_idx
  on public.verified_dashboard_lead_routing_events(lead_request_id, recipient_id);

create index if not exists verified_dashboard_lead_routing_events_contractor_idx
  on public.verified_dashboard_lead_routing_events(contractor_id, routing_status, created_at);

-- Business rule:
-- Only contractor_lead_recipients rows with delivery_method = 'verified_dashboard'
-- should appear in the contractor dashboard. Unverified contractors must remain on V9 public-contact routing.

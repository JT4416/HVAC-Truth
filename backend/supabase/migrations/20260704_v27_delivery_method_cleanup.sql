-- V27 additions: separate contractor delivery methods from lead-category preference language

create table if not exists public.contractor_delivery_methods (
  id uuid primary key default gen_random_uuid(),
  contractor_id uuid references public.contractors(id) on delete cascade,
  claim_id uuid references public.contractor_profile_claims(id) on delete set null,
  delivery_method text not null check (delivery_method in ('dashboard', 'email', 'phone', 'sms', 'website_form')),
  destination text,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(contractor_id, delivery_method, destination)
);

alter table public.contractor_delivery_methods enable row level security;

create policy "Active admins can read contractor delivery methods" on public.contractor_delivery_methods
  for select using (
    exists (
      select 1 from public.app_admin_users aau
      where aau.user_id = auth.uid()
        and aau.active = true
        and aau.role in ('owner', 'admin', 'reviewer')
    )
  );

create policy "Active admins can insert contractor delivery methods" on public.contractor_delivery_methods
  for insert with check (
    exists (
      select 1 from public.app_admin_users aau
      where aau.user_id = auth.uid()
        and aau.active = true
        and aau.role in ('owner', 'admin', 'reviewer')
    )
  );

create policy "Active admins can update contractor delivery methods" on public.contractor_delivery_methods
  for update using (
    exists (
      select 1 from public.app_admin_users aau
      where aau.user_id = auth.uid()
        and aau.active = true
        and aau.role in ('owner', 'admin', 'reviewer')
    )
  ) with check (
    exists (
      select 1 from public.app_admin_users aau
      where aau.user_id = auth.uid()
        and aau.active = true
        and aau.role in ('owner', 'admin', 'reviewer')
    )
  );

create policy "Verified contractor users can read their delivery methods" on public.contractor_delivery_methods
  for select using (
    exists (
      select 1 from public.contractor_dashboard_users cdu
      where cdu.user_id = auth.uid()
        and cdu.contractor_id = contractor_delivery_methods.contractor_id
        and cdu.dashboard_status = 'active'
        and cdu.verification_status = 'verified'
    )
  );

insert into public.contractor_delivery_methods (
  contractor_id,
  claim_id,
  delivery_method,
  destination,
  active,
  created_at,
  updated_at
)
select
  contractor_id,
  claim_id,
  preferred_method,
  destination,
  active,
  created_at,
  coalesce(updated_at, created_at, now())
from public.contractor_lead_preferences
where preferred_method in ('dashboard', 'email', 'phone', 'sms', 'website_form')
on conflict (contractor_id, delivery_method, destination) do update
set active = excluded.active,
    claim_id = excluded.claim_id,
    updated_at = now();

create index if not exists contractor_delivery_methods_contractor_idx
  on public.contractor_delivery_methods(contractor_id, active);

create index if not exists contractor_delivery_methods_method_idx
  on public.contractor_delivery_methods(delivery_method, active);

comment on table public.contractor_delivery_methods is
  'Contractor contact and routing methods. Replaces the older contractor_lead_preferences language, which described delivery methods rather than lead-category preferences.';

comment on table public.contractor_lead_preferences is
  'Legacy compatibility table. These rows represent contractor delivery methods, not lead-category preferences.';

comment on column public.contractors.lead_preferences is
  'Legacy compatibility column. Values represent delivery methods, not lead-category preferences.';

comment on column public.contractor_profile_claims.lead_preferences is
  'Legacy compatibility column. Values represent requested delivery methods for claim review, not lead-category preferences.';

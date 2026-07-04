-- V24 — Verified Contractor Participation Rules
-- Verified contractors are either active in the HVAC Truth lead network or inactive.
-- They may manage operating limits, not lead-category selection.

alter table public.contractors
  add column if not exists hvac_truth_participation_status text default 'inactive'
    check (hvac_truth_participation_status in ('active', 'inactive', 'paused', 'suspended')),
  add column if not exists participation_paused boolean default false,
  add column if not exists participation_pause_reason text,
  add column if not exists max_daily_dashboard_leads integer,
  add column if not exists max_weekly_dashboard_leads integer,
  add column if not exists accepts_all_eligible_lead_types boolean default true;

comment on column public.contractors.hvac_truth_participation_status is
  'V24: active/inactive/paused/suspended participation in the HVAC Truth verified lead network.';

comment on column public.contractors.accepts_all_eligible_lead_types is
  'V24: verified contractors accept all eligible HVAC Truth lead types within service area and operating limits. This is not a lead-category preference switch.';

comment on column public.contractors.max_daily_dashboard_leads is
  'V24: optional operational capacity limit for direct dashboard leads.';

comment on column public.contractors.max_weekly_dashboard_leads is
  'V24: optional operational capacity limit for direct dashboard leads.';

update public.contractors
set accepts_all_eligible_lead_types = true
where accepts_all_eligible_lead_types is null;

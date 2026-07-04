-- V25 — Participation Admin Controls
-- Adds admin write policy support for verified contractor participation fields.

create policy if not exists "Active admins can update contractor participation"
  on public.contractors
  for update
  using (
    exists (
      select 1 from public.app_admin_users aau
      where aau.user_id = auth.uid()
        and aau.active = true
        and aau.role in ('owner', 'admin', 'reviewer')
    )
  )
  with check (
    exists (
      select 1 from public.app_admin_users aau
      where aau.user_id = auth.uid()
        and aau.active = true
        and aau.role in ('owner', 'admin', 'reviewer')
    )
  );

create policy if not exists "Active admins can read verified contractors"
  on public.contractors
  for select
  using (
    true
    or exists (
      select 1 from public.app_admin_users aau
      where aau.user_id = auth.uid()
        and aau.active = true
        and aau.role in ('owner', 'admin', 'reviewer')
    )
  );

create or replace function public.set_contractor_participation(
  contractor_id_input uuid,
  admin_user_id_input uuid,
  participation_status_input text,
  participation_paused_input boolean default false,
  pause_reason_input text default null,
  service_zip_codes_input jsonb default null,
  emergency_service_input boolean default null,
  max_daily_dashboard_leads_input integer default null,
  max_weekly_dashboard_leads_input integer default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  is_admin boolean;
begin
  select exists (
    select 1 from public.app_admin_users aau
    where aau.user_id = admin_user_id_input
      and aau.active = true
      and aau.role in ('owner', 'admin', 'reviewer')
  ) into is_admin;

  if not is_admin then
    raise exception 'User is not authorized to update contractor participation.';
  end if;

  if participation_status_input not in ('active', 'inactive', 'paused', 'suspended') then
    raise exception 'Invalid participation status.';
  end if;

  update public.contractors
  set hvac_truth_participation_status = participation_status_input,
      accepts_dashboard_leads = participation_status_input = 'active',
      participation_paused = participation_paused_input,
      participation_pause_reason = nullif(trim(coalesce(pause_reason_input, '')), ''),
      service_zip_codes = coalesce(service_zip_codes_input, service_zip_codes),
      emergency_service = coalesce(emergency_service_input, emergency_service),
      max_daily_dashboard_leads = max_daily_dashboard_leads_input,
      max_weekly_dashboard_leads = max_weekly_dashboard_leads_input,
      accepts_all_eligible_lead_types = true,
      updated_at = now()
  where id = contractor_id_input;

  insert into public.app_events (user_id, event_name, event_payload)
  values (
    admin_user_id_input,
    'contractor_participation_updated',
    jsonb_build_object(
      'contractorId', contractor_id_input,
      'participationStatus', participation_status_input,
      'paused', participation_paused_input,
      'serviceZipCodes', service_zip_codes_input,
      'emergencyService', emergency_service_input,
      'maxDailyDashboardLeads', max_daily_dashboard_leads_input,
      'maxWeeklyDashboardLeads', max_weekly_dashboard_leads_input
    )
  );

  return contractor_id_input;
end;
$$;

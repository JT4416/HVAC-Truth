-- V13 additions: contractor profile claim review and verification workflow

create table if not exists public.app_admin_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade unique,
  role text not null default 'reviewer' check (role in ('owner', 'admin', 'reviewer')),
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.app_admin_users enable row level security;

create policy "Admin users can read their own admin access" on public.app_admin_users
  for select using (auth.uid() = user_id);

create policy "Active admins can read contractor claims for review" on public.contractor_profile_claims
  for select using (
    exists (
      select 1 from public.app_admin_users aau
      where aau.user_id = auth.uid()
        and aau.active = true
        and aau.role in ('owner', 'admin', 'reviewer')
    )
  );

create policy "Active admins can update contractor claims for review" on public.contractor_profile_claims
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

create policy "Active admins can create contractor dashboard users" on public.contractor_dashboard_users
  for insert with check (
    exists (
      select 1 from public.app_admin_users aau
      where aau.user_id = auth.uid()
        and aau.active = true
        and aau.role in ('owner', 'admin', 'reviewer')
    )
  );

create policy "Active admins can update contractor dashboard users" on public.contractor_dashboard_users
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

create or replace function public.review_contractor_profile_claim(
  claim_id_input uuid,
  reviewer_user_id_input uuid,
  decision_input text,
  review_notes_input text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  claim_row public.contractor_profile_claims%rowtype;
  contractor_id_result uuid;
  lead_pref text;
  zip_value text;
  is_admin boolean;
begin
  select exists (
    select 1 from public.app_admin_users aau
    where aau.user_id = reviewer_user_id_input
      and aau.active = true
      and aau.role in ('owner', 'admin', 'reviewer')
  ) into is_admin;

  if not is_admin then
    raise exception 'Reviewer is not authorized to review contractor claims.';
  end if;

  if decision_input not in ('verified', 'needs_review', 'rejected') then
    raise exception 'Invalid contractor claim review decision.';
  end if;

  select * into claim_row
  from public.contractor_profile_claims
  where id = claim_id_input
  for update;

  if not found then
    raise exception 'Contractor profile claim not found.';
  end if;

  if decision_input = 'verified' then
    if claim_row.contractor_id is null then
      insert into public.contractors (
        business_name,
        phone,
        website,
        published_email,
        hvac_truth_verified,
        accepts_dashboard_leads,
        accepts_email_leads,
        accepts_sms_leads,
        verification_status,
        claimed_by_user_id,
        claimed_at,
        verified_at,
        lead_preferences,
        service_zip_codes,
        contact_confidence,
        contact_source
      ) values (
        claim_row.business_name,
        claim_row.contact_phone,
        claim_row.website,
        claim_row.contact_email,
        true,
        claim_row.lead_preferences ? 'dashboard',
        claim_row.lead_preferences ? 'email',
        claim_row.lead_preferences ? 'sms',
        'verified',
        claim_row.user_id,
        now(),
        now(),
        claim_row.lead_preferences,
        claim_row.service_zip_codes,
        'verified',
        'hvac_truth_claim_review'
      )
      returning id into contractor_id_result;
    else
      contractor_id_result := claim_row.contractor_id;

      update public.contractors
      set business_name = claim_row.business_name,
          phone = claim_row.contact_phone,
          website = claim_row.website,
          published_email = claim_row.contact_email,
          hvac_truth_verified = true,
          accepts_dashboard_leads = claim_row.lead_preferences ? 'dashboard',
          accepts_email_leads = claim_row.lead_preferences ? 'email',
          accepts_sms_leads = claim_row.lead_preferences ? 'sms',
          verification_status = 'verified',
          claimed_by_user_id = claim_row.user_id,
          claimed_at = coalesce(claimed_at, now()),
          verified_at = now(),
          lead_preferences = claim_row.lead_preferences,
          service_zip_codes = claim_row.service_zip_codes,
          contact_confidence = 'verified',
          contact_source = 'hvac_truth_claim_review'
      where id = contractor_id_result;
    end if;

    update public.contractor_profile_claims
    set contractor_id = contractor_id_result,
        claim_status = 'verified',
        reviewed_by = reviewer_user_id_input,
        reviewed_at = now(),
        review_notes = review_notes_input,
        updated_at = now()
    where id = claim_id_input;

    insert into public.contractor_dashboard_users (
      user_id,
      contractor_id,
      business_name,
      role,
      dashboard_status,
      verification_status
    ) values (
      claim_row.user_id,
      contractor_id_result,
      claim_row.business_name,
      'owner',
      'active',
      'verified'
    )
    on conflict (user_id, contractor_id) do update
    set business_name = excluded.business_name,
        dashboard_status = 'active',
        verification_status = 'verified',
        updated_at = now();

    delete from public.contractor_service_areas where contractor_id = contractor_id_result;
    for zip_value in select jsonb_array_elements_text(claim_row.service_zip_codes)
    loop
      insert into public.contractor_service_areas (
        contractor_id,
        claim_id,
        zip_code,
        radius_miles,
        emergency_service,
        active
      ) values (
        contractor_id_result,
        claim_row.id,
        zip_value,
        claim_row.service_radius_miles,
        claim_row.emergency_service,
        true
      );
    end loop;

    delete from public.contractor_lead_preferences where contractor_id = contractor_id_result;
    for lead_pref in select jsonb_array_elements_text(claim_row.lead_preferences)
    loop
      insert into public.contractor_lead_preferences (
        contractor_id,
        claim_id,
        preferred_method,
        destination,
        active
      ) values (
        contractor_id_result,
        claim_row.id,
        lead_pref,
        case
          when lead_pref = 'email' then claim_row.contact_email
          when lead_pref = 'phone' then claim_row.contact_phone
          when lead_pref = 'sms' then claim_row.contact_phone
          when lead_pref = 'website_form' then claim_row.website
          else null
        end,
        true
      );
    end loop;

    return contractor_id_result;
  end if;

  update public.contractor_profile_claims
  set claim_status = decision_input,
      reviewed_by = reviewer_user_id_input,
      reviewed_at = now(),
      review_notes = review_notes_input,
      updated_at = now()
  where id = claim_id_input;

  return claim_row.contractor_id;
end;
$$;

create index if not exists app_admin_users_user_id_idx on public.app_admin_users(user_id);
create index if not exists contractor_profile_claims_review_status_idx on public.contractor_profile_claims(claim_status, created_at);

-- Bootstrap note:
-- Add the first reviewer manually in Supabase after confirming the correct user profile id:
-- insert into public.app_admin_users (user_id, role, active) values ('<profile_uuid>', 'owner', true);

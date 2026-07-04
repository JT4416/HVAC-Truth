-- V30 test harness: claim review delivery-method write-through
--
-- Purpose:
--   Validate that public.review_contractor_profile_claim(..., 'verified', ...)
--   writes approved claim routes to public.contractor_delivery_methods and preserves
--   matching legacy rows in public.contractor_lead_preferences.
--
-- Safety:
--   This script starts a transaction and rolls back by default. It is intended for a
--   local Supabase database, a clean Supabase branch, or a staging project.
--
-- Before running:
--   1. Apply migrations through V29.
--   2. Replace the two UUIDs in hvac_truth_v30_test_config with profile ids that
--      already exist in public.profiles in the target environment.
--   3. Run the full script.
--   4. Leave the final ROLLBACK in place unless you intentionally want to keep data.

begin;

create temporary table hvac_truth_v30_test_config (
  reviewer_user_id uuid not null,
  contractor_user_id uuid not null
) on commit drop;

insert into hvac_truth_v30_test_config (
  reviewer_user_id,
  contractor_user_id
) values (
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid
);

do $$
declare
  reviewer_user_id_value uuid;
  contractor_user_id_value uuid;
  claim_id_value uuid;
  contractor_id_value uuid;
  delivery_count integer;
  legacy_count integer;
  service_area_count integer;
  dashboard_access_count integer;
  missing_destination_count integer;
  contractor_verified_count integer;
begin
  select reviewer_user_id, contractor_user_id
  into reviewer_user_id_value, contractor_user_id_value
  from hvac_truth_v30_test_config
  limit 1;

  if reviewer_user_id_value = '00000000-0000-0000-0000-000000000001'::uuid
     or contractor_user_id_value = '00000000-0000-0000-0000-000000000002'::uuid then
    raise exception 'Replace placeholder reviewer_user_id and contractor_user_id before running the V30 harness.';
  end if;

  if not exists (select 1 from public.profiles where id = reviewer_user_id_value) then
    raise exception 'Reviewer profile % does not exist in public.profiles.', reviewer_user_id_value;
  end if;

  if not exists (select 1 from public.profiles where id = contractor_user_id_value) then
    raise exception 'Contractor profile % does not exist in public.profiles.', contractor_user_id_value;
  end if;

  insert into public.app_admin_users (
    user_id,
    role,
    active
  ) values (
    reviewer_user_id_value,
    'owner',
    true
  )
  on conflict (user_id) do update
  set role = 'owner',
      active = true,
      updated_at = now();

  insert into public.contractor_profile_claims (
    user_id,
    business_name,
    contact_name,
    contact_role,
    contact_email,
    contact_phone,
    website,
    license_number,
    service_zip_codes,
    service_radius_miles,
    emergency_service,
    lead_preferences,
    verification_notes,
    claim_status
  ) values (
    contractor_user_id_value,
    'HVAC Truth V30 Test Contractor',
    'V30 Test Owner',
    'Owner',
    'v30-contractor@example.com',
    '555-030-0030',
    'https://example.com/v30-contractor',
    'V30-TEST-LICENSE',
    '["33401", "33405"]'::jsonb,
    25,
    true,
    '["dashboard", "email", "phone", "sms", "website_form"]'::jsonb,
    'V30 test harness claim. This transaction should be rolled back.',
    'submitted'
  ) returning id into claim_id_value;

  contractor_id_value := public.review_contractor_profile_claim(
    claim_id_value,
    reviewer_user_id_value,
    'verified',
    'V30 harness approved this synthetic claim.'
  );

  if contractor_id_value is null then
    raise exception 'Review RPC returned null contractor_id for verified claim %.', claim_id_value;
  end if;

  select count(*) into contractor_verified_count
  from public.contractors
  where id = contractor_id_value
    and hvac_truth_verified = true
    and verification_status = 'verified'
    and contact_source = 'hvac_truth_claim_review';

  if contractor_verified_count <> 1 then
    raise exception 'Expected verified contractor row for %, found %.', contractor_id_value, contractor_verified_count;
  end if;

  select count(*) into delivery_count
  from public.contractor_delivery_methods
  where contractor_id = contractor_id_value
    and claim_id = claim_id_value
    and active = true
    and delivery_method in ('dashboard', 'email', 'phone', 'sms', 'website_form');

  if delivery_count <> 5 then
    raise exception 'Expected 5 contractor_delivery_methods rows, found %.', delivery_count;
  end if;

  select count(*) into legacy_count
  from public.contractor_lead_preferences
  where contractor_id = contractor_id_value
    and claim_id = claim_id_value
    and active = true
    and preferred_method in ('dashboard', 'email', 'phone', 'sms', 'website_form');

  if legacy_count <> 5 then
    raise exception 'Expected 5 contractor_lead_preferences compatibility rows, found %.', legacy_count;
  end if;

  select count(*) into missing_destination_count
  from public.contractor_delivery_methods
  where contractor_id = contractor_id_value
    and claim_id = claim_id_value
    and active = true
    and (
      (delivery_method = 'email' and destination is distinct from 'v30-contractor@example.com')
      or (delivery_method = 'phone' and destination is distinct from '555-030-0030')
      or (delivery_method = 'sms' and destination is distinct from '555-030-0030')
      or (delivery_method = 'website_form' and destination is distinct from 'https://example.com/v30-contractor')
      or (delivery_method = 'dashboard' and destination is not null)
    );

  if missing_destination_count <> 0 then
    raise exception 'Delivery destination mapping failed for % row(s).', missing_destination_count;
  end if;

  select count(*) into service_area_count
  from public.contractor_service_areas
  where contractor_id = contractor_id_value
    and claim_id = claim_id_value
    and active = true
    and zip_code in ('33401', '33405');

  if service_area_count <> 2 then
    raise exception 'Expected 2 contractor service area rows, found %.', service_area_count;
  end if;

  select count(*) into dashboard_access_count
  from public.contractor_dashboard_users
  where contractor_id = contractor_id_value
    and user_id = contractor_user_id_value
    and dashboard_status = 'active'
    and verification_status = 'verified';

  if dashboard_access_count <> 1 then
    raise exception 'Expected verified active contractor dashboard access, found % row(s).', dashboard_access_count;
  end if;

  raise notice 'V30 claim review delivery-method write-through harness passed. claim_id=%, contractor_id=%', claim_id_value, contractor_id_value;
end;
$$;

-- Keep rollback by default so this harness is repeatable and safe for staging checks.
rollback;

-- To inspect generated rows manually, change rollback to commit in a disposable database only.

-- V31 test harness: claim review negative paths and read verification
--
-- Purpose:
--   Extend V30 by validating expected failure paths for
--   public.review_contractor_profile_claim(...) and confirming the approved-claim
--   delivery route data can be read from the new contractor_delivery_methods table.
--
-- Safety:
--   This script starts a transaction and rolls back by default. It is intended for a
--   local Supabase database, a clean Supabase branch, or a staging project.
--
-- Before running:
--   1. Apply migrations through V29.
--   2. Replace the two UUIDs in hvac_truth_v31_test_config with profile ids that
--      already exist in public.profiles in the target environment.
--   3. The two UUIDs must be different.
--   4. Run the full script.
--   5. Leave the final ROLLBACK in place unless you intentionally want to keep data.

begin;

create temporary table hvac_truth_v31_test_config (
  reviewer_user_id uuid not null,
  contractor_user_id uuid not null
) on commit drop;

insert into hvac_truth_v31_test_config (
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
  unauthorized_claim_id_value uuid;
  invalid_decision_claim_id_value uuid;
  read_order_methods text;
  delivery_count integer;
  legacy_count integer;
  service_area_count integer;
  dashboard_access_count integer;
  contractor_verified_count integer;
  expected_error_count integer := 0;
begin
  select reviewer_user_id, contractor_user_id
  into reviewer_user_id_value, contractor_user_id_value
  from hvac_truth_v31_test_config
  limit 1;

  if reviewer_user_id_value = '00000000-0000-0000-0000-000000000001'::uuid
     or contractor_user_id_value = '00000000-0000-0000-0000-000000000002'::uuid then
    raise exception 'Replace placeholder reviewer_user_id and contractor_user_id before running the V31 harness.';
  end if;

  if reviewer_user_id_value = contractor_user_id_value then
    raise exception 'V31 harness requires two different profile UUIDs.';
  end if;

  if not exists (select 1 from public.profiles where id = reviewer_user_id_value) then
    raise exception 'Reviewer profile % does not exist in public.profiles.', reviewer_user_id_value;
  end if;

  if not exists (select 1 from public.profiles where id = contractor_user_id_value) then
    raise exception 'Contractor profile % does not exist in public.profiles.', contractor_user_id_value;
  end if;

  -- Keep the contractor user unauthorized so the first negative path is deterministic.
  delete from public.app_admin_users where user_id = contractor_user_id_value;

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
    'HVAC Truth V31 Unauthorized Reviewer Test',
    'V31 Unauthorized Owner',
    'Owner',
    'v31-unauthorized@example.com',
    '555-031-0001',
    'https://example.com/v31-unauthorized',
    'V31-UNAUTHORIZED',
    '["33401"]'::jsonb,
    20,
    false,
    '["dashboard", "email"]'::jsonb,
    'V31 unauthorized reviewer negative path claim.',
    'submitted'
  ) returning id into unauthorized_claim_id_value;

  begin
    perform public.review_contractor_profile_claim(
      unauthorized_claim_id_value,
      contractor_user_id_value,
      'verified',
      'This should fail because reviewer is not authorized.'
    );
    raise exception 'Expected unauthorized reviewer path to fail, but it succeeded.';
  exception
    when others then
      if sqlerrm like '%not authorized%' then
        expected_error_count := expected_error_count + 1;
      else
        raise;
      end if;
  end;

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
    'HVAC Truth V31 Invalid Decision Test',
    'V31 Invalid Decision Owner',
    'Owner',
    'v31-invalid-decision@example.com',
    '555-031-0002',
    'https://example.com/v31-invalid-decision',
    'V31-INVALID-DECISION',
    '["33405"]'::jsonb,
    20,
    false,
    '["dashboard"]'::jsonb,
    'V31 invalid decision negative path claim.',
    'submitted'
  ) returning id into invalid_decision_claim_id_value;

  begin
    perform public.review_contractor_profile_claim(
      invalid_decision_claim_id_value,
      reviewer_user_id_value,
      'approved',
      'This should fail because approved is not a valid decision.'
    );
    raise exception 'Expected invalid decision path to fail, but it succeeded.';
  exception
    when others then
      if sqlerrm like '%Invalid contractor claim review decision%' then
        expected_error_count := expected_error_count + 1;
      else
        raise;
      end if;
  end;

  begin
    perform public.review_contractor_profile_claim(
      gen_random_uuid(),
      reviewer_user_id_value,
      'verified',
      'This should fail because claim does not exist.'
    );
    raise exception 'Expected missing claim path to fail, but it succeeded.';
  exception
    when others then
      if sqlerrm like '%Contractor profile claim not found%' then
        expected_error_count := expected_error_count + 1;
      else
        raise;
      end if;
  end;

  if expected_error_count <> 3 then
    raise exception 'Expected 3 negative path errors, observed %.', expected_error_count;
  end if;

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
    'HVAC Truth V31 Positive Read Test',
    'V31 Positive Owner',
    'Owner',
    'v31-positive@example.com',
    '555-031-0031',
    'https://example.com/v31-positive',
    'V31-POSITIVE',
    '["33401", "33405"]'::jsonb,
    25,
    true,
    '["dashboard", "email", "phone", "sms", "website_form"]'::jsonb,
    'V31 positive read verification claim.',
    'submitted'
  ) returning id into claim_id_value;

  contractor_id_value := public.review_contractor_profile_claim(
    claim_id_value,
    reviewer_user_id_value,
    'verified',
    'V31 harness approved this synthetic claim.'
  );

  if contractor_id_value is null then
    raise exception 'Review RPC returned null contractor_id for verified claim %.', claim_id_value;
  end if;

  select count(*) into contractor_verified_count
  from public.contractors
  where id = contractor_id_value
    and hvac_truth_verified = true
    and verification_status = 'verified';

  if contractor_verified_count <> 1 then
    raise exception 'Expected verified contractor row for %, found %.', contractor_id_value, contractor_verified_count;
  end if;

  select count(*) into delivery_count
  from public.contractor_delivery_methods
  where contractor_id = contractor_id_value
    and claim_id = claim_id_value
    and active = true;

  if delivery_count <> 5 then
    raise exception 'Expected 5 contractor_delivery_methods rows, found %.', delivery_count;
  end if;

  select string_agg(delivery_method, ',' order by created_at, delivery_method)
  into read_order_methods
  from public.contractor_delivery_methods
  where contractor_id = contractor_id_value
    and active = true;

  if read_order_methods is null or read_order_methods not like '%dashboard%' or read_order_methods not like '%email%' then
    raise exception 'Expected read verification to find new delivery-method rows, found %.', read_order_methods;
  end if;

  select count(*) into legacy_count
  from public.contractor_lead_preferences
  where contractor_id = contractor_id_value
    and claim_id = claim_id_value
    and active = true;

  if legacy_count <> 5 then
    raise exception 'Expected 5 contractor_lead_preferences compatibility rows, found %.', legacy_count;
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

  raise notice 'V31 claim review negative-path and read-verification harness passed. claim_id=%, contractor_id=%', claim_id_value, contractor_id_value;
end;
$$;

-- Keep rollback by default so this harness is repeatable and safe for staging checks.
rollback;

-- To inspect generated rows manually, change rollback to commit in a disposable database only.

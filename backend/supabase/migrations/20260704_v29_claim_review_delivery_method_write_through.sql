-- V29 additions: claim approval writes directly to contractor_delivery_methods
--
-- V27 introduced public.contractor_delivery_methods as the durable contact-routing table.
-- V29 replaces the V13 review RPC so approved claims write to the new table while
-- preserving the legacy contractor_lead_preferences compatibility path during transition.

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
  delivery_method_value text;
  delivery_destination text;
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
    for zip_value in select jsonb_array_elements_text(coalesce(claim_row.service_zip_codes, '[]'::jsonb))
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

    -- New durable delivery-method write-through path.
    delete from public.contractor_delivery_methods where contractor_id = contractor_id_result;

    -- Legacy compatibility path. Keep this populated until production reads have been
    -- verified against contractor_delivery_methods and legacy rows are formally retired.
    delete from public.contractor_lead_preferences where contractor_id = contractor_id_result;

    for delivery_method_value in
      select jsonb_array_elements_text(coalesce(claim_row.lead_preferences, '[]'::jsonb))
    loop
      delivery_destination := case
        when delivery_method_value = 'email' then claim_row.contact_email
        when delivery_method_value = 'phone' then claim_row.contact_phone
        when delivery_method_value = 'sms' then claim_row.contact_phone
        when delivery_method_value = 'website_form' then claim_row.website
        else null
      end;

      insert into public.contractor_delivery_methods (
        contractor_id,
        claim_id,
        delivery_method,
        destination,
        active
      ) values (
        contractor_id_result,
        claim_row.id,
        delivery_method_value,
        delivery_destination,
        true
      )
      on conflict (contractor_id, delivery_method, destination) do update
      set claim_id = excluded.claim_id,
          active = true,
          updated_at = now();

      insert into public.contractor_lead_preferences (
        contractor_id,
        claim_id,
        preferred_method,
        destination,
        active
      ) values (
        contractor_id_result,
        claim_row.id,
        delivery_method_value,
        delivery_destination,
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

comment on function public.review_contractor_profile_claim(uuid, uuid, text, text) is
  'Reviews contractor profile claims. V29 version writes approved claim delivery routes to contractor_delivery_methods and preserves contractor_lead_preferences as a legacy compatibility path.';

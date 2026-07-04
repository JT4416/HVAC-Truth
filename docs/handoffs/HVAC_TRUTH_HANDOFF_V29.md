# HVAC Truth Handoff — V29 Complete

Date: 2026-07-04
Repository: `JT4416/HVAC-Truth`
Current stage: **V29 — Claim Review RPC Delivery Method Write-Through**

---

## 1. What V29 Completed

V29 connected contractor claim approval to the delivery-method data model introduced in V27.

Completed scope:

```text
- Read and removed the V28 handoff after intake.
- Added a V29 migration that replaces public.review_contractor_profile_claim(...).
- Approved contractor claims now write directly to public.contractor_delivery_methods.
- Legacy compatibility writes to public.contractor_lead_preferences are preserved.
- Contractor legacy lead_preferences fields remain populated during the transition period.
- Updated delivery-method cleanup documentation.
- Updated README to V29 current stage.
- Added V29 build documentation.
```

---

## 2. Files Added In V29

```text
backend/supabase/migrations/20260704_v29_claim_review_delivery_method_write_through.sql
docs/build/V29_CLAIM_REVIEW_DELIVERY_METHOD_WRITE_THROUGH.md
docs/handoffs/HVAC_TRUTH_HANDOFF_V29.md
```

---

## 3. Files Updated In V29

```text
README.md
docs/features/DELIVERY_METHOD_CLEANUP.md
```

---

## 4. Files Removed In V29

```text
docs/handoffs/HVAC_TRUTH_HANDOFF_V28.md
```

The V28 handoff was read first and then removed from the repository.

---

## 5. Core Database Change

The V29 migration replaces:

```text
public.review_contractor_profile_claim(
  claim_id_input uuid,
  reviewer_user_id_input uuid,
  decision_input text,
  review_notes_input text default null
)
```

When `decision_input = 'verified'`, the RPC now:

```text
- creates or updates the contractor,
- keeps hvac_truth_verified = true,
- preserves legacy contractor lead_preferences fields,
- activates contractor_dashboard_users access,
- refreshes contractor_service_areas,
- deletes old delivery rows for that contractor,
- writes new rows to contractor_delivery_methods,
- writes matching legacy rows to contractor_lead_preferences.
```

---

## 6. Delivery Destination Mapping

```text
email        -> claim contact_email
phone        -> claim contact_phone
sms          -> claim contact_phone
website_form -> claim website
dashboard    -> null destination
```

---

## 7. Migration Order

Run in staging or a clean Supabase branch before production:

```text
backend/supabase/migrations/20260704_v24_verified_contractor_participation.sql
backend/supabase/migrations/20260704_v25_participation_admin_controls.sql
backend/supabase/migrations/20260704_v27_delivery_method_cleanup.sql
backend/supabase/migrations/20260704_v29_claim_review_delivery_method_write_through.sql
```

---

## 8. Local Validation Commands

Run locally:

```bash
cd app
npm install
npm run typecheck
npm start
```

The GitHub connector could not execute local TypeScript, Expo, or Supabase CLI validation.

---

## 9. Validation Checklist For Next Session

```text
- Apply V24, V25, V27, and V29 in a clean Supabase branch or staging project.
- Submit a contractor claim with dashboard, email, sms, phone, and website_form delivery methods.
- Approve the claim through review_contractor_profile_claim(..., 'verified', ...).
- Confirm contractor_delivery_methods has active rows for the approved contractor.
- Confirm contractor_lead_preferences has matching compatibility rows.
- Confirm contractor dashboard access is active and verified.
- Confirm contractor service areas were refreshed.
- Run npm run typecheck.
- Run Expo app startup validation.
```

---

## 10. Core Product Rule Preserved

```text
Verified contractors are either in or out of the HVAC Truth verified network.
They may set operating limits.
They may configure delivery/contact routes.
They may not cherry-pick request categories.
Packet score remains informational only.
```

---

## 11. Recommended V30

Next build:

```text
V30 — Staging Validation and Claim Approval Test Harness
```

Recommended V30 scope:

```text
- Add a repeatable seed/test script or SQL note for contractor claim approval validation.
- Create test claims covering every delivery method.
- Validate contractor_delivery_methods write-through and legacy fallback rows.
- Confirm app reads new delivery rows first.
- Run local TypeScript and Expo validation.
- Run Supabase migrations in staging before production.
```

---

## 12. Recovery Prompt For Next Chat

```text
We are building the HVAC Truth app in GitHub repo JT4416/HVAC-Truth. Read docs/handoffs/HVAC_TRUTH_HANDOFF_V29.md first. Current stage is V29 complete: Claim Review RPC Delivery Method Write-Through. Continue with V30 — Staging Validation and Claim Approval Test Harness. Preserve the verified contractor participation standard. Start by inspecting backend/supabase/migrations/20260704_v29_claim_review_delivery_method_write_through.sql, docs/build/V29_CLAIM_REVIEW_DELIVERY_METHOD_WRITE_THROUGH.md, docs/features/DELIVERY_METHOD_CLEANUP.md, app/src/services/contractorDeliveryMethods.ts, app/src/services/contractorClaimReview.ts, and README.md.
```

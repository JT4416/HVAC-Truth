# HVAC Truth Handoff — V30 Complete

Date: 2026-07-04
Repository: `JT4416/HVAC-Truth`
Current stage: **V30 — Staging Validation and Claim Approval Test Harness**

---

## 1. What V30 Completed

V30 added a rollback-safe Supabase SQL harness for validating the V29 claim review delivery-method write-through flow.

Completed scope:

```text
- Read and removed the V29 handoff after intake.
- Added a V30 SQL test harness under backend/supabase/tests.
- Added V30 build documentation.
- Updated README to V30 current stage.
- Harness creates and approves a synthetic contractor claim inside a transaction.
- Harness validates contractor_delivery_methods rows.
- Harness validates contractor_lead_preferences legacy compatibility rows.
- Harness validates destination mapping for dashboard, email, phone, SMS, and website_form.
- Harness validates verified contractor status, dashboard access, and service area rows.
- Harness ends with rollback by default for repeatable staging/local validation.
```

---

## 2. Files Added In V30

```text
backend/supabase/tests/v30_claim_review_delivery_method_write_through_test.sql
docs/build/V30_STAGING_VALIDATION_AND_TEST_HARNESS.md
docs/handoffs/HVAC_TRUTH_HANDOFF_V30.md
```

---

## 3. Files Updated In V30

```text
README.md
```

---

## 4. Files Removed In V30

```text
docs/handoffs/HVAC_TRUTH_HANDOFF_V29.md
```

The V29 handoff was read first and then removed from the repository.

---

## 5. V30 Harness File

```text
backend/supabase/tests/v30_claim_review_delivery_method_write_through_test.sql
```

The harness is not a production migration. It is a staging/local validation script.

It begins with:

```sql
begin;
```

and ends with:

```sql
rollback;
```

This keeps it repeatable and safe by default.

---

## 6. Required Setup Before Running Harness

Apply migrations through V29 first.

Minimum required order for the currently relevant chain:

```text
backend/supabase/migrations/20260704_v24_verified_contractor_participation.sql
backend/supabase/migrations/20260704_v25_participation_admin_controls.sql
backend/supabase/migrations/20260704_v27_delivery_method_cleanup.sql
backend/supabase/migrations/20260704_v29_claim_review_delivery_method_write_through.sql
```

Then edit the harness config section and replace placeholder UUIDs with two existing `public.profiles.id` values in the target database:

```text
reviewer_user_id   -> profile promoted to app_admin_users owner inside transaction
contractor_user_id -> profile that owns the synthetic claim
```

---

## 7. Run Command

```bash
psql "$SUPABASE_DB_URL" -f backend/supabase/tests/v30_claim_review_delivery_method_write_through_test.sql
```

Or paste the full script into the Supabase SQL editor after replacing placeholder profile UUIDs.

---

## 8. Passing Signal

A passing harness run prints a notice similar to:

```text
V30 claim review delivery-method write-through harness passed. claim_id=<uuid>, contractor_id=<uuid>
```

Any failed assertion raises an exception and stops the transaction.

---

## 9. Local App Validation Commands

Run locally:

```bash
cd app
npm install
npm run typecheck
npm start
```

The GitHub connector could not execute local TypeScript, Expo, or Supabase CLI validation.

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

## 11. Recommended V31

Next build:

```text
V31 — Claim Approval Harness Expansion and App Read Verification
```

Recommended V31 scope:

```text
- Add negative-path harness cases for unauthorized reviewer, invalid decision, and missing claim.
- Add read-path verification for getContractorDeliveryMethods(contractorId) behavior.
- Add an app-side or fixture-level check confirming new delivery rows are preferred before legacy fallback.
- Run local npm run typecheck and Expo validation.
- Run Supabase harness in staging/local database after replacing profile UUIDs.
```

---

## 12. Recovery Prompt For Next Chat

```text
We are building the HVAC Truth app in GitHub repo JT4416/HVAC-Truth. Read docs/handoffs/HVAC_TRUTH_HANDOFF_V30.md first. Current stage is V30 complete: Staging Validation and Claim Approval Test Harness. Continue with V31 — Claim Approval Harness Expansion and App Read Verification. Preserve the verified contractor participation standard. Start by inspecting backend/supabase/tests/v30_claim_review_delivery_method_write_through_test.sql, backend/supabase/migrations/20260704_v29_claim_review_delivery_method_write_through.sql, docs/build/V30_STAGING_VALIDATION_AND_TEST_HARNESS.md, app/src/services/contractorDeliveryMethods.ts, app/src/services/contractorClaimReview.ts, and README.md.
```

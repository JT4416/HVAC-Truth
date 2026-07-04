# V30 — Staging Validation and Claim Approval Test Harness

Date: 2026-07-04
Repository: `JT4416/HVAC-Truth`

## Purpose

V30 adds a repeatable SQL test harness for the V29 claim review delivery-method write-through change.

The harness validates that approving a synthetic contractor claim through `public.review_contractor_profile_claim(...)` creates the new delivery-method rows and preserves the legacy compatibility rows.

## Files Added

```text
backend/supabase/tests/v30_claim_review_delivery_method_write_through_test.sql
docs/build/V30_STAGING_VALIDATION_AND_TEST_HARNESS.md
```

## What The Harness Tests

The SQL harness validates:

```text
- reviewer authorization through app_admin_users,
- claim approval through review_contractor_profile_claim(..., 'verified', ...),
- verified contractor creation/update,
- contractor_dashboard_users verified access activation,
- contractor_service_areas refresh,
- contractor_delivery_methods write-through,
- contractor_lead_preferences legacy compatibility writes,
- delivery destination mapping for dashboard, email, phone, SMS, and website_form.
```

## Required Migration Order

Run in a clean Supabase branch, local database, or staging project before the harness:

```text
backend/supabase/migrations/20260704_v24_verified_contractor_participation.sql
backend/supabase/migrations/20260704_v25_participation_admin_controls.sql
backend/supabase/migrations/20260704_v27_delivery_method_cleanup.sql
backend/supabase/migrations/20260704_v29_claim_review_delivery_method_write_through.sql
```

## Required Test Setup

The harness needs two existing `public.profiles.id` UUIDs from the target database:

```text
reviewer_user_id   -> a profile that will be promoted to app_admin_users owner inside the transaction
contractor_user_id -> a profile that will own the synthetic contractor claim
```

Edit this section inside the harness before running:

```sql
insert into hvac_truth_v30_test_config (
  reviewer_user_id,
  contractor_user_id
) values (
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid
);
```

Replace both placeholder UUIDs with real staging/local profile IDs.

## Run Command

From a local Supabase/Postgres setup, run:

```bash
psql "$SUPABASE_DB_URL" -f backend/supabase/tests/v30_claim_review_delivery_method_write_through_test.sql
```

Or paste the full script into the Supabase SQL editor after replacing the UUID placeholders.

## Safety Behavior

The harness begins with:

```sql
begin;
```

and ends with:

```sql
rollback;
```

That makes the test repeatable and safe by default. It will create a synthetic claim, approve it, assert results, print a pass notice, and roll everything back.

Only change `rollback;` to `commit;` in a disposable database if you intentionally want to inspect the generated rows after the test.

## Passing Signal

A passing run prints a notice similar to:

```text
V30 claim review delivery-method write-through harness passed. claim_id=<uuid>, contractor_id=<uuid>
```

Any failed assertion raises an exception and stops the transaction.

## App Validation Still Required

The GitHub connector cannot run local Expo, TypeScript, or Supabase CLI validation. Run locally:

```bash
cd app
npm install
npm run typecheck
npm start
```

Then run the SQL harness against staging/local Supabase.

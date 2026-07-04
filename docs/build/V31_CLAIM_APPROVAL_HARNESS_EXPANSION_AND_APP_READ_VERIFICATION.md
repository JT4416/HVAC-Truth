# V31 — Claim Approval Harness Expansion and App Read Verification

Date: 2026-07-04
Repository: `JT4416/HVAC-Truth`

## Purpose

V31 expands the V30 claim approval harness with negative-path database coverage and adds app-side read verification helpers for the delivery-method cleanup flow.

V29 made approved claims write directly to `contractor_delivery_methods`. V30 added a rollback-safe positive-path SQL harness. V31 adds failure-path checks and makes the app delivery-method read behavior easier to verify through typechecked helper output.

## Files Added

```text
backend/supabase/tests/v31_claim_review_negative_paths_and_read_verification.sql
app/src/services/contractorDeliveryMethods.fixture.ts
docs/build/V31_CLAIM_APPROVAL_HARNESS_EXPANSION_AND_APP_READ_VERIFICATION.md
```

## Files Updated

```text
app/src/services/contractorDeliveryMethods.ts
README.md
```

## SQL Harness Coverage

The V31 SQL harness validates expected negative paths for:

```text
- unauthorized reviewer,
- invalid review decision,
- missing contractor claim.
```

Then it runs a positive approval path and verifies:

```text
- verified contractor row,
- contractor_delivery_methods rows,
- contractor_lead_preferences legacy compatibility rows,
- contractor_service_areas rows,
- verified contractor dashboard access,
- read-path presence of rows in contractor_delivery_methods.
```

## App Read Verification

`app/src/services/contractorDeliveryMethods.ts` now exports:

```text
ContractorDeliveryMethodReadSource
ContractorDeliveryMethodReadResult
mapContractorDeliveryMethod(row)
buildContractorDeliveryMethodReadResult(rows, error, source)
```

The service still returns the existing `data` and `error` fields, but now also includes:

```text
source: 'contractor_delivery_methods' | 'contractor_lead_preferences'
```

This confirms whether the app read came from the new durable table or the legacy fallback table.

## Fixture Coverage

`app/src/services/contractorDeliveryMethods.fixture.ts` provides a typechecked fixture function:

```text
runContractorDeliveryMethodReadPreferenceFixture()
```

It validates:

```text
- preferred reads identify contractor_delivery_methods as source,
- fallback reads identify contractor_lead_preferences as source,
- legacy preferred_method rows normalize into delivery_method,
- delivery-method summaries still format correctly.
```

## Required Migration Order

Run in a clean Supabase branch, local database, or staging project before the SQL harness:

```text
backend/supabase/migrations/20260704_v24_verified_contractor_participation.sql
backend/supabase/migrations/20260704_v25_participation_admin_controls.sql
backend/supabase/migrations/20260704_v27_delivery_method_cleanup.sql
backend/supabase/migrations/20260704_v29_claim_review_delivery_method_write_through.sql
```

## Required SQL Harness Setup

The V31 SQL harness needs two existing `public.profiles.id` UUIDs from the target database:

```text
reviewer_user_id   -> profile promoted to app_admin_users owner inside the transaction
contractor_user_id -> profile used for unauthorized-reviewer and contractor claim tests
```

The two UUIDs must be different.

Edit this section inside the harness before running:

```sql
insert into hvac_truth_v31_test_config (
  reviewer_user_id,
  contractor_user_id
) values (
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid
);
```

## Run Command

```bash
psql "$SUPABASE_DB_URL" -f backend/supabase/tests/v31_claim_review_negative_paths_and_read_verification.sql
```

Or paste the script into Supabase SQL editor after replacing the placeholder UUIDs.

## Safety Behavior

The harness begins with:

```sql
begin;
```

and ends with:

```sql
rollback;
```

This keeps the script repeatable and safe by default.

## Passing Signal

A passing run prints a notice similar to:

```text
V31 claim review negative-path and read-verification harness passed. claim_id=<uuid>, contractor_id=<uuid>
```

Any failed assertion raises an exception and stops the transaction.

## Local App Validation Still Required

The GitHub connector cannot run local Expo, TypeScript, or Supabase CLI validation. Run locally:

```bash
cd app
npm install
npm run typecheck
npm start
```

Then run the SQL harness against staging/local Supabase.

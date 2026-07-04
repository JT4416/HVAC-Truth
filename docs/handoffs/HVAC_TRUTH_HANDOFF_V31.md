# HVAC Truth Handoff — V31 Complete

Date: 2026-07-04
Repository: `JT4416/HVAC-Truth`
Current stage: **V31 — Claim Approval Harness Expansion and App Read Verification**

---

## 1. What V31 Completed

V31 expanded the V30 claim approval test harness with negative-path coverage and added app-side read verification helpers for contractor delivery methods.

Completed scope:

```text
- Read and removed the V30 handoff after intake.
- Added V31 SQL harness for negative-path and read verification.
- Added app read source metadata to contractorDeliveryMethods service.
- Added a typechecked delivery-method read preference fixture.
- Added V31 build documentation.
- Updated README to V31 current stage.
- Preserved verified contractor participation standard.
```

---

## 2. Files Added In V31

```text
backend/supabase/tests/v31_claim_review_negative_paths_and_read_verification.sql
app/src/services/contractorDeliveryMethods.fixture.ts
docs/build/V31_CLAIM_APPROVAL_HARNESS_EXPANSION_AND_APP_READ_VERIFICATION.md
docs/handoffs/HVAC_TRUTH_HANDOFF_V31.md
```

---

## 3. Files Updated In V31

```text
app/src/services/contractorDeliveryMethods.ts
README.md
```

---

## 4. Files Removed In V31

```text
docs/handoffs/HVAC_TRUTH_HANDOFF_V30.md
```

The V30 handoff was read first and then removed from the repository.

---

## 5. V31 SQL Harness

```text
backend/supabase/tests/v31_claim_review_negative_paths_and_read_verification.sql
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

## 6. Negative Paths Covered

The V31 harness confirms that `public.review_contractor_profile_claim(...)` fails as expected for:

```text
- unauthorized reviewer,
- invalid review decision,
- missing contractor claim.
```

Then it runs a positive approval path and verifies:

```text
- verified contractor status,
- contractor_dashboard_users active verified access,
- contractor_service_areas rows,
- contractor_delivery_methods rows,
- contractor_lead_preferences legacy compatibility rows,
- read-path presence of rows in contractor_delivery_methods.
```

---

## 7. App Read Verification Changes

Updated:

```text
app/src/services/contractorDeliveryMethods.ts
```

New exports:

```text
ContractorDeliveryMethodReadSource
ContractorDeliveryMethodReadResult
mapContractorDeliveryMethod(row)
buildContractorDeliveryMethodReadResult(rows, error, source)
```

`getContractorDeliveryMethods(contractorId)` still returns `data` and `error`, and now also returns:

```text
source: 'contractor_delivery_methods' | 'contractor_lead_preferences'
```

This makes it clear whether the app read came from the new durable table or the legacy fallback table.

---

## 8. Typechecked Fixture

Added:

```text
app/src/services/contractorDeliveryMethods.fixture.ts
```

The fixture validates:

```text
- preferred new-table read result source,
- legacy fallback source,
- legacy preferred_method normalization into delivery_method,
- delivery method summary formatting.
```

---

## 9. Required Setup Before Running SQL Harness

Apply migrations through V29 first.

Minimum required order for the currently relevant chain:

```text
backend/supabase/migrations/20260704_v24_verified_contractor_participation.sql
backend/supabase/migrations/20260704_v25_participation_admin_controls.sql
backend/supabase/migrations/20260704_v27_delivery_method_cleanup.sql
backend/supabase/migrations/20260704_v29_claim_review_delivery_method_write_through.sql
```

Then edit the V31 harness config section and replace placeholder UUIDs with two different existing `public.profiles.id` values in the target database.

---

## 10. Run Commands

SQL harness:

```bash
psql "$SUPABASE_DB_URL" -f backend/supabase/tests/v31_claim_review_negative_paths_and_read_verification.sql
```

App validation:

```bash
cd app
npm install
npm run typecheck
npm start
```

The GitHub connector could not execute local TypeScript, Expo, or Supabase CLI validation.

---

## 11. Core Product Rule Preserved

```text
Verified contractors are either in or out of the HVAC Truth verified network.
They may set operating limits.
They may configure delivery/contact routes.
They may not cherry-pick request categories.
Packet score remains informational only.
```

---

## 12. Recommended V32

Next build:

```text
V32 — Contractor Dashboard Delivery Method UI Source Visibility
```

Recommended V32 scope:

```text
- Surface delivery method source metadata in admin or validation copy for verified contractor delivery-method reads.
- Add UI-safe handling for empty new-table reads versus true fallback errors.
- Add clearer validation copy for staging claim approval tests.
- Run local npm run typecheck and Expo validation.
```

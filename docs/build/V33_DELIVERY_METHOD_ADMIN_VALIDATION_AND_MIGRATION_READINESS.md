# V33 — Delivery Method Admin Validation and Migration Readiness Checklist

Date: 2026-07-04
Repository: `JT4416/HVAC-Truth`

## Purpose

V33 adds an admin-facing migration readiness checklist for contractor delivery-method migration.

The goal is to make the V29-V32 delivery-method migration observable before the project retires legacy `contractor_lead_preferences` reads later.

## Files Updated

```text
app/src/services/contractorParticipationAdmin.ts
app/src/screens/AdminContractorParticipationDetailScreen.tsx
```

## New Service Helpers

`app/src/services/contractorParticipationAdmin.ts` now includes:

```text
DeliveryMethodMigrationReadinessStatus
ContractorDeliveryMethodMigrationReadiness
buildDeliveryMethodMigrationReadiness(contractor, currentDeliveryMethodCount, legacyDeliveryMethodCount)
formatDeliveryMethodMigrationReadinessStatus(status)
```

The readiness helper returns:

```text
- status,
- checklist,
- blockers,
- acceptance criteria,
- legacy retirement criteria.
```

## Admin UI Changes

`app/src/screens/AdminContractorParticipationDetailScreen.tsx` now includes a **Delivery method migration readiness** card.

The card shows:

```text
- readiness status,
- delivery-method read source,
- current contractor_delivery_methods row count,
- legacy contractor_lead_preferences compatibility row count,
- blockers,
- validation checklist,
- legacy retirement criteria.
```

## Readiness Statuses

```text
ready             -> current rows exist and no blockers are present
needs_validation  -> current rows exist, but legacy rows still need staged retirement review
blocked           -> current rows are missing or contractor state is not ready
```

## Acceptance Criteria Before Retiring Legacy Reads

```text
- Current delivery-method rows exist for every active verified contractor.
- App reads prefer contractor_delivery_methods.
- V31 SQL harness passes in staging or local Supabase.
- Local TypeScript and Expo validation pass.
- A rollback plan exists before removing legacy reads or columns.
```

## Validation Commands

Run locally:

```bash
cd app
npm install
npm run typecheck
npm start
```

Run the V31 SQL harness in staging/local Supabase after replacing profile UUID placeholders:

```bash
psql "$SUPABASE_DB_URL" -f backend/supabase/tests/v31_claim_review_negative_paths_and_read_verification.sql
```

## Notes

The GitHub connector cannot execute local TypeScript, Expo, or Supabase CLI validation. This build adds app code and docs only; database validation still needs to run locally or in Supabase staging.

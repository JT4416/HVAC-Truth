# V32 — Contractor Dashboard Delivery Method UI Source Visibility

Date: 2026-07-04
Repository: `JT4416/HVAC-Truth`

## Purpose

V32 surfaces delivery-method read source visibility in the contractor participation UI.

V31 made the app delivery-method service return whether contractor delivery rows came from the new durable `contractor_delivery_methods` table or the legacy `contractor_lead_preferences` fallback path. V32 makes that source visible in the contractor-facing participation settings screen and adds safer empty-state copy.

## Files Updated

```text
app/src/services/contractorDeliveryMethods.ts
app/src/screens/ContractorLeadPreferencesScreen.tsx
README.md
```

## Service Changes

`app/src/services/contractorDeliveryMethods.ts` now adds source-display helpers:

```text
CONTRACTOR_DELIVERY_METHOD_SOURCE_LABELS
formatContractorDeliveryMethodSource(source)
buildDeliveryMethodSourceSummary(source, count, hasErrorFallback)
buildDeliveryMethodEmptyState(source)
```

These helpers keep source wording consistent anywhere the app needs to explain whether delivery rows are coming from:

```text
- contractor_delivery_methods, the current durable delivery-method table,
- contractor_lead_preferences, the legacy compatibility table.
```

## UI Changes

`app/src/screens/ContractorLeadPreferencesScreen.tsx` now:

```text
- tracks deliveryMethodSource from getContractorDashboardDeliveryMethods(contractorId),
- displays a source badge above the delivery-method list,
- explains whether rows are coming from the current table or legacy compatibility path,
- shows a warning when legacy compatibility mode is active,
- uses source-aware empty-state copy so empty current-table reads are not confused with fallback failures.
```

## Why This Matters

This makes the V29-V31 migration path easier to validate from the app UI:

```text
- If the source is contractor_delivery_methods, the current V29 write-through path is being read.
- If the source is contractor_lead_preferences, the app is still operating in fallback compatibility mode.
- If the current table is available but empty, the user sees that claim approval should create delivery rows.
```

## Preserved Product Rule

```text
Verified contractors are either in or out of the HVAC Truth verified network.
They may set operating limits.
They may configure delivery/contact routes.
They may not cherry-pick request categories.
Packet score remains informational only.
```

## Validation

The GitHub connector cannot run local Expo, TypeScript, or Supabase CLI validation. Run locally:

```bash
cd app
npm install
npm run typecheck
npm start
```

Then run the V31 SQL harness in a staging/local database after replacing profile UUID placeholders:

```bash
psql "$SUPABASE_DB_URL" -f backend/supabase/tests/v31_claim_review_negative_paths_and_read_verification.sql
```

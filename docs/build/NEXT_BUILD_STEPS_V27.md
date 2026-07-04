# HVAC Truth — Next Build Steps V27

Current stage: **V27 — Delivery Method Cleanup**

## Completed In V27

- Added a contractor delivery method service.
- Added a forward migration for `contractor_delivery_methods`.
- Backfilled new delivery method rows from the legacy table.
- Updated contractor claim UI wording from lead preferences to delivery methods.
- Updated claim review detail wording from lead preferences to delivery methods.
- Updated contractor participation settings to call the new delivery method service.
- Preserved a compatibility alias for older code paths.
- Kept the verified contractor participation standard intact.

## Files Added

```text
app/src/services/contractorDeliveryMethods.ts
backend/supabase/migrations/20260704_v27_delivery_method_cleanup.sql
docs/features/DELIVERY_METHOD_CLEANUP.md
docs/build/NEXT_BUILD_STEPS_V27.md
```

## Files Updated

```text
app/src/services/contractorDashboard.ts
app/src/services/contractorClaimReview.ts
app/src/screens/ContractorProfileClaimScreen.tsx
app/src/screens/ContractorLeadPreferencesScreen.tsx
app/src/screens/AdminContractorClaimDetailScreen.tsx
README.md
```

## Important Compatibility Note

The app still has legacy identifiers such as:

```text
contractor_lead_preferences
contractors.lead_preferences
contractor_profile_claims.lead_preferences
LeadPreference
ContractorLeadPreferencesScreen
```

These remain for compatibility with existing migrations, data, and navigation. The new app-facing concept is **delivery methods**.

## Migration Order

Run after V25:

```text
backend/supabase/migrations/20260704_v27_delivery_method_cleanup.sql
```

Also confirm earlier required migrations are applied:

```text
backend/supabase/migrations/20260704_v24_verified_contractor_participation.sql
backend/supabase/migrations/20260704_v25_participation_admin_controls.sql
```

## Local Validation

Run locally:

```bash
cd app
npm install
npx tsc --noEmit
npx expo start
```

## Recommended V28

Next build:

```text
V28 — Local Validation and Supabase Migration Hardening
```

Recommended V28 scope:

- Run local TypeScript validation.
- Run Expo startup validation.
- Review Supabase migration compatibility.
- Replace any unsupported `create policy if not exists` syntax with `drop policy if exists` plus `create policy`.
- Decide whether claim review RPC should write directly to `contractor_delivery_methods` in addition to legacy compatibility fields.
- Decide when to fully retire legacy delivery-method table names.

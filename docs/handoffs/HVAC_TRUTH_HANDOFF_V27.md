# HVAC Truth Handoff — V27 Complete

Date: 2026-07-04
Repository: `JT4416/HVAC-Truth`
Current stage: **V27 — Delivery Method Cleanup**
Latest V27 implementation commit before this handoff: `aa115a2d10cfba443b8162215b3484479f979eff`

---

## 1. What V27 Completed

V27 separated contractor contact routing from participation rules.

Completed scope:

```text
- Added contractor delivery method service.
- Added forward migration for contractor_delivery_methods.
- Backfilled new delivery method rows from legacy delivery rows.
- Updated contractor claim UI wording to delivery methods.
- Updated claim review detail wording to delivery methods.
- Updated contractor participation settings to call the new delivery method service.
- Preserved compatibility aliases for older code paths.
- Preserved the verified contractor participation standard.
```

---

## 2. Core Product Rule Preserved

```text
Verified contractors are either in or out of the HVAC Truth verified network.
They may set operating limits.
They may configure contact routes.
Packet score remains informational only.
```

Allowed contractor/admin controls:

```text
- service area
- emergency availability
- temporary pause status
- pause reason
- daily capacity limit
- weekly capacity limit
- active / inactive / paused / suspended participation status
- delivery methods: dashboard, email, phone, SMS, website contact form
```

---

## 3. Files Added In V27

```text
app/src/services/contractorDeliveryMethods.ts
backend/supabase/migrations/20260704_v27_delivery_method_cleanup.sql
docs/features/DELIVERY_METHOD_CLEANUP.md
docs/build/NEXT_BUILD_STEPS_V27.md
docs/handoffs/HVAC_TRUTH_HANDOFF_V27.md
```

---

## 4. Files Updated In V27

```text
README.md
app/src/services/contractorDashboard.ts
app/src/services/contractorClaimReview.ts
app/src/services/contractorProfileClaiming.ts
app/src/screens/ContractorProfileClaimScreen.tsx
app/src/screens/ContractorLeadPreferencesScreen.tsx
app/src/screens/AdminContractorClaimDetailScreen.tsx
```

---

## 5. Important Implementation Notes

### 5.1 New delivery method service

File:

```text
app/src/services/contractorDeliveryMethods.ts
```

Main exports:

```text
getContractorDeliveryMethods(contractorId)
formatContractorDeliveryMethod(value)
buildDeliveryMethodSummary(methods)
```

The service tries the new `contractor_delivery_methods` table first and falls back to the legacy `contractor_lead_preferences` table if the new table is not available yet.

### 5.2 Dashboard compatibility

File:

```text
app/src/services/contractorDashboard.ts
```

New app-facing function:

```text
getContractorDashboardDeliveryMethods(contractorId)
```

Legacy alias kept:

```text
getContractorLeadPreferences(contractorId)
```

### 5.3 Contractor profile claim screen

File:

```text
app/src/screens/ContractorProfileClaimScreen.tsx
```

Visible UI now says **Delivery methods**.

The underlying payload still writes to `lead_preferences` for compatibility with existing Supabase columns and RPC logic.

### 5.4 Claim review detail screen

File:

```text
app/src/screens/AdminContractorClaimDetailScreen.tsx
```

Visible UI now says **Delivery methods** and no longer describes the contact routes as preferences.

### 5.5 New migration

File:

```text
backend/supabase/migrations/20260704_v27_delivery_method_cleanup.sql
```

Migration behavior:

```text
- Creates public.contractor_delivery_methods.
- Adds RLS policies for admins and verified contractor users.
- Backfills from public.contractor_lead_preferences.
- Adds indexes.
- Adds comments documenting legacy compatibility fields.
```

---

## 6. Legacy Names Still Present By Design

These names still exist:

```text
contractor_lead_preferences
contractors.lead_preferences
contractor_profile_claims.lead_preferences
LeadPreference
ContractorLeadPreferencesScreen
```

Reason:

```text
They are connected to earlier migrations, data, or navigation. V27 introduces the cleaner delivery-method concept without breaking existing records or app routes.
```

---

## 7. Local Validation Still Needed

The repository was updated through the GitHub connector. Local compile/runtime validation was not executed in this environment.

Run locally:

```bash
cd app
npm install
npx tsc --noEmit
npx expo start
```

Apply migrations in order as needed:

```text
backend/supabase/migrations/20260704_v24_verified_contractor_participation.sql
backend/supabase/migrations/20260704_v25_participation_admin_controls.sql
backend/supabase/migrations/20260704_v27_delivery_method_cleanup.sql
```

---

## 8. Recommended V28

Next build:

```text
V28 — Local Validation and Supabase Migration Hardening
```

Recommended V28 scope:

```text
- Run TypeScript validation locally.
- Run Expo startup locally.
- Review Supabase migration compatibility.
- Replace unsupported create-policy syntax with explicit drop/create policy blocks if needed.
- Decide whether the V13 claim review RPC should write directly to contractor_delivery_methods in addition to compatibility fields.
- Decide when to fully retire legacy delivery-method table names.
```

---

## 9. Recovery Prompt For Next Chat

```text
We are building the HVAC Truth app in GitHub repo JT4416/HVAC-Truth. Read docs/handoffs/HVAC_TRUTH_HANDOFF_V27.md first. Current stage is V27 complete: Delivery Method Cleanup. Continue with V28 — Local Validation and Supabase Migration Hardening. Preserve the verified contractor participation standard. Start by inspecting backend/supabase/migrations/20260704_v25_participation_admin_controls.sql, backend/supabase/migrations/20260704_v27_delivery_method_cleanup.sql, app/src/services/contractorDeliveryMethods.ts, app/src/services/contractorDashboard.ts, app/src/services/contractorClaimReview.ts, and README.md.
```

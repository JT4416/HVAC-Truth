# HVAC Truth Handoff — V32 Complete

Date: 2026-07-04
Repository: `JT4416/HVAC-Truth`
Current stage: **V32 — Contractor Dashboard Delivery Method UI Source Visibility**

---

## 1. What V32 Completed

V32 surfaced contractor delivery-method read source visibility in the contractor-facing participation settings screen.

Completed scope:

```text
- Read and removed the V31 handoff after intake.
- Added delivery-method source display helpers.
- Updated contractor participation settings screen to show delivery-method source.
- Added source-aware empty-state copy.
- Added legacy compatibility mode warning copy.
- Added V32 build documentation.
- Preserved verified contractor participation standard.
```

---

## 2. Files Added In V32

```text
docs/build/V32_CONTRACTOR_DASHBOARD_DELIVERY_METHOD_SOURCE_VISIBILITY.md
docs/handoffs/HVAC_TRUTH_HANDOFF_V32.md
```

---

## 3. Files Updated In V32

```text
app/src/services/contractorDeliveryMethods.ts
app/src/screens/ContractorLeadPreferencesScreen.tsx
```

README update was attempted but blocked by the connector safety filter. Current V32 details are documented in the V32 build doc and this handoff.

---

## 4. Files Removed In V32

```text
docs/handoffs/HVAC_TRUTH_HANDOFF_V31.md
```

The V31 handoff was read first and then removed from the repository.

---

## 5. Service Changes

Updated:

```text
app/src/services/contractorDeliveryMethods.ts
```

Added:

```text
CONTRACTOR_DELIVERY_METHOD_SOURCE_LABELS
formatContractorDeliveryMethodSource(source)
buildDeliveryMethodSourceSummary(source, count, hasErrorFallback)
buildDeliveryMethodEmptyState(source)
```

These helpers explain whether delivery methods are read from:

```text
contractor_delivery_methods
contractor_lead_preferences
```

---

## 6. UI Changes

Updated:

```text
app/src/screens/ContractorLeadPreferencesScreen.tsx
```

The screen now:

```text
- stores deliveryMethodSource from getContractorDashboardDeliveryMethods(contractorId),
- shows a source badge above current delivery methods,
- explains whether rows came from the current table or the legacy compatibility table,
- shows a warning when legacy compatibility mode is active,
- uses source-aware empty-state copy.
```

---

## 7. Validation Commands

Run locally:

```bash
cd app
npm install
npm run typecheck
npm start
```

Run the V31 SQL harness in a staging/local database after replacing profile UUID placeholders:

```text
backend/supabase/tests/v31_claim_review_negative_paths_and_read_verification.sql
```

The GitHub connector could not execute local TypeScript, Expo, or Supabase CLI validation.

---

## 8. Core Product Rule Preserved

```text
Verified contractors are either in or out of the HVAC Truth verified network.
They may set operating limits.
They may configure delivery/contact routes.
They may not cherry-pick request categories.
Packet score remains informational only.
```

---

## 9. Recommended V33

Next build:

```text
V33 — Delivery Method Admin Validation and Migration Readiness Checklist
```

Recommended V33 scope:

```text
- Add an admin-facing validation checklist for contractor delivery-method migration readiness.
- Add documented acceptance criteria for retiring legacy contractor_lead_preferences reads later.
- Add a staging QA runbook for V29-V32 delivery-method migration verification.
- Retry README current-stage update using a smaller targeted patch if connector write behavior allows it.
- Run local npm run typecheck and Expo validation.
```

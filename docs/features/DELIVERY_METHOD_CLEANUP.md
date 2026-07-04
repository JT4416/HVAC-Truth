# Delivery Method Cleanup

Version: V27

## Purpose

V27 separates contractor contact routes from participation rules.

Contractors can define how HVAC Truth should contact them. That is different from deciding which kinds of homeowner requests they receive.

## Delivery Methods

Delivery methods are contact routes only:

```text
- HVAC Truth dashboard
- email
- phone
- SMS
- website contact form
```

## New App Service

```text
app/src/services/contractorDeliveryMethods.ts
```

This service exposes:

```text
getContractorDeliveryMethods(contractorId)
formatContractorDeliveryMethod(value)
buildDeliveryMethodSummary(methods)
```

The service prefers the new `contractor_delivery_methods` table when available and falls back to the legacy `contractor_lead_preferences` table for compatibility.

## New Migration

```text
backend/supabase/migrations/20260704_v27_delivery_method_cleanup.sql
```

The migration:

```text
- creates public.contractor_delivery_methods,
- adds admin and verified-contractor read policies,
- backfills existing rows from public.contractor_lead_preferences,
- adds indexes,
- documents legacy tables and columns as compatibility fields.
```

## Screens Updated

```text
app/src/screens/ContractorProfileClaimScreen.tsx
app/src/screens/ContractorLeadPreferencesScreen.tsx
app/src/screens/AdminContractorClaimDetailScreen.tsx
```

Visible UI now says **delivery methods** where the meaning is contact routing.

## Services Updated

```text
app/src/services/contractorDashboard.ts
app/src/services/contractorClaimReview.ts
```

The dashboard service now exposes:

```text
getContractorDashboardDeliveryMethods(contractorId)
```

The older `getContractorLeadPreferences(contractorId)` function remains as a compatibility alias.

## Legacy Names Kept For Compatibility

Some names remain intentionally:

```text
contractor_lead_preferences
contractor_profile_claims.lead_preferences
contractors.lead_preferences
LeadPreference
ContractorLeadPreferencesScreen
```

Reason:

```text
These names are already wired into migrations, data, or navigation. V27 adds the new concept without breaking existing records or app routes.
```

## Future Cleanup

A future build can fully migrate away from the legacy names after local database validation.

Recommended future steps:

```text
- update claim submission payloads to write both legacy and new fields,
- update the V13 claim review RPC to insert into contractor_delivery_methods directly,
- eventually deprecate contractor_lead_preferences after a stable migration period,
- rename ContractorLeadPreferencesScreen once navigation compatibility is no longer a concern.
```

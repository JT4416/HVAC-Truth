# V15 — Persisted Contractor Discovery

V15 connects live contractor discovery results to persisted contractor records.

## Purpose

V14 dashboard routing needs real contractor IDs.

Before V15, the app could search provider results and display contractor candidates, but some provider results did not have a persisted `contractors.id`. Without that ID, direct dashboard routing cannot safely work.

V15 changes the discovery layer so provider results are matched to existing contractors or inserted into the `contractors` table before being returned to the mobile app.

## Core Rule

A provider result should become a reusable contractor record before it participates in dashboard routing.

## What V15 Adds

V15 updates the `contractor-discovery` Edge Function to:

- Search internal contractor records.
- Search Google Places when configured.
- Search Yelp when configured.
- Deduplicate results.
- Match provider results to existing contractor records.
- Insert new contractor records when no match exists.
- Preserve HVAC Truth verification flags from existing contractor records.
- Return `contractorId`, `persisted`, and `matchMethod` to the mobile app.

## Match Strategy

V15 attempts to match contractor records by:

1. Google Place ID
2. Yelp Business ID
3. Phone number
4. Normalized business key

If no match is found, a new contractor record is created.

## Preserved Verification State

When a provider result matches an existing contractor, V15 preserves:

```text
hvac_truth_verified
accepts_dashboard_leads
accepts_email_leads
accepts_sms_leads
```

That protects the V13 verification workflow and prevents provider refreshes from wiping out dashboard access.

## Mobile App Behavior

The mobile discovery service now carries:

```text
contractorId
persisted
matchMethod
sourceIds
hvacTruthVerified
acceptsDashboardLeads
```

The contractor finder screen now shows whether a result is tied to a persisted contractor record.

## Files Added

```text
backend/supabase/migrations/20260703_v15_persisted_contractor_discovery.sql
docs/features/PERSISTED_CONTRACTOR_DISCOVERY.md
docs/build/NEXT_BUILD_STEPS_V15.md
```

## Files Updated

```text
backend/supabase/functions/contractor-discovery/index.ts
app/src/services/contractorDiscovery.ts
app/src/screens/ContractorFinderScreen.tsx
README.md
```

## Database Additions

V15 adds to `contractors`:

```text
normalized_business_key
discovery_sources
source_ids
```

V15 also adds indexes for provider IDs and source metadata.

## Relationship to V14

V14 decides whether a selected contractor can receive direct dashboard delivery.

V15 makes sure live discovery results can return real contractor IDs, which V14 requires.

## MVP Limitation

The mobile lead request screen still uses its demo contractor list. The next step is connecting selected contractor search results into the lead request flow so the homeowner can send a lead to the actual discovered contractor records.

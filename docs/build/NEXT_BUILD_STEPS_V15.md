# Next Build Steps After V15

V15 added persisted contractor discovery.

## Completed in V15

- Updated the contractor discovery Edge Function.
- Matched provider results to existing contractor records.
- Created contractor records when no match exists.
- Preserved HVAC Truth verification and dashboard lead flags.
- Returned contractor IDs to the mobile app.
- Returned persistence metadata to the mobile app.
- Updated the contractor finder screen to show persisted records.
- Added database fields and indexes for persisted discovery.
- Documented the V15 feature.

## Required Supabase Step

Run this migration in Supabase before deploying the updated Edge Function:

```text
backend/supabase/migrations/20260703_v15_persisted_contractor_discovery.sql
```

## Required Edge Function Step

Deploy the updated contractor discovery function:

```bash
supabase functions deploy contractor-discovery
```

## Product Rule

Live provider search results should be matched to or inserted into contractor records before they are returned to the mobile app.

This gives V14 direct dashboard routing a real contractor ID to work with.

## Recommended V16

V16 should connect contractor finder selections into the lead request flow.

Right now, the contractor finder can return persisted contractor records, but the lead request screen still starts from its MVP demo contractor list.

Recommended V16 goals:

- Let the homeowner select a contractor from search results.
- Carry the selected contractor into `ContractorLeadRequestScreen`.
- Preselect that contractor in the lead request flow.
- Preserve `contractorId`, verification status, dashboard flags, contact route, and provider source IDs.
- Submit the lead to the selected real contractor record.
- Keep public-contact fallback for contractors that are not HVAC Truth verified.

## Recommended V16 Files

```text
app/src/screens/ContractorFinderScreen.tsx
app/src/screens/ContractorLeadRequestScreen.tsx
app/src/services/contractorLeadFlow.ts
app/src/services/contractorDiscovery.ts
docs/features/SEARCH_RESULT_TO_LEAD_REQUEST.md
docs/build/NEXT_BUILD_STEPS_V16.md
```

## Later Build

After V16, build the deeper homeowner troubleshooting workflow engine.

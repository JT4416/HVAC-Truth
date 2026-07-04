# Next Build Steps After V14

V14 added verified dashboard lead routing.

## Completed in V14

- Added the verified lead routing service.
- Updated homeowner lead submission.
- Kept unverified contractors on public-contact routing.
- Added a routing preview to the homeowner lead request screen.
- Added dashboard delivery tracking fields.
- Added a routing event table.
- Documented the V14 feature.

## Required Supabase Step

Run this migration in Supabase:

```text
backend/supabase/migrations/20260703_v14_verified_dashboard_lead_routing.sql
```

## Product Rule

Direct dashboard delivery requires HVAC Truth verification, dashboard lead acceptance, and a real contractor profile ID.

If any part is missing, use public-contact routing.

## Recommended V15

V15 should connect live contractor discovery to persisted contractor records.

Recommended V15 goals:

- Reuse existing contractor records when possible.
- Prevent duplicate contractor records.
- Preserve provider source IDs.
- Return contractor IDs to the mobile app.
- Return HVAC Truth verification and dashboard lead flags to the mobile app.
- Keep trust, service fit, and review quality as separate ranking signals.

## Recommended V15 Files

```text
app/src/services/contractorDiscovery.ts
backend/supabase/functions/contractor-discovery/index.ts
backend/supabase/migrations/20260703_v15_persisted_contractor_discovery.sql
docs/features/PERSISTED_CONTRACTOR_DISCOVERY.md
docs/build/NEXT_BUILD_STEPS_V15.md
```

## Later Build

After persisted discovery is working, build the deeper homeowner troubleshooting workflow engine.

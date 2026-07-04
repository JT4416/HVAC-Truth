# Next Build Steps After V18

V18 added troubleshooting session persistence and contractor handoff attachment.

## Completed in V18

- Added `troubleshootingSessions` persistence service.
- Saved completed troubleshooting workflow results to Supabase.
- Displayed recent saved sessions on the troubleshooting screen.
- Attached the latest saved troubleshooting session to the contractor-ready report.
- Attached the latest saved troubleshooting snapshot to contractor lead request report snapshots.
- Displayed attached troubleshooting context in contractor dashboard lead packets.
- Documented the V18 feature.

## Required Supabase Step

V18 uses the V17 table. Run this if it has not already been run:

```text
backend/supabase/migrations/20260703_v17_troubleshooting_workflow_engine.sql
```

## Product Rule

Saved troubleshooting sessions can help contractors understand what the homeowner already checked, but the app must still keep all homeowner instructions within safe limits.

## Recommended V19

V19 should add homeowner control over attached troubleshooting sessions.

Recommended V19 goals:

- Let homeowners choose which troubleshooting session to attach to a lead.
- Let homeowners hide a troubleshooting session from contractor handoffs.
- Add a troubleshooting history detail screen.
- Add delete/archive behavior for old sessions.
- Add a lead packet preview showing exactly what the contractor will receive.
- Add better matching between service type and the recommended troubleshooting workflow.

## Recommended V19 Files

```text
app/src/screens/TroubleshootingSessionDetailScreen.tsx
app/src/screens/ContractorLeadRequestScreen.tsx
app/src/services/troubleshootingSessions.ts
backend/supabase/migrations/20260703_v19_troubleshooting_session_controls.sql
docs/features/TROUBLESHOOTING_SESSION_CONTROLS.md
docs/build/NEXT_BUILD_STEPS_V19.md
```

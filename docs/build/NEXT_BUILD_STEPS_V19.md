# Next Build Steps After V19

V19 added homeowner controls for saved troubleshooting sessions.

## Completed in V19

- Added control fields for troubleshooting sessions.
- Added a troubleshooting session detail screen.
- Added navigation from troubleshooting history into session details.
- Added homeowner labels.
- Added report attachment controls.
- Added lead attachment controls.
- Added archive behavior.
- Added lead packet preview for attached troubleshooting context.
- Added troubleshooting session selection in the contractor lead request flow.
- Added service-type-to-workflow recommendations.
- Documented the V19 feature.

## Required Supabase Step

Run this migration after the V17 troubleshooting session table migration:

```text
backend/supabase/migrations/20260703_v19_troubleshooting_session_controls.sql
```

## Product Rule

Homeowners control whether saved troubleshooting sessions are visible to contractors.

Archived sessions are removed from active report and lead attachment flows, but the app should preserve them for history/audit unless a future hard-delete feature is intentionally added.

## Recommended V20

V20 should improve the troubleshooting-to-lead conversion path.

Recommended V20 goals:

- Allow a completed troubleshooting workflow to start a contractor lead request directly.
- Pre-fill lead request service type from the troubleshooting workflow.
- Pre-fill symptom summary from the workflow result.
- Preselect the saved troubleshooting session in the lead request.
- Add a clear “I tried this, now request help” button after call-a-pro results.
- Add workflow-specific contractor packet formatting for the most important workflows.

## Recommended V20 Files

```text
app/src/screens/TroubleshootingScreen.tsx
app/src/screens/TroubleshootingSessionDetailScreen.tsx
app/src/screens/ContractorLeadRequestScreen.tsx
app/src/services/troubleshootingSessions.ts
app/src/services/contractorLeadFlow.ts
docs/features/TROUBLESHOOTING_TO_LEAD_CONVERSION.md
docs/build/NEXT_BUILD_STEPS_V20.md
```

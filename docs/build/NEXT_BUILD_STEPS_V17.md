# Next Build Steps After V17

V17 added the homeowner-safe troubleshooting workflow engine.

## Completed in V17

- Created a workflow engine for structured homeowner troubleshooting.
- Added the priority workflow for indoor and outdoor units both off.
- Included float switch, condensate drain, horizontal installation, emergency pan, pan switch, and shop-vac steps.
- Added multiple deeper homeowner-safe workflows.
- Replaced the simple troubleshooting screen with a workflow selector and guided output.
- Added safe steps, do-not-do warnings, call-a-pro gates, technician scripts, and contractor report notes.
- Added a future-ready Supabase table for troubleshooting sessions.
- Documented the V17 feature.

## Workflows Included

```text
Indoor and Outdoor Units Both Off
No Cooling / Warm Air
Water Leak / Drain or Pan Issue
Frozen Coil / Ice Visible
Weak Airflow
Odor / Smell Safety Check
Noise / Vibration
Quote / Repair Recommendation Check
```

## Required Supabase Step

Run this migration:

```text
backend/supabase/migrations/20260703_v17_troubleshooting_workflow_engine.sql
```

## Product Rule

Homeowner workflows can include observation, cleaning accessible drain/pan areas, filter replacement, thermostat checks, vent checks, outdoor clearance checks, and documentation.

Homeowner workflows must not include electrical testing, refrigerant work, bypassing safeties, gas/combustion work, or equipment disassembly.

## Recommended V18

V18 should persist troubleshooting sessions and attach them to contractor reports and lead packets.

Recommended V18 goals:

- Save completed troubleshooting sessions to Supabase.
- Show recent troubleshooting sessions on the troubleshooting screen.
- Add latest troubleshooting result to the contractor-ready report.
- Attach troubleshooting output to `contractor_lead_requests.report_snapshot`.
- Show troubleshooting notes on the contractor dashboard lead packet.
- Allow homeowners to choose whether to attach or hide troubleshooting results.

## Recommended V18 Files

```text
app/src/services/troubleshootingSessions.ts
app/src/screens/TroubleshootingScreen.tsx
app/src/screens/ContractorReportScreen.tsx
app/src/screens/ContractorLeadRequestScreen.tsx
app/src/screens/ContractorLeadDetailScreen.tsx
docs/features/TROUBLESHOOTING_SESSION_PERSISTENCE.md
docs/build/NEXT_BUILD_STEPS_V18.md
```

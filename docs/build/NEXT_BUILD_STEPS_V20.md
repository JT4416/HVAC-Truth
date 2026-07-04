# Next Build Steps — V20 Complete

Current stage after this build: **V20 — Troubleshooting to Lead Conversion**.

## What V20 Added

- Added a direct **I Tried This, Now Request Help** action after completed troubleshooting results.
- Saves the troubleshooting session during conversion if needed.
- Opens `ContractorLeadRequest` with the saved troubleshooting session preselected.
- Prefills lead request fields from the selected troubleshooting session:
  - service type,
  - urgency,
  - symptom summary,
  - desired outcome.
- Adds the same direct lead request action to saved troubleshooting session detail.
- Lets homeowners apply any selected troubleshooting session as lead defaults from the lead request screen.
- Documents the conversion behavior and mapping rules.

## Files Updated

```text
app/App.tsx
app/src/screens/TroubleshootingScreen.tsx
app/src/screens/TroubleshootingSessionDetailScreen.tsx
app/src/screens/ContractorLeadRequestScreen.tsx
app/src/services/troubleshootingSessions.ts
docs/features/TROUBLESHOOTING_TO_LEAD_CONVERSION.md
docs/build/NEXT_BUILD_STEPS_V20.md
README.md
```

## Setup Notes

No new Supabase migration is required for V20.

Required earlier migrations remain:

```text
backend/supabase/migrations/20260703_v17_troubleshooting_workflow_engine.sql
backend/supabase/migrations/20260703_v19_troubleshooting_session_controls.sql
```

## Recommended V21 — Contractor Packet Intelligence

Goal: make each contractor lead packet smarter and more contractor-specific without expanding homeowner DIY instructions.

Recommended V21 scope:

- Add workflow-specific contractor packet sections for the highest-value workflows:
  - both indoor and outdoor units off,
  - water / drain / pan issue,
  - frozen coil,
  - no cooling / warm air,
  - quote second opinion.
- Add a contractor-facing severity explanation:
  - what the homeowner observed,
  - what the app told them not to do,
  - what needs professional verification.
- Add photo prompts for each workflow before lead submission:
  - thermostat screen,
  - filter compartment exterior only,
  - drain termination outside,
  - outdoor unit clearance,
  - visible emergency pan water,
  - quote photo / PDF for quote checks.
- Add homeowner-safe checklist status to the lead packet:
  - attempted,
  - skipped,
  - not applicable,
  - stopped because safety boundary was reached.
- Preserve all no-electrical, no-refrigerant, no-disassembly, no-bypass safety limits.

## Recommended V21 Files

```text
app/src/services/troubleshootingSessions.ts
app/src/services/contractorLeadFlow.ts
app/src/screens/ContractorLeadRequestScreen.tsx
app/src/screens/ContractorLeadDetailScreen.tsx
docs/features/CONTRACTOR_PACKET_INTELLIGENCE.md
docs/build/NEXT_BUILD_STEPS_V21.md
```

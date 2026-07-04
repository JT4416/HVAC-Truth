# V18 — Troubleshooting Session Persistence

V18 saves completed troubleshooting workflow results and carries them into contractor-facing handoffs.

## Purpose

V17 created a homeowner-safe troubleshooting workflow engine.

V18 makes those workflow results persistent and useful by saving sessions to Supabase and attaching the latest saved session to contractor reports and lead packets.

## What V18 Adds

V18 adds:

- A troubleshooting session persistence service.
- Save button on the troubleshooting result screen.
- Recent saved troubleshooting sessions on the troubleshooting screen.
- Latest saved troubleshooting result on the contractor-ready report.
- Latest saved troubleshooting snapshot inside the lead request report snapshot.
- Contractor dashboard visibility for attached troubleshooting context.

## New Service

```text
app/src/services/troubleshootingSessions.ts
```

The service provides:

```text
saveTroubleshootingSession
getRecentTroubleshootingSessions
getLatestTroubleshootingSessionForReport
getLatestTroubleshootingSessionForLead
buildTroubleshootingReportText
buildTroubleshootingSnapshot
```

## Updated Screens

```text
app/src/screens/TroubleshootingScreen.tsx
app/src/screens/ContractorReportScreen.tsx
app/src/screens/ContractorLeadRequestScreen.tsx
app/src/screens/ContractorLeadDetailScreen.tsx
```

## User Flow

1. Homeowner completes a troubleshooting workflow.
2. App shows safe steps, warnings, call-a-pro triggers, technician script, and contractor notes.
3. Homeowner taps save.
4. App stores the workflow result in `troubleshooting_sessions`.
5. Contractor report pulls the latest saved troubleshooting session.
6. Lead request can attach the latest troubleshooting snapshot.
7. Contractor dashboard lead packet displays the attached troubleshooting context.

## Report and Lead Attachment

Saved troubleshooting sessions can be attached to:

```text
contractor-ready report
contractor lead request report_snapshot
contractor dashboard lead packet
```

Attached troubleshooting includes:

```text
workflow id
workflow title
symptom
severity
summary
safe steps
do-not-do warnings
call-a-pro triggers
homeowner script
contractor report notes
created time
```

## Safety Rule

Persisting troubleshooting sessions does not change the homeowner safety boundary.

The app still must not tell homeowners to perform electrical testing, refrigerant work, safety bypassing, gas/combustion work, or equipment disassembly.

## Required Database Step

V18 uses the V17 table:

```text
troubleshooting_sessions
```

Run this migration if it has not already been run:

```text
backend/supabase/migrations/20260703_v17_troubleshooting_workflow_engine.sql
```

## MVP Limitation

V18 attaches only the latest eligible troubleshooting session. Later versions should allow homeowners to pick which saved session to attach, hide, or archive.

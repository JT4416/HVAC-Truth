# V19 — Troubleshooting Session Controls

V19 gives homeowners direct control over saved troubleshooting sessions and what contractors receive.

## Purpose

V18 saved completed troubleshooting sessions and attached the latest eligible result to reports and lead packets.

V19 improves that by letting homeowners manage, hide, archive, label, preview, and choose saved sessions before they are sent to a contractor.

## What V19 Adds

V19 adds:

- A session detail/control screen.
- Navigation from troubleshooting history into a saved session.
- Homeowner labels for saved sessions.
- Attach/hide controls for contractor reports.
- Attach/hide controls for lead requests.
- Archive behavior for old sessions.
- Lead packet preview for exactly what troubleshooting context a contractor will see.
- Lead request selection of which saved troubleshooting session to attach.
- Service-type-to-workflow recommendation helper.

## New Screen

```text
app/src/screens/TroubleshootingSessionDetailScreen.tsx
```

The detail screen shows:

- Workflow title.
- Severity.
- Summary.
- Created time.
- Optional homeowner label.
- Attach-to-report toggle.
- Attach-to-lead toggle.
- Lead packet preview.
- Safe steps recorded.
- Do-not-do warnings.
- Contractor notes.
- Archive action.

## Updated Service

```text
app/src/services/troubleshootingSessions.ts
```

New or expanded helpers:

```text
getTroubleshootingSession
updateTroubleshootingSessionControls
archiveTroubleshootingSession
markTroubleshootingSessionUsed
getRecommendedWorkflowIdForServiceType
buildLeadPacketPreview
```

## Database Migration

```text
backend/supabase/migrations/20260703_v19_troubleshooting_session_controls.sql
```

Adds:

```text
archived_at
homeowner_label
last_used_in_lead_at
last_used_in_report_at
```

Archived sessions are hidden from active report and lead attachment flows.

## Updated Screens

```text
app/App.tsx
app/src/screens/TroubleshootingScreen.tsx
app/src/screens/ContractorLeadRequestScreen.tsx
```

## Homeowner Flow

1. Homeowner completes and saves a troubleshooting workflow.
2. The saved session appears in troubleshooting history.
3. Homeowner opens the session detail screen.
4. Homeowner can label the session, attach or hide it from reports/leads, or archive it.
5. During lead request, homeowner can pick which saved troubleshooting session to attach.
6. The app previews exactly what the contractor will receive.

## Service-Type Recommendation

The lead request flow now recommends a troubleshooting workflow based on the selected service type.

Examples:

```text
no cooling -> no-cooling-warm-air
water/drain issue -> water-leak-drain-pan
frozen coil -> frozen-coil-airflow
poor airflow -> weak-airflow
odor -> odor-safety
noise -> noise-vibration
quote review -> quote-validation-safe
system not running -> both-indoor-outdoor-off-drain-float
```

## Safety Rule

V19 only controls attachment and visibility. It does not relax safety boundaries.

The app must still avoid homeowner electrical testing, refrigerant work, bypassing safeties, gas/combustion work, and equipment disassembly.

## MVP Limitation

The recommendation helper maps known service type values. If future service type values are added, they should be added to `getRecommendedWorkflowIdForServiceType`.

# V20 — Troubleshooting to Lead Conversion

## Goal

Let a homeowner move directly from a completed safe troubleshooting workflow into a contractor lead request without losing the troubleshooting context.

## Homeowner Flow

1. Homeowner completes a troubleshooting workflow.
2. HVAC Truth shows the safe results, do-not-do warnings, call-a-pro triggers, homeowner script, and contractor notes.
3. Homeowner taps **I Tried This, Now Request Help**.
4. The app saves the troubleshooting session if it has not already been saved in that conversion path.
5. The app opens `ContractorLeadRequest` with:
   - the saved troubleshooting session preselected,
   - troubleshooting attachment enabled,
   - service type inferred from the workflow,
   - urgency inferred from the troubleshooting severity,
   - symptom summary prefilled from workflow title and result summary,
   - desired outcome prefilled from the call-a-pro triggers.

## Saved Session Flow

A homeowner can also open a saved troubleshooting session from history and tap **I Tried This, Now Request Help**. The app marks the session eligible for lead attachment, preserves the homeowner label, and opens the lead request flow with the session selected.

## Lead Request Behavior

`ContractorLeadRequestScreen` now accepts:

```ts
{
  selectedContractor?: any;
  troubleshootingSessionId?: string;
  leadDefaults?: any;
}
```

When troubleshooting params are present, the screen:

- fetches the routed session if it is not already in recent history,
- preselects it in the troubleshooting attachment picker,
- enables troubleshooting attachment,
- applies service type, urgency, issue summary, and desired outcome defaults,
- shows a **Started from troubleshooting** source card,
- still allows the homeowner to edit every lead request field before submission.

## Mapping Rules

Workflow-to-service-type mapping lives in `app/src/services/troubleshootingSessions.ts`:

| Workflow | Service type |
| --- | --- |
| `both-indoor-outdoor-off-drain-float` | `not_turning_on` |
| `water-leak-drain-pan` | `water_leak` |
| `noise-vibration` | `noise` |
| `quote-validation-safe` | `quote_second_opinion` |
| `frozen-coil-airflow` | `no_cooling` |
| `weak-airflow` | `no_cooling` |
| `no-cooling-warm-air` | `no_cooling` |
| Other | `other` |

Severity-to-urgency mapping:

| Troubleshooting severity | Lead urgency |
| --- | --- |
| `urgent-stop` | `emergency_today` |
| `call-pro` | `within_24_hours` |
| `caution` | `this_week` |
| `safe-check` | `within_24_hours` |

## Safety Boundary

V20 does not expand homeowner DIY instructions. The conversion flow only packages the already-safe troubleshooting result into a contractor-facing lead packet.

The app still must not guide homeowners through:

- electrical testing,
- refrigerant work,
- opening electrical compartments,
- bypassing float switches, pan switches, fuses, breakers, door switches, or safeties,
- gas or combustion work,
- equipment disassembly,
- code-sensitive repair instructions.

## Updated Files

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

## No New Migration

V20 uses the existing V17/V19 troubleshooting session schema. No new Supabase migration is required.

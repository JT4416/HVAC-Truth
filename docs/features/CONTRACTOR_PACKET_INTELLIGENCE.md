# V21 — Contractor Packet Intelligence

## Goal

Make every troubleshooting-attached contractor lead packet more useful for contractors without giving homeowners unsafe repair guidance.

V21 keeps troubleshooting homeowner-safe while adding contractor-facing context that helps a technician understand:

- what workflow the homeowner completed,
- what HVAC Truth told the homeowner not to do,
- what professional verification points matter most,
- what safe photos would help before dispatch,
- what safe checklist steps were recorded or stopped for safety.

## What V21 Adds

### Contractor Packet Intelligence Object

`buildContractorPacketIntelligence(session)` creates a contractor-facing object from a saved troubleshooting session:

```ts
{
  workflowId,
  workflowTitle,
  severity,
  severityExplanation,
  professionalVerificationFocus,
  homeownerSafetyBoundary,
  suggestedPhotoPrompts,
  safeChecklist
}
```

This object is embedded into the troubleshooting snapshot under:

```ts
reportSnapshot.troubleshooting.contractorPacket
```

### Workflow-Specific Verification Focus

V21 adds professional verification focus lists for the most valuable workflows:

- both indoor and outdoor units off,
- water / drain / pan issue,
- frozen coil,
- no cooling / warm air,
- quote second opinion,
- noise / vibration.

Examples:

- Both units off: thermostat call, float/pan switch status, condensate condition, safe restoration without bypassing safeties.
- Water/drain/pan: drain restriction, trap/slope, emergency pan, float/pan switch operation, water damage risk.
- Frozen coil: airflow restrictions, blower operation, licensed refrigerant-side diagnostics, restart timing after thaw.

### Severity Explanation

V21 translates troubleshooting severity into contractor-facing language:

- `urgent-stop`: homeowner was told to stop and request professional help.
- `call-pro`: homeowner-safe checks were not enough; professional diagnosis is next.
- `caution`: only limited homeowner-safe checks were allowed.
- `safe-check`: only homeowner-safe checks were provided.

### Suggested Safe Photos

V21 suggests photos that help contractors without crossing safety boundaries, such as:

- thermostat screen,
- outdoor unit clearance,
- visible water,
- emergency pan if visible,
- drain termination if safely accessible,
- quote document,
- visible ice from outside the cabinet only.

Each prompt includes a safety note such as:

- do not remove panels,
- do not open wiring,
- do not bypass switches,
- do not modify drain piping,
- avoid standing water near electrical equipment.

### Safe Checklist Status

V21 includes a contractor-facing checklist status from saved safe steps:

- `recorded`: the safe step exists in the workflow result.
- `stopped_for_safety`: the workflow reached a call-a-pro/safety stop trigger.
- `not_recorded`: reserved for future use when individual step completion tracking is added.

## Where It Appears

V21 packet intelligence is included in:

- troubleshooting lead packet preview,
- contractor-ready troubleshooting report text,
- `reportSnapshot.troubleshooting.contractorPacket`,
- lead summary saved in `contractor_lead_requests.lead_summary`,
- standardized email/contact packet,
- contractor dashboard lead detail screen.

## Files Updated

```text
app/src/services/troubleshootingSessions.ts
app/src/services/contractorLeadFlow.ts
app/src/services/contractorContactRouting.ts
app/src/screens/ContractorLeadDetailScreen.tsx
docs/features/CONTRACTOR_PACKET_INTELLIGENCE.md
docs/build/NEXT_BUILD_STEPS_V21.md
README.md
```

## Safety Boundary

V21 does not add homeowner repair instructions. It only packages existing safe troubleshooting context for contractor use.

The app still must not guide homeowners through:

- electrical testing,
- refrigerant work,
- opening electrical compartments,
- bypassing float switches, pan switches, fuses, breakers, door switches, or safeties,
- gas or combustion work,
- equipment disassembly,
- code-sensitive repair instructions.

## Future Expansion

A later build should add real photo capture/upload status for each suggested prompt, so the contractor can see whether each suggested image was:

- attached,
- skipped,
- not applicable,
- blocked by safety/access.

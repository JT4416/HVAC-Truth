# Next Build Steps — V23 Complete

Current stage after this build: **V23 — Contractor Packet Review and Scoring**.

## What V23 Added

- Added reusable packet scoring service.
- Added packet score card to homeowner lead request flow.
- Saves final packet score into `reportSnapshot.packetScore`.
- Shows packet score badge and missing fields in contractor dashboard lead detail.
- Includes score in saved lead summaries.
- Includes score in standardized email/contact packets.
- Adds score context to phone scripts.

## New File

```text
app/src/services/contractorPacketScoring.ts
```

## Updated Files

```text
app/src/screens/ContractorLeadRequestScreen.tsx
app/src/screens/ContractorLeadDetailScreen.tsx
app/src/services/contractorLeadFlow.ts
app/src/services/contractorContactRouting.ts
docs/features/CONTRACTOR_PACKET_REVIEW_AND_SCORING.md
docs/build/NEXT_BUILD_STEPS_V23.md
README.md
```

## No Migration Required

V23 stores packet scoring inside the existing contractor lead request `report_snapshot` JSON.

## Packet Score Inputs

The V23 score uses:

- ZIP code,
- contact preference and contact detail,
- symptom summary,
- desired outcome,
- air handler location,
- access notes,
- model/serial numbers,
- attached troubleshooting session,
- safe photo status,
- selected contractor count,
- safety boundary visibility.

## Score Labels

```text
Complete packet
Strong packet
Needs a few details
Thin packet
```

## Contractor Badges

```text
Complete
Strong
Needs details
Thin
```

## Safety Rule

The score must never push a homeowner into unsafe work.

If a missing item requires unsafe access, the correct homeowner action is to mark the item or photo as:

```text
blocked_by_safety
```

## Recommended V24 — Contractor Preference Rules

Goal: let verified contractors define what they require before accepting certain lead types.

Recommended V24 scope:

- Add contractor packet requirement preferences:
  - require phone number,
  - require air handler location,
  - require model/serial for quote second opinion,
  - require at least one safe photo for replacement estimates,
  - allow thin emergency packets.
- Add preference-driven warnings before submission.
- Add dashboard filtering by packet score.
- Add lead acceptance guidance:
  - “Acceptable for emergency triage.”
  - “Needs more info before ballpark estimate.”
  - “Ready for estimate review.”
- Store contractor packet preferences in Supabase.
- Apply preferences during verified dashboard lead routing.

## Validation Commands

From local machine:

```bash
cd app
npm install
npx tsc --noEmit
npx expo start
```

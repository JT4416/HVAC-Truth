# V23 — Contractor Packet Review and Scoring

## Goal

Help homeowners and contractors understand whether a lead packet is complete enough to support a useful ballpark estimate or dispatch decision.

V23 adds a reusable contractor packet scoring service and displays the score before submission and inside the contractor dashboard.

## What V23 Adds

### Packet Scoring Service

New file:

```text
app/src/services/contractorPacketScoring.ts
```

Exports:

```text
buildContractorPacketScore(input)
buildPacketScoreText(score)
```

The service produces:

```text
score
maxScore
percent
status
label
summary
items
missingHighValueFields
warnings
contractorBadge
```

### Score Statuses

```text
complete
strong
good/needs_attention
thin_packet
```

Current score labels:

```text
Complete packet
Strong packet
Needs a few details
Thin packet
```

Contractor badges:

```text
Complete
Strong
Needs details
Thin
```

## Scored Items

V23 scores the fields that matter most to contractor routing and ballpark estimation:

| Item | Points | Why it matters |
|---|---:|---|
| Service ZIP | 10 | Confirms service area, travel time, dispatch priority. |
| Contact path | 10 | Contractor needs a reliable way to reach the homeowner. |
| Issue summary | 10 | Defines likely urgency and diagnostic path. |
| Desired outcome | 5 | Shows whether the homeowner wants repair, estimate, second opinion, or scheduling. |
| Air handler location | 10 | Changes labor assumptions, access difficulty, ladder/attic/crawl/roof needs, and ballpark pricing. |
| Access notes | 10 | Reduces surprise charges, reschedules, and unprepared dispatches. |
| Model/serial numbers | 10 | Helps identify age, size, refrigerant, parts, warranty, and quote fairness. |
| Troubleshooting attached | 10 | Gives a structured homeowner observation history. |
| Safe photo status | 10 | Shows what can be reviewed remotely and what needs site verification. |
| Contractor selected | 5 | Confirms where the packet is being routed. |
| Safety boundary visible | 10 | Shows what the homeowner was explicitly told not to do and where access was unsafe. |

## Homeowner Lead Request UI

`ContractorLeadRequestScreen` now shows a packet score card before submission.

The card shows:

- percent complete,
- label,
- contractor badge,
- missing high-value fields,
- safety/photo warnings.

The final submitted `report_snapshot` includes:

```text
reportSnapshot.packetScore
```

## Contractor Dashboard UI

`ContractorLeadDetailScreen` now shows:

- packet score percent,
- contractor badge,
- score summary,
- missing high-value fields,
- full score detail.

## Lead Summary and Contact Packet

V23 adds the packet score to:

- saved lead summary,
- standardized email/contact packet,
- phone script context.

## Safety Boundary

V23 does not add homeowner DIY instructions.

It only scores whether safe documentation is present. Missing data should prompt the homeowner to add safe information, not perform unsafe HVAC work.

If a photo or location cannot be accessed safely, the correct status remains:

```text
blocked_by_safety
```

That status improves contractor context rather than reducing the homeowner's safety compliance.

## Files Updated

```text
app/src/services/contractorPacketScoring.ts
app/src/screens/ContractorLeadRequestScreen.tsx
app/src/screens/ContractorLeadDetailScreen.tsx
app/src/services/contractorLeadFlow.ts
app/src/services/contractorContactRouting.ts
docs/features/CONTRACTOR_PACKET_REVIEW_AND_SCORING.md
docs/build/NEXT_BUILD_STEPS_V23.md
README.md
```

## No Migration Required

V23 stores the score inside the existing JSON `report_snapshot` payload on contractor lead requests.

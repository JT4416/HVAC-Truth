# Next Build Steps — V22 Complete

Current stage after this build: **V22 — Photo Capture for Contractor Packets**.

## What V22 Added

- Added a contractor packet photo attachment service.
- Added safe photo controls to the lead request screen.
- Added photo statuses:
  - `needed`
  - `attached`
  - `skipped`
  - `not_applicable`
  - `blocked_by_safety`
- Added private Supabase Storage bucket migration for `contractor-packet-photos`.
- Uploads attached photos before lead submission.
- Adds uploaded photo metadata into `reportSnapshot.troubleshooting.contractorPacket.photoAttachments`.
- Adds photo status summary into `reportSnapshot.troubleshooting.contractorPacket.photoAttachmentSummary`.
- Shows photo attachment status and previews in contractor dashboard lead detail.
- Includes photo status in saved lead summaries and standardized contact packets.

## Files Updated

```text
app/src/screens/ContractorLeadRequestScreen.tsx
app/src/screens/ContractorLeadDetailScreen.tsx
app/src/services/contractorPacketPhotos.ts
app/src/services/contractorLeadFlow.ts
app/src/services/contractorContactRouting.ts
backend/supabase/migrations/20260704_v22_contractor_packet_photo_storage.sql
docs/features/CONTRACTOR_PACKET_PHOTO_ATTACHMENTS.md
docs/build/NEXT_BUILD_STEPS_V22.md
README.md
```

## Required Migration

Run:

```text
backend/supabase/migrations/20260704_v22_contractor_packet_photo_storage.sql
```

This creates the private `contractor-packet-photos` bucket and storage policies.

## Safety Rules Preserved

The app still must not instruct homeowners to:

- open equipment panels,
- open electrical compartments,
- touch wiring,
- bypass safeties,
- work on refrigerant,
- do gas/combustion work,
- disassemble equipment,
- perform code-sensitive repairs.

If a photo cannot be taken safely, the correct app behavior is to mark the prompt as:

```text
blocked_by_safety
```

## Recommended V23 — Contractor Packet Review and Scoring

Goal: help contractors and homeowners understand packet completeness before dispatch.

Recommended V23 scope:

- Add packet completeness score.
- Show missing high-value fields before submission:
  - ZIP,
  - contact method,
  - air handler location,
  - model/serial numbers,
  - troubleshooting session,
  - safe photo status.
- Let verified contractors define preferred required fields for certain call types.
- Add homeowner-friendly warnings like:
  - “This packet is missing air handler access notes.”
  - “Photos were skipped due to unsafe access; contractor should verify on-site.”
- Add contractor dashboard packet completeness badge.
- Add internal route logic that prioritizes contractors who accept incomplete packets vs those who require more detail.

## Validation Commands

From local machine:

```bash
cd app
npm install
npx tsc --noEmit
npx expo start
```

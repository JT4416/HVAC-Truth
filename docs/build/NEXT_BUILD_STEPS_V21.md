# Next Build Steps — V21 Complete

Current stage after this build: **V21 — Contractor Packet Intelligence**.

## What V21 Added

- Added contractor-facing packet intelligence generated from saved troubleshooting sessions.
- Added severity explanations for contractor handoff context.
- Added workflow-specific professional verification focus items.
- Added homeowner safety boundary summaries inside contractor packets.
- Added safe photo prompts for key workflows.
- Added safe checklist status from homeowner-safe workflow steps.
- Embedded contractor packet intelligence inside `reportSnapshot.troubleshooting.contractorPacket`.
- Included packet intelligence in:
  - troubleshooting lead packet preview,
  - contractor-ready troubleshooting report text,
  - saved lead summaries,
  - standardized email/contact packets,
  - contractor dashboard lead detail.

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

## Setup Notes

No new Supabase migration is required for V21.

V21 uses the existing lead `report_snapshot` JSON payload and the existing troubleshooting session schema.

Required earlier migrations remain:

```text
backend/supabase/migrations/20260703_v17_troubleshooting_workflow_engine.sql
backend/supabase/migrations/20260703_v19_troubleshooting_session_controls.sql
```

## Recommended V22 — Photo Capture for Contractor Packets

Goal: turn the V21 safe photo prompts into actual homeowner upload controls that attach images to the contractor packet.

Recommended V22 scope:

- Add photo prompt objects to the lead request flow.
- Let homeowners attach photos per suggested prompt.
- Store uploaded photos in Supabase Storage.
- Add upload metadata to `report_snapshot`:
  - prompt ID,
  - prompt label,
  - photo URL/storage path,
  - upload status,
  - skipped/not applicable reason.
- Show photo attachment status in contractor dashboard lead detail.
- Include photo status in standardized contact/email packets.
- Preserve all safety limits:
  - no opening panels,
  - no electrical compartments,
  - no refrigerant work,
  - no bypassing safeties,
  - no disassembly.

## Recommended V22 Files

```text
app/src/screens/ContractorLeadRequestScreen.tsx
app/src/screens/ContractorLeadDetailScreen.tsx
app/src/services/contractorLeadFlow.ts
app/src/services/troubleshootingSessions.ts
app/src/services/systemPhotoStorage.ts
backend/supabase/migrations/<next>_contractor_packet_photo_attachments.sql
docs/features/CONTRACTOR_PACKET_PHOTO_ATTACHMENTS.md
docs/build/NEXT_BUILD_STEPS_V22.md
```

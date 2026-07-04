# V22 — Contractor Packet Photo Attachments

## Goal

Turn V21 safe photo prompts into real homeowner controls inside the contractor lead request flow.

V22 lets a homeowner attach useful photos to the contractor packet while preserving the HVAC Truth safety boundary. The homeowner can also mark a prompt as skipped, not applicable, or unsafe to access.

## What V22 Adds

### Photo Attachment Service

New file:

```text
app/src/services/contractorPacketPhotos.ts
```

It provides:

- `ContractorPacketPhotoAttachment`
- `ContractorPacketPhotoStatus`
- `createPhotoAttachmentsFromPrompts`
- `attachLocalPhoto`
- `updateAttachmentStatus`
- `uploadContractorPacketPhoto`
- `uploadPendingContractorPacketPhotos`
- `summarizePhotoAttachments`

### Photo Statuses

Each safe photo prompt can be tracked as:

```text
needed
attached
skipped
not_applicable
blocked_by_safety
```

The most important status is `blocked_by_safety`. This lets the homeowner stop instead of crossing a safety boundary, while still giving the contractor useful context.

### Lead Request UI

`ContractorLeadRequestScreen` now shows safe photo controls under the troubleshooting packet section.

For each suggested prompt, the homeowner can:

- take a photo,
- retake a photo,
- skip,
- mark not applicable,
- mark unsafe access.

Each prompt displays:

- label,
- instruction,
- safety note,
- preview image if attached,
- current status.

### Upload Flow

When the homeowner submits a lead request:

1. Local photo attachments are uploaded to Supabase Storage.
2. Uploaded paths and signed URLs are written into the lead `report_snapshot` JSON.
3. Photo status summary is written into `reportSnapshot.troubleshooting.contractorPacket.photoAttachmentSummary`.
4. Detailed photo metadata is written into `reportSnapshot.troubleshooting.contractorPacket.photoAttachments`.
5. The contractor lead request is submitted with the final enriched packet.

### Contractor Dashboard Display

`ContractorLeadDetailScreen` now shows:

- safe photo attachment summary,
- attached photo previews when signed URLs exist,
- skipped / not applicable / unsafe access status,
- storage path metadata,
- prompt instruction and safety note.

### Lead Packet Text

V22 photo attachment status is included in:

- saved lead summary,
- standardized email/contact packet,
- phone script context.

## Storage

New migration:

```text
backend/supabase/migrations/20260704_v22_contractor_packet_photo_storage.sql
```

This creates a private bucket:

```text
contractor-packet-photos
```

Object paths are user-scoped:

```text
<user_id>/<lead_or_session_id>/<prompt_id>-<timestamp>.jpg
```

Storage policies allow authenticated users to upload, read, update, and delete only objects where the first path segment matches their own user ID.

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

## Safety Boundary

V22 does not instruct homeowners to open equipment, remove panels, inspect wiring, bypass safeties, work on refrigerant, or perform code-sensitive repairs.

Photo prompts are limited to visible, safe areas only.

If a photo cannot be taken safely, the homeowner should mark it:

```text
blocked_by_safety
```

This becomes contractor-visible context.

## Future Expansion

Future builds can add:

- contractor-side signed URL refresh,
- photo deletion controls,
- photo review flags,
- AI-assisted photo classification,
- required-photo rules for verified contractors,
- separate customer consent controls for photo sharing.

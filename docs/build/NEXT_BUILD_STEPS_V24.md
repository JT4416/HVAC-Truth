# Next Build Steps — V24 Complete

Current stage after this build: **V24 — Verified Contractor Participation Rules**.

## What V24 Added

- Added a verified contractor participation rules service.
- Reframed verified dashboard delivery around active participation plus operating limits.
- Kept packet score informational instead of making it a lead-category filter.
- Added Supabase contractor participation fields.
- Added documentation for the verified contractor participation standard.

## New Files

```text
app/src/services/contractorParticipationRules.ts
backend/supabase/migrations/20260704_v24_verified_contractor_participation.sql
docs/features/VERIFIED_CONTRACTOR_PARTICIPATION_RULES.md
docs/build/NEXT_BUILD_STEPS_V24.md
```

## Updated Files

```text
app/src/services/verifiedLeadRouting.ts
app/src/services/contractorLeadFlow.ts
README.md
```

## Migration Required

Run:

```text
backend/supabase/migrations/20260704_v24_verified_contractor_participation.sql
```

## Verified Contractor Standard

Verified contractors are either active or inactive in the HVAC Truth verified lead network.

They may manage:

- service area,
- emergency availability,
- availability windows,
- temporary pause status,
- daily lead capacity,
- weekly lead capacity.

They do not use packet score as a category-selection switch.

## Recommended V25 — Participation Admin Controls

Goal: build the owner/admin and contractor-facing controls to manage the V24 participation fields.

Recommended V25 scope:

- Add admin participation controls on claim review / contractor profile detail.
- Add contractor-facing pause/resume control.
- Add service area editor.
- Add emergency availability editor.
- Add capacity limit editor.
- Add routing visibility message explaining why a contractor is active, paused, outside service area, or capacity-limited.
- Add activity log events for participation changes.

## Validation Commands

From local machine:

```bash
cd app
npm install
npx tsc --noEmit
npx expo start
```

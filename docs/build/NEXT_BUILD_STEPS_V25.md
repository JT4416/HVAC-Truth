# Next Build Steps — V25 Complete

Current stage after this build: **V25 — Participation Admin Controls**.

## What V25 Added

- Added an admin service for contractor participation controls.
- Added Supabase support for admin participation updates.
- Added app event logging for contractor participation changes.
- Aligned claim review checklist language with the V24 participation standard.
- Documented the participation admin control model.

## New Files

```text
app/src/services/contractorParticipationAdmin.ts
backend/supabase/migrations/20260704_v25_participation_admin_controls.sql
docs/features/PARTICIPATION_ADMIN_CONTROLS.md
docs/build/NEXT_BUILD_STEPS_V25.md
```

## Updated Files

```text
app/src/services/contractorClaimReview.ts
README.md
```

## Migration Required

Run after V24:

```text
backend/supabase/migrations/20260704_v25_participation_admin_controls.sql
```

## Admin Control Fields

```text
hvac_truth_participation_status
participation_paused
participation_pause_reason
service_zip_codes
emergency_service
max_daily_dashboard_leads
max_weekly_dashboard_leads
accepts_all_eligible_lead_types
```

## Recommended V26 — Participation Control Screens

Goal: add visible admin/contractor UI for the V25 service.

Recommended V26 scope:

- Add admin participation contractor list screen.
- Add participation detail editor screen.
- Add pause/resume action.
- Add service ZIP editor.
- Add emergency availability toggle.
- Add daily and weekly lead capacity inputs.
- Add route visibility messages explaining why a contractor is active, inactive, paused, suspended, outside service area, or capacity-limited.

## Validation Commands

From local machine:

```bash
cd app
npm install
npx tsc --noEmit
npx expo start
```

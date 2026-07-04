# HVAC Truth — Next Build Steps V26

Current stage: **V26 — Participation Control Screens**

## Completed In V26

- Added admin participation contractor list screen.
- Added admin participation detail editor screen.
- Added active / inactive / paused / suspended controls.
- Added pause reason editing.
- Added service ZIP editor.
- Added emergency availability toggle.
- Added daily and weekly dashboard lead capacity inputs.
- Added route visibility messaging on admin screens.
- Reworked contractor-facing copy from **Lead Preferences** to **Participation Settings**.
- Preserved the all-or-nothing verified contractor participation rule.

## Important Product Rule

```text
Verified contractors are either in or out of the HVAC Truth verified network.
They may set operating limits.
They may not cherry-pick lead categories.
```

## Local Validation

Run locally before tagging V26 as fully verified:

```bash
cd app
npm install
npx tsc --noEmit
npx expo start
```

## Database Validation

Confirm these migrations are applied in order:

```text
backend/supabase/migrations/20260704_v24_verified_contractor_participation.sql
backend/supabase/migrations/20260704_v25_participation_admin_controls.sql
```

Review whether the V25 migration syntax is compatible with the target Supabase/Postgres version, especially any `create policy if not exists` statements.

## Recommended V27

Next build:

```text
V27 — Delivery Method Cleanup
```

Goal:

```text
Separate delivery method preferences from lead category preferences.
```

Recommended V27 scope:

- Rename user-facing and internal concepts from `lead_preferences` to `delivery_methods` where appropriate.
- Keep routing options such as dashboard, email, phone, SMS, website, and contact form.
- Remove ambiguity that could imply contractors choose preferred lead categories.
- Update SQL comments, claim review language, service names, and documentation.
- Consider a migration that introduces `contractor_delivery_methods` while preserving/backfilling existing data.

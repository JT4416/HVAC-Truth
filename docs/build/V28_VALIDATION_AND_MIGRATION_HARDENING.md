# V28 Validation and Migration Hardening

Current stage: **V28 — Local Validation and Supabase Migration Hardening**

## What V28 Adds

V28 adds repeatable local validation setup and documents the migration compatibility review needed before applying the latest database changes to production.

## App Validation Setup

Added:

```text
app/tsconfig.json
```

Updated:

```text
app/package.json
```

New local validation command:

```bash
cd app
npm install
npm run typecheck
npm start
```

## Migration Review Findings

### V25 participation admin controls

File:

```text
backend/supabase/migrations/20260704_v25_participation_admin_controls.sql
```

Finding:

```text
The migration uses create-policy-if-not-exists syntax. Before applying to a Supabase project, confirm the target Postgres version supports that form. If it does not, create a follow-up migration that explicitly removes the named policy first and then creates it again.
```

### V27 delivery method cleanup

File:

```text
backend/supabase/migrations/20260704_v27_delivery_method_cleanup.sql
```

Finding:

```text
The migration creates new policies on a new table. That is suitable for first-time application. If the migration is edited and reapplied manually in a non-reset database, the policy names must be removed before recreating them.
```

## Recommended Local Database Test

Use a clean Supabase branch or staging project and apply migrations in this order:

```text
backend/supabase/migrations/20260704_v24_verified_contractor_participation.sql
backend/supabase/migrations/20260704_v25_participation_admin_controls.sql
backend/supabase/migrations/20260704_v27_delivery_method_cleanup.sql
```

Then verify:

```text
- contractor_delivery_methods exists,
- old contractor_lead_preferences rows backfill into contractor_delivery_methods,
- verified contractor users can read their own delivery methods,
- app admins can read and update contractor participation controls,
- contractor claim review still writes compatibility fields,
- contractor participation settings screen still reads delivery methods.
```

## Known Limitation

This repository was updated through the GitHub connector. Local TypeScript, Expo, and Supabase CLI validation were not executed in this environment.

## Recommended V29

```text
V29 — Claim Review RPC Delivery Method Write-Through
```

Goal:

```text
Update the claim review approval flow so newly approved claims write to the new contractor_delivery_methods table directly while preserving legacy compatibility fields during the transition period.
```

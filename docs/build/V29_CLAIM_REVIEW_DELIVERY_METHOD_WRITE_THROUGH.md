# V29 — Claim Review RPC Delivery Method Write-Through

Date: 2026-07-04
Repository: `JT4416/HVAC-Truth`

## Purpose

V29 connects contractor claim approval to the new delivery-method data model introduced in V27.

Before V29, approved contractor claims populated legacy delivery rows in `contractor_lead_preferences`. V27 added `contractor_delivery_methods`, but the claim approval RPC still needed a direct write-through path into that new table.

## Files Added

```text
backend/supabase/migrations/20260704_v29_claim_review_delivery_method_write_through.sql
docs/build/V29_CLAIM_REVIEW_DELIVERY_METHOD_WRITE_THROUGH.md
```

## Database Behavior

The V29 migration replaces `public.review_contractor_profile_claim(...)`.

When a claim is approved with the `verified` decision, the RPC now:

```text
- creates or updates the verified contractor record,
- preserves contractor legacy lead-preference fields,
- activates verified contractor dashboard access,
- refreshes contractor service area rows,
- writes delivery/contact routes to contractor_delivery_methods,
- also writes the same routes to contractor_lead_preferences for transition compatibility.
```

## Delivery Method Mapping

Delivery method destinations are resolved from the approved claim:

```text
email        -> claim contact_email
phone        -> claim contact_phone
sms          -> claim contact_phone
website_form -> claim website
dashboard    -> null destination
```

## Preserved Marketplace Rule

```text
Verified contractors are either in or out of the HVAC Truth verified network.
They may set operating limits.
They may configure delivery/contact routes.
They may not cherry-pick request categories.
Packet score remains informational only.
```

## Migration Order

Run after V27:

```text
backend/supabase/migrations/20260704_v24_verified_contractor_participation.sql
backend/supabase/migrations/20260704_v25_participation_admin_controls.sql
backend/supabase/migrations/20260704_v27_delivery_method_cleanup.sql
backend/supabase/migrations/20260704_v29_claim_review_delivery_method_write_through.sql
```

## Validation Checklist

Run locally or in a Supabase staging branch:

```text
1. Apply V24, V25, V27, then V29 migrations in order.
2. Submit a contractor claim using dashboard, email, sms, phone, and/or website_form delivery methods.
3. Approve the claim through review_contractor_profile_claim(..., 'verified', ...).
4. Confirm public.contractor_delivery_methods has active rows for the approved contractor.
5. Confirm public.contractor_lead_preferences still has matching compatibility rows.
6. Confirm the contractor record remains hvac_truth_verified = true.
7. Confirm contractor dashboard access is active and verified.
8. Confirm the app delivery-method service reads from contractor_delivery_methods first and falls back to legacy rows only if needed.
```

## Known Validation Limit

The GitHub connector can create and update repository files, but it cannot run local Expo, TypeScript, or Supabase CLI validation. Run these locally:

```bash
cd app
npm install
npm run typecheck
npm start
```

Then apply the migration to a clean Supabase branch or staging project before production.

# V13 — Contractor Claim Review

V13 adds the internal review workflow that turns a submitted contractor profile claim into verified contractor dashboard access.

## Purpose

Contractor profile claiming is not the same thing as verification.

A contractor can submit a claim in V11, but V12 dashboard lead access should only activate after HVAC Truth reviews and approves that claim.

## Core Rule

> A submitted claim means a business asked for ownership. A verified claim means HVAC Truth reviewed the business identity, contact method, service area, and lead preferences before activating dashboard leads.

## User Flow

1. Contractor submits a profile claim from **Claim Contractor Profile**.
2. Reviewer opens **Contractor Claim Review**.
3. Reviewer opens a pending claim.
4. Reviewer checks business information, authorized contact, website, license number, service ZIP codes, emergency service status, and lead preferences.
5. Reviewer enters review notes.
6. Reviewer chooses one of three decisions:
   - Approve and verify
   - Request more information
   - Reject claim

## Approval Behavior

When a claim is approved, the Supabase function:

- Creates a contractor profile if the claim is not already tied to one.
- Updates the contractor profile if a contractor already exists.
- Marks the contractor as HVAC Truth verified.
- Sets dashboard, email, and SMS acceptance flags based on claim preferences.
- Sets claim status to `verified`.
- Creates or updates `contractor_dashboard_users` with active verified dashboard access.
- Copies service ZIP codes into `contractor_service_areas`.
- Copies lead preferences into `contractor_lead_preferences`.

## Request More Information Behavior

When a claim needs more information, the workflow:

- Sets claim status to `needs_review`.
- Saves reviewer notes.
- Does not create dashboard access.
- Does not activate direct dashboard leads.

## Rejection Behavior

When a claim is rejected, the workflow:

- Sets claim status to `rejected`.
- Saves reviewer notes.
- Does not create dashboard access.
- Keeps the contractor on public-contact routing if they appear in contractor discovery.

## Files Added

```text
app/src/services/contractorClaimReview.ts
app/src/screens/AdminContractorClaimReviewScreen.tsx
app/src/screens/AdminContractorClaimDetailScreen.tsx
backend/supabase/migrations/20260703_v13_contractor_claim_review.sql
docs/features/CONTRACTOR_CLAIM_REVIEW.md
docs/build/NEXT_BUILD_STEPS_V13.md
```

## Files Updated

```text
app/App.tsx
app/src/screens/HomeScreen.tsx
README.md
```

## Database Objects

V13 adds:

```text
app_admin_users
review_contractor_profile_claim(...)
```

## Admin Bootstrap

The first reviewer must be added manually in Supabase after the correct user/profile UUID is known:

```sql
insert into public.app_admin_users (user_id, role, active)
values ('<profile_uuid>', 'owner', true);
```

After that, that signed-in user can load claim review data and approve, reject, or request more information.

## Security Model

Review actions are restricted to active rows in:

```text
app_admin_users
```

Allowed roles:

```text
owner
admin
reviewer
```

## MVP Limitation

The admin review screens are intentionally visible from the MVP home screen for fast internal testing. Supabase RLS and the approval function still gate the data and write actions. Before public beta, move the review entry point behind an internal/admin-only UI section.

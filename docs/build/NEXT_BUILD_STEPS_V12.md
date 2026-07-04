# Next Build Steps After V12

V12 added the verified contractor dashboard foundation.

## Completed in V12

- Added contractor dashboard service.
- Added contractor dashboard screen.
- Added contractor lead detail screen.
- Added contractor lead preferences screen.
- Added navigation routes and home screen entry point.
- Added Supabase migration for contractor dashboard access, activity, notes, and availability windows.
- Documented the V12 contractor dashboard feature.

## Required Supabase Step

Run the V12 migration in Supabase:

```sql
backend/supabase/migrations/20260703_v12_contractor_dashboard.sql
```

## Important Verification Rule

Direct dashboard leads require an active verified row in:

```text
contractor_dashboard_users
```

Required values:

```text
dashboard_status = active
verification_status = verified
user_id = signed-in contractor user
contractor_id = approved contractor profile
```

Unverified contractors remain on the V9 public-contact routing flow.

## Recommended V13

Build the contractor claim review and verification workflow.

V13 should let an HVAC Truth admin or internal review process:

- Review submitted contractor profile claims
- Approve, reject, or request more information
- Create or update the canonical contractor profile
- Mark the contractor as HVAC Truth verified
- Create the verified `contractor_dashboard_users` row
- Copy approved service ZIP codes into `contractor_service_areas`
- Copy approved lead preferences into `contractor_lead_preferences`
- Enable dashboard lead delivery only when approved

## Recommended V13 Files

```text
app/src/screens/AdminContractorClaimReviewScreen.tsx
app/src/screens/AdminContractorClaimDetailScreen.tsx
app/src/services/contractorClaimReview.ts
backend/supabase/migrations/20260703_v13_contractor_claim_review.sql
docs/features/CONTRACTOR_CLAIM_REVIEW.md
docs/build/NEXT_BUILD_STEPS_V13.md
```

## Recommended V13 Database Work

- Add admin/reviewer policy model.
- Add claim approval function or Edge Function.
- Create a controlled approval path that copies claim data into contractor-facing tables.
- Prevent dashboard access until the approval path runs successfully.

## Suggested V13 Business Rule

A contractor profile claim is not the same as contractor verification.

A claim only means the business asked for ownership. Verification should mean HVAC Truth has reviewed the business identity, contact method, license or public records, and service area before activating dashboard leads.

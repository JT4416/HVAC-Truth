# Next Build Steps After V13

V13 added the contractor claim review and verification workflow.

## Completed in V13

- Added contractor claim review service.
- Added admin claim review list screen.
- Added admin claim detail and decision screen.
- Added Supabase migration for admin reviewers and claim approval.
- Added approval function that converts verified claims into contractor dashboard access.
- Added navigation routes and home screen entry point.
- Documented the V13 contractor claim review feature.

## Required Supabase Step

Run the V13 migration in Supabase:

```sql
backend/supabase/migrations/20260703_v13_contractor_claim_review.sql
```

## Required Admin Bootstrap

After the migration, add the first reviewer manually using the correct profile/user UUID:

```sql
insert into public.app_admin_users (user_id, role, active)
values ('<profile_uuid>', 'owner', true);
```

Without this row, the review screen should not return claim data and the approval function should reject the request.

## Important V13 Rule

A contractor profile claim is not verification.

A claim only means the business requested ownership. Verification means HVAC Truth reviewed the business identity, contact method, license/public presence, service area, and lead preferences before activating direct dashboard leads.

## Recommended V14

Build the homeowner troubleshooting workflow engine later, but the planned next build after the contractor verification path should be:

**V14 — Verified Dashboard Lead Routing**

V14 should connect the homeowner lead request flow to verified contractor dashboard delivery.

Recommended V14 goals:

- When a selected contractor is HVAC Truth verified and accepts dashboard leads, create recipient rows with `delivery_method = verified_dashboard`.
- Keep unverified contractors on V9 public-contact routing.
- Add visible homeowner messaging that verified contractors can receive richer lead packets through HVAC Truth.
- Add route generation records for dashboard delivery.
- Add contractor notification readiness fields.
- Add a dashboard-ready lead packet status.

## Recommended V14 Files

```text
app/src/services/verifiedLeadRouting.ts
app/src/services/contractorLeadFlow.ts
app/src/screens/ContractorLeadRequestScreen.tsx
backend/supabase/migrations/20260703_v14_verified_dashboard_lead_routing.sql
docs/features/VERIFIED_DASHBOARD_LEAD_ROUTING.md
docs/build/NEXT_BUILD_STEPS_V14.md
```

## Suggested V14 Business Rule

Paid placement cannot override trust.

Verified dashboard routing should be based on verified status, service area match, lead preference, and homeowner selection. Sponsored or paid status should never move an unverified contractor ahead of a better trusted option.

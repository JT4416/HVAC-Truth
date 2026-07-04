# V14 — Verified Dashboard Lead Routing

V14 connects homeowner lead requests to verified contractor dashboard delivery.

## Purpose

The contractor dashboard from V12 should receive direct lead packets only when the contractor has been verified through the V13 review workflow.

Unverified contractors can still appear in contractor discovery, but they stay on public-contact routing from V9.

## Core Rule

Direct dashboard routing requires:

- HVAC Truth verification
- dashboard lead acceptance
- a real contractor profile ID

## What V14 Adds

V14 adds a routing helper that decides whether each selected contractor should receive direct HVAC Truth dashboard delivery or public-contact delivery.

Public-contact delivery can use website, contact form, phone, SMS, Google/Yelp profile, or published email.

## Dashboard Eligibility

A contractor is eligible for direct dashboard delivery only when:

- `hvacTruthVerified` is true
- `acceptsDashboardLeads` is true
- `id` or `contractorId` exists

If any of those are missing, the contractor falls back to public-contact routing.

## Lead Recipient Behavior

Verified dashboard contractors receive recipient rows with:

```text
delivery_method = verified_dashboard
homeowner_action_required = false
recipient_status = sent
dashboard_delivery_status = dashboard_ready
```

Unverified contractors use public-contact methods and remain outside the contractor dashboard.

## Homeowner UI Behavior

The homeowner lead request screen now shows a verified routing preview.

The preview explains how many selected contractors can receive the lead directly in HVAC Truth and how many will use public-contact routing.

Each contractor card also shows the selected delivery route.

## Files Added

```text
app/src/services/verifiedLeadRouting.ts
backend/supabase/migrations/20260703_v14_verified_dashboard_lead_routing.sql
docs/features/VERIFIED_DASHBOARD_LEAD_ROUTING.md
docs/build/NEXT_BUILD_STEPS_V14.md
```

## Files Updated

```text
app/src/services/contractorLeadFlow.ts
app/src/screens/ContractorLeadRequestScreen.tsx
README.md
```

## Database Additions

V14 adds delivery tracking columns to `contractor_lead_recipients`:

```text
dashboard_delivery_status
dashboard_delivery_ready_at
dashboard_delivery_notes
```

V14 also adds:

```text
verified_dashboard_lead_routing_events
```

## Relationship to V12 Dashboard

The V12 contractor dashboard should only query lead recipients where:

```text
delivery_method = verified_dashboard
```

That keeps public-contact routed leads out of the contractor portal.

## Relationship to V13 Claim Review

V13 creates verified contractor dashboard access.

V14 uses that verification state to decide whether a homeowner lead can be sent into the contractor dashboard.

## MVP Limitation

The contractor list is still an MVP/demo flow until live discovery and verified contractor records are fully joined. The routing service is ready for real contractor IDs once the provider-backed contractor list returns persisted contractor rows.

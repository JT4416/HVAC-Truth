# V25 — Participation Admin Controls

## Purpose

V25 turns the V24 verified contractor participation rule into an admin-manageable operating model.

The core rule remains:

```text
Verified contractors are either active or inactive in the HVAC Truth network.
```

Packet score is still informational. It helps both sides understand packet quality, but it does not become a category-selection switch.

## What Admins Can Manage

Admins can manage whether a verified contractor can receive direct dashboard leads by changing operational fields:

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

## Participation Statuses

```text
active     — contractor can receive verified dashboard leads inside operating limits
inactive   — contractor is not currently in verified dashboard routing
paused     — contractor is temporarily paused
suspended  — contractor has been administratively suspended
```

## Operating Limits

The contractor may control operational availability:

- service area,
- emergency availability,
- temporary pause status,
- daily lead capacity,
- weekly lead capacity.

These are capacity and serviceability settings, not lead-category preference settings.

## New Service

```text
app/src/services/contractorParticipationAdmin.ts
```

Main functions:

```text
getParticipationContractors()
getParticipationContractor(contractorId)
updateContractorParticipation(input)
buildAdminParticipationSummary(contractor, zipCode)
```

## Claim Review Alignment

```text
app/src/services/contractorClaimReview.ts
```

The claim review checklist now checks for service area, contact information, emergency availability, and participation-standard acknowledgement rather than treating lead preferences as the network policy.

## Migration

```text
backend/supabase/migrations/20260704_v25_participation_admin_controls.sql
```

The migration adds:

- admin contractor update policy,
- participation RPC,
- app event logging for participation changes.

## Recommended Next Step

V26 should add actual screens for:

- participation contractor list,
- participation detail editor,
- pause/resume button,
- service ZIP editor,
- emergency availability editor,
- daily/weekly lead capacity editor.

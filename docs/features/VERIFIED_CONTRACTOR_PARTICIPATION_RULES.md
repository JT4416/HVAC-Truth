# V24 — Verified Contractor Participation Rules

## Decision

Verified contractors are either active or inactive in the HVAC Truth verified lead network.

A participating verified contractor accepts the HVAC Truth lead standard inside their operating limits.

## Why This Matters

HVAC Truth is homeowner-first.

The homeowner promise is stronger when the rule is simple:

```text
Verified contractor = accepts the HVAC Truth lead standard.
```

## Allowed Contractor Controls

Contractors may manage operational limits:

- service ZIPs or service area,
- emergency availability,
- business hours / availability windows,
- temporary pause status,
- daily dashboard lead capacity,
- weekly dashboard lead capacity,
- active / inactive network participation.

These controls describe whether the contractor can actually serve the homeowner.

## Lead Standard

The verified network standard covers eligible HVAC Truth lead categories inside the contractor service area and operating limits.

Examples:

- emergency calls,
- no-cooling calls,
- drain or water calls,
- maintenance requests,
- quote second opinions,
- replacement estimates,
- thin packets,
- strong packets,
- homeowner situations that require on-site verification.

## Packet Score Role

V23 packet score remains valuable, but its role is informational.

Packet score should be used to:

- tell the homeowner what is missing,
- tell the contractor what is included,
- show packet quality before response,
- identify missing high-value fields,
- highlight unsafe-access gaps,
- reduce misunderstanding before dispatch.

Packet score is not a lead-category selection control.

## Routing Rule

A verified contractor can receive direct dashboard leads when:

```text
hvacTruthVerified = true
acceptsDashboardLeads = true
contractor profile ID exists
participation status is active
contractor is inside service area
contractor is not paused
contractor is not capacity-limited
```

## Migration

V24 adds contractor participation fields:

```text
backend/supabase/migrations/20260704_v24_verified_contractor_participation.sql
```

Fields:

```text
hvac_truth_participation_status
participation_paused
participation_pause_reason
max_daily_dashboard_leads
max_weekly_dashboard_leads
accepts_all_eligible_lead_types
```

## Files

```text
app/src/services/contractorParticipationRules.ts
app/src/services/verifiedLeadRouting.ts
app/src/services/contractorLeadFlow.ts
backend/supabase/migrations/20260704_v24_verified_contractor_participation.sql
docs/features/VERIFIED_CONTRACTOR_PARTICIPATION_RULES.md
docs/build/NEXT_BUILD_STEPS_V24.md
README.md
```

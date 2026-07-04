# V12 — Contractor Dashboard

V12 introduces the contractor-side dashboard for verified HVAC Truth contractors.

## Purpose

The dashboard lets verified contractors review homeowner lead packets without weakening HVAC Truth's trust model.

The key rule remains:

> Unverified contractors do not receive direct dashboard leads. They remain on the V9 public-contact routing flow until HVAC Truth verifies the contractor profile claim.

## User Flow

1. Contractor signs in.
2. Contractor opens **Contractor Dashboard** from the home screen.
3. HVAC Truth checks `contractor_dashboard_users` for an active, verified dashboard access row tied to the signed-in user.
4. If verified, the contractor sees dashboard-routed lead packets.
5. If not verified, the app routes the contractor back toward profile claiming.

## Dashboard Capabilities

V12 supports:

- Viewing incoming homeowner lead packets
- Opening attached contractor-ready system report snapshots
- Seeing air handler location and access notes when available
- Seeing homeowner preferred contact method and time window
- Accepting a lead
- Declining a lead
- Marking a lead as scheduled
- Adding internal contractor notes
- Reviewing lead preferences and availability windows

## Files Added

```text
app/src/services/contractorDashboard.ts
app/src/screens/ContractorDashboardScreen.tsx
app/src/screens/ContractorLeadDetailScreen.tsx
app/src/screens/ContractorLeadPreferencesScreen.tsx
backend/supabase/migrations/20260703_v12_contractor_dashboard.sql
docs/features/CONTRACTOR_DASHBOARD.md
docs/build/NEXT_BUILD_STEPS_V12.md
```

## Files Updated

```text
app/App.tsx
app/src/screens/HomeScreen.tsx
README.md
```

## Database Objects

V12 adds:

```text
contractor_dashboard_users
contractor_lead_activity
contractor_notes
contractor_availability_windows
```

It also adds `updated_at` to `contractor_lead_recipients` if that column does not already exist.

## Security Model

The dashboard is gated by:

```text
contractor_dashboard_users.dashboard_status = active
contractor_dashboard_users.verification_status = verified
contractor_dashboard_users.user_id = auth.uid()
```

This means the app can show the dashboard entry point broadly, but useful dashboard data only appears for users who have verified contractor dashboard access.

## Lead Packet Contents

A contractor lead packet can include:

- ZIP code
- service type
- urgency
- homeowner symptom summary
- desired outcome
- preferred contact method
- preferred time window
- homeowner contact details when supplied
- report snapshot
- air handler location
- access notes
- model and serial details
- estimated age and tonnage
- decoder confidence

## MVP Limitation

The V12 lead preferences screen is intentionally read-first. Full contractor preference editing should be enabled after the claim review workflow copies approved claim data into the verified contractor tables.

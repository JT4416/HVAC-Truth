# Participation Control Screens

Version: V26

## Purpose

V26 turns the V25 participation admin service into visible screens for the HVAC Truth app.

The screens keep the verified contractor marketplace rule intact:

```text
Verified contractors are either active or inactive in the HVAC Truth network.
They do not choose preferred lead categories.
They take the good with the bad inside their service area and operating limits.
```

## Screens Added

```text
app/src/screens/AdminContractorParticipationScreen.tsx
app/src/screens/AdminContractorParticipationDetailScreen.tsx
```

## Screens Updated

```text
app/src/screens/ContractorLeadPreferencesScreen.tsx
app/src/screens/ContractorDashboardScreen.tsx
app/src/screens/HomeScreen.tsx
app/App.tsx
```

## Admin Participation List

The admin list screen shows verified contractors and their current routing visibility.

It summarizes whether each contractor is:

- participating,
- not participating,
- paused,
- outside service area,
- capacity-limited.

Each contractor card links to the detail editor.

## Admin Participation Detail Editor

The detail screen lets an owner/admin manage:

- active / inactive / paused / suspended status,
- pause reason,
- service ZIP codes,
- emergency availability,
- daily dashboard lead limit,
- weekly dashboard lead limit.

The editor also shows route visibility messaging before save so the admin can see why a contractor is routable or not routable.

## Contractor-Facing Language Cleanup

The previous contractor screen name/code path remains `ContractorLeadPreferencesScreen` for navigation compatibility, but the visible UI now says **Participation Settings**.

The screen now separates:

- delivery methods, and
- availability windows,

from the core participation rule.

It explicitly states that this is not a lead-category picker.

## Locked Product Rule

Active verified contractors may define operating limits. They may not choose only:

- replacement estimates,
- easy calls,
- high-dollar calls,
- high-score packets,
- no-cooling calls,
- quote checks,
- maintenance requests,
- leak calls.

Packet score remains informational only.

## Supabase Dependency

V26 depends on the V24 and V25 migrations:

```text
backend/supabase/migrations/20260704_v24_verified_contractor_participation.sql
backend/supabase/migrations/20260704_v25_participation_admin_controls.sql
```

## Local Validation Needed

The repository was updated through the GitHub connector. Run locally:

```bash
cd app
npm install
npx tsc --noEmit
npx expo start
```

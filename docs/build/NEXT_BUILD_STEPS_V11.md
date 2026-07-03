# Next Build Steps After V11

V11 added contractor profile claiming.

## Completed in V11

- Added contractor profile claim service.
- Added contractor profile claim screen.
- Added navigation route from the home dashboard.
- Added Supabase migration for contractor profile claims.
- Added contractor service area table.
- Added contractor lead preference table.
- Added claim status lifecycle.
- Added V11 feature documentation.

## Required Supabase step

Run the V11 migration in Supabase:

```sql
backend/supabase/migrations/20260703_v11_contractor_profile_claiming.sql
```

## Recommended V12

Build the contractor dashboard.

The dashboard should let verified contractors:

- view incoming homeowner lead packets
- view attached contractor-ready system reports
- see homeowner preferred contact method
- accept or decline leads
- mark leads as scheduled
- add internal notes
- update service area and lead preferences

## Recommended V12 database objects

```text
contractor_dashboard_users
contractor_lead_activity
contractor_notes
contractor_availability_windows
```

## Recommended V12 screens

```text
ContractorDashboardScreen
ContractorLeadDetailScreen
ContractorLeadPreferencesScreen
ContractorServiceAreaScreen
```

## Important business rule

Do not let unverified contractors receive direct dashboard leads. Until a contractor is verified, HVAC Truth should continue using the public-contact routing flow from V9.

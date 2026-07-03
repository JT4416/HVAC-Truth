# Next Build Steps After V7

## V7 completed

V7 adds the Contractor-Ready System Report and air handler location/access context.

New app screen:

- `app/src/screens/ContractorReportScreen.tsx`

Updated app files:

- `app/App.tsx`
- `app/src/screens/HomeScreen.tsx`
- `app/src/screens/MySystemScreen.tsx`
- `app/src/domain/systemProfileTypes.ts`
- `app/src/services/profilePersistence.ts`
- `backend/supabase/schema.sql`

New docs:

- `docs/features/CONTRACTOR_SYSTEM_REPORT.md`
- `docs/build/NEXT_BUILD_STEPS_V7.md`

## Immediate next steps

1. Run the updated Supabase SQL.
2. Save a system profile with air handler location selected.
3. Upload indoor/outdoor data plate photos.
4. Run the decoder.
5. Open Contractor Report and confirm the report reflects profile, photos, decoder, and access details.
6. Test Share Report on iOS/Android.

## Recommended V8

Build **V8: Contractor Lead Request Flow**.

V8 should let homeowners send the report with a service request to selected contractors. The contractor lead should include:

- service need type
- urgency
- ZIP code
- system report snapshot
- air handler location/access notes
- data plate photo references
- quote checker history, if available
- homeowner preferred contact method

This is the bridge between homeowner utility and contractor monetization.

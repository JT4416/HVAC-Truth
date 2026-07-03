# Next Build Steps

## Immediate next step: Supabase auth and system profile persistence

1. Add sign up and login.
2. Capture ZIP code during onboarding.
3. Create `profiles` and `homes` records after sign up.
4. Let the homeowner create their first `hvac_systems` record.
5. Save My System fields to Supabase.
6. Upload indoor and outdoor data plate photos to the private `system-data-plates` storage bucket.
7. Save photo metadata to `hvac_system_photos`.

## Data plate capture flow

The My System screen now includes draft UI for:

- Indoor unit data plate photo
- Outdoor unit data plate photo
- Model and serial fields for each unit
- Filter size
- Estimated age
- Notes

## Later: OCR/AI extraction

After the upload flow is stable, add extraction:

1. Upload photo.
2. Queue extraction job.
3. Extract model, serial, brand, refrigerant, tonnage, and manufacture clues.
4. Save extraction result to `data_plate_extractions`.
5. Show extracted values to homeowner for review.
6. Apply confirmed values to `hvac_systems`.

## Platform portability note

The current starter still uses Expo for fast testing, but the data model and feature logic are portable. The camera layer should remain isolated so it can be replaced later with:

- Bare React Native camera/image picker
- Flutter image picker
- Native iOS/Android camera flow

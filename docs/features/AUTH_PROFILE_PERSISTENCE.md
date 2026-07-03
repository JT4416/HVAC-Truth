# V5 Feature: Auth + Profile Persistence

V5 turns HVAC Truth from a local demo into a homeowner-account MVP.

## What V5 adds

- Email/password sign up and sign in through Supabase Auth.
- Persistent Supabase session storage using `@react-native-async-storage/async-storage`.
- Homeowner profile creation with ZIP code.
- Primary home creation tied to the authenticated user.
- My System persistence to `hvac_systems`.
- Indoor and outdoor data plate image upload to the private `system-data-plates` bucket.
- Photo metadata persistence in `hvac_system_photos`.
- System Decoder result persistence in `system_decode_results`.
- Optional copy-forward of confirmed decoder outputs into `hvac_systems`.

## Auth flow

1. New homeowner creates an account with name, ZIP, email, and password.
2. Supabase creates the auth user.
3. App upserts `profiles` using the auth user ID.
4. App creates the homeowner's first `homes` record using the ZIP code.
5. Auth state switches the user into the main app stack.

## My System save flow

1. User fills in visible equipment details.
2. User captures indoor and/or outdoor data plate photos.
3. App saves or updates the primary `hvac_systems` record.
4. App uploads local photos to private Supabase Storage.
5. App inserts photo metadata into `hvac_system_photos`.
6. App displays saved photos through short-lived signed URLs.

## Decoder save flow

1. User enters model/serial or captures a data plate photo.
2. Local decoder generates a confidence-scored result.
3. User taps **Save Result to My System**.
4. App creates a system profile if one does not already exist.
5. App optionally uploads the decoder photo.
6. App inserts a row into `system_decode_results`.
7. App copies age, tonnage, confidence, matched model, and matched serial into `hvac_systems`.

## Security model

- RLS is enabled on homeowner-owned tables.
- Storage object paths start with the authenticated user ID.
- Storage policies only allow a user to read/write files inside their own folder.
- The app uses signed URLs for photo display instead of public buckets.

## Current limitation

V5 does not yet run OCR on the data plate photo. The photo is saved and attached to the system profile; model/serial extraction is the next feature layer.

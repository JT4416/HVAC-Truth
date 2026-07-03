# Next Build Steps After V5

## 1. Test Supabase project setup

- Create a Supabase project.
- Run `backend/supabase/schema.sql` in the SQL editor.
- Confirm the `system-data-plates` storage bucket exists and is private.
- Add `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` to `app/.env`.

## 2. Run auth smoke tests

- Create a homeowner account.
- Confirm a row appears in `profiles`.
- Confirm a row appears in `homes`.
- Sign out.
- Sign back in.
- Confirm the session persists after app restart.

## 3. Run My System smoke tests

- Capture an indoor data plate photo.
- Capture an outdoor data plate photo.
- Save the profile.
- Confirm a row appears in `hvac_systems`.
- Confirm rows appear in `hvac_system_photos`.
- Confirm photo files exist under `system-data-plates/<user_id>/<system_id>/`.

## 4. Run System Decoder smoke tests

- Type a known test model and serial.
- Run the decoder.
- Save the result.
- Confirm a row appears in `system_decode_results`.
- Confirm decoded age and tonnage copy into `hvac_systems` when available.

## 5. Build V6

Recommended V6 scope:

- OCR/text extraction from data plate photos.
- Confirm extracted brand/model/serial before saving.
- Add indoor vs outdoor decoder source selection.
- Improve manufacturer rule research and verification.
- Add a contractor-ready equipment summary screen.

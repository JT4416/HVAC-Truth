# Next Build Steps After V4

## 1. Supabase authentication and profile persistence

Connect sign up, login, ZIP code, home record, and My System profile saves.

## 2. Save decoder results

When a homeowner taps Save Result to My System:

- Insert into `system_decode_results`.
- Copy confirmed age/size values into `hvac_systems`.
- Mark `homeowner_confirmed = true` after user confirmation.

## 3. Upload data plate photos

Upload data plate photos to private Supabase storage bucket `system-data-plates`.

Recommended path:

```text
<user_id>/<hvac_system_id>/decoder-<timestamp>.jpg
```

## 4. Add OCR extraction

After upload:

- Run OCR or AI extraction.
- Populate extracted model/serial candidates.
- Show confirmation screen before decoding.

## 5. Expand manufacturer decoder rules

Start with Goodman-family because the pattern is simpler, then build capacity-only rules across major brands. Age rules should stay low or unavailable until verified.

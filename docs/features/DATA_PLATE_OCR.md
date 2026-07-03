# V6 Feature: Data Plate OCR

## Goal

Help homeowners answer the two most common HVAC system questions:

1. How old is my system?
2. What size is my system?

The app now supports photo-based data plate extraction so the homeowner does not have to perfectly type long model and serial numbers.

## User flow

1. Homeowner opens **Decode My System**.
2. Homeowner chooses which label they are looking at:
   - Outdoor unit
   - Indoor unit
   - Not sure
3. Homeowner takes a picture of the visible data plate.
4. App sends the photo to the Supabase Edge Function `data-plate-ocr`.
5. OCR returns:
   - brand suggestion
   - model number suggestion
   - serial number suggestion
   - equipment type suggestion
   - refrigerant type, if visible
   - voltage, if visible
   - alternate candidates
   - warnings
6. Homeowner confirms or edits the model/serial fields.
7. Confirmed values feed the System Decoder.
8. Decode result and photo can be saved to **My System**.

## Product rule

OCR output is never treated as final truth. The homeowner must be shown the extracted fields and given a chance to confirm or correct them before the app decodes age/size or saves the result as confirmed profile data.

## Safety rule

The app must only ask the homeowner to photograph labels that are already visible. It must not instruct a homeowner to remove panels, open electrical compartments, reach around wiring, bypass switches, or touch refrigerant/electrical components.

## Files added

```text
app/src/domain/decoder/dataPlateExtraction.ts
app/src/services/dataPlateOcr.ts
backend/supabase/functions/data-plate-ocr/index.ts
docs/features/DATA_PLATE_OCR.md
```

## Files updated

```text
app/src/screens/SystemDecoderScreen.tsx
app/src/services/dataPlatePhotos.ts
app/src/services/profilePersistence.ts
backend/supabase/schema.sql
app/package.json
```

## Edge function setup

Set the OpenAI API key as a Supabase Edge Function secret:

```bash
supabase secrets set OPENAI_API_KEY=your_openai_api_key
```

Deploy the function:

```bash
supabase functions deploy data-plate-ocr
```

The function accepts either:

```json
{
  "imageBase64": "...",
  "homeownerHint": "Equipment side: outdoor"
}
```

or:

```json
{
  "storageBucket": "system-data-plates",
  "storagePath": "<user_id>/<hvac_system_id>/outdoor-123.jpg"
}
```

## Data saved

`hvac_system_photos` now stores:

- `ocr_text`
- `ocr_extraction`
- `ocr_status`
- `homeowner_confirmed`

`system_decode_results` now stores:

- `raw_ocr_text`
- `ocr_extraction`
- `equipment_side`

## Why this matters

Once HVAC Truth knows the confirmed model and serial number, the app can produce better:

- system age estimates
- system size estimates
- repair-vs-replace guidance
- quote fairness analysis
- warranty clue detection
- contractor handoff summaries

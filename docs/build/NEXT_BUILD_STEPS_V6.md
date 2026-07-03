# Next Build Steps After V6

## 1. Test Supabase Edge Function locally

Run the OCR function with a known data plate image and confirm it returns clean JSON.

Acceptance criteria:

- Function deploys successfully.
- Function returns strict JSON.
- App displays OCR suggestions.
- Manual correction still works when OCR fails.

## 2. Add OCR review event persistence

The schema includes `ocr_review_events`, but the app does not yet write a review event every time the homeowner corrects OCR output.

Build this next so HVAC Truth can learn where OCR is wrong.

## 3. Improve model/serial parsing

Expand `dataPlateExtraction.ts` with manufacturer-specific OCR cleanup rules.

Examples:

- O vs 0 correction only in numeric positions
- I vs 1 correction only in serial prefixes
- remove label noise like BTU, VOLTS, PHASE, HZ
- barcode text filtering

## 4. Add OCR confidence UI polish

Add a cleaner confirmation page:

- data plate photo preview
- extracted text panel
- high/medium/low confidence badges
- alternate candidate selector
- "I cannot read this label" option

## 5. Connect OCR feedback to decoder research

When a homeowner or contractor confirms a corrected model/serial number, use it to improve the manufacturer decoder rule database.

## 6. Build V7: Contractor-ready System Report

V7 should generate a homeowner-friendly and contractor-friendly system report:

- homeowner info
- ZIP code
- equipment photos
- indoor/outdoor model and serial
- decoded age and size
- confidence level
- quote history
- maintenance notes
- technician handoff questions

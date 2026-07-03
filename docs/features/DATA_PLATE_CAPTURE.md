# Data Plate Capture Feature

## Purpose

Homeowners often do not know their system model number, serial number, filter size, refrigerant type, tonnage, or age. The data plate/photo workflow lets HVAC Truth preserve the actual equipment record instead of relying on guesses.

## MVP behavior

The My System screen should allow the homeowner to capture and save:

1. Indoor unit data plate photo
2. Outdoor unit data plate photo
3. Indoor model number
4. Indoor serial number
5. Outdoor model number
6. Outdoor serial number
7. Brand
8. System type
9. Estimated age
10. Filter size
11. Notes and warranty notes

## Photo safety copy

Use this language near the camera flow:

> Take a photo only if the label is visible from a safe location. Do not remove panels, touch wiring, reach into the unit, or open electrical compartments.

## Data structure

Photos are stored privately in Supabase Storage bucket:

`system-data-plates`

Storage path format:

`<user_id>/<hvac_system_id>/<indoor|outdoor>-<timestamp>.jpg`

Photo metadata is stored in:

`public.hvac_system_photos`

Possible OCR/AI extraction results are stored in:

`public.data_plate_extractions`

The extraction flow should always require homeowner review before automatically overwriting the system profile.

## Recommended next implementation sequence

1. Wire Supabase auth.
2. Create profile and home record during onboarding.
3. Create the first HVAC system record from My System.
4. Upload indoor/outdoor data plate photos to private Supabase Storage.
5. Save metadata to `hvac_system_photos`.
6. Add optional OCR/AI extraction later.
7. Show extracted fields as suggestions, not final facts, until reviewed.

## Long-term intelligence

Once OCR/extraction is added, HVAC Truth can use the model/serial numbers to help estimate:

- Manufacture year
- Equipment size/tonnage
- Refrigerant type
- Whether repair vs replacement makes sense
- Warranty clues
- Quote fairness
- Common part categories
- Contractor questions to ask

## Important limitation

The app should not claim exact system age, refrigerant, tonnage, or warranty status from OCR unless the extraction is confirmed by the homeowner or a technician.

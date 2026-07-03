# Manufacturer Decoder Research Plan

## Goal

Build a verified manufacturer-specific decoder library for HVAC model and serial numbers.

## Initial manufacturer families

1. Goodman / Amana / Daikin / Janitrol
2. Carrier / Bryant / Payne / ICP brands
3. Lennox / Ducane / Armstrong / Concord
4. Trane / American Standard / RunTru
5. Rheem / Ruud / WeatherKing
6. York / Coleman / Luxaire / Guardian
7. Nortek / Nordyne / Frigidaire / Maytag / Tappan / Intertherm / Miller
8. Bosch
9. Mitsubishi Electric
10. Fujitsu
11. LG
12. Midea
13. Gree
14. MRCOOL

## Data needed per manufacturer

- Brand aliases and parent company relationships
- Equipment types covered
- Model number examples
- Serial number examples
- Capacity code location and meaning
- Date code location and meaning
- Production era differences
- Exceptions
- Verification source
- Confidence level
- Last verified date

## Verification hierarchy

1. Manufacturer documentation or support confirmation
2. OEM product literature and model nomenclature sheets
3. Distributor technical data sheets
4. Contractor service manuals
5. Internal technician-verified examples
6. Public decoder references, only as low-confidence supporting material

## Production rule approval

A rule should not become high-confidence until it has:

- At least three matching real examples, or
- Manufacturer documentation, or
- Internal expert validation from confirmed equipment data plates.

## Feedback loop

Use `decoder_feedback` to collect corrections from homeowners, technicians, and contractors. Feed corrections into rule review instead of automatically changing rules.

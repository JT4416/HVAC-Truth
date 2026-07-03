# HVAC Truth V4: System Age & Size Decoder

## Purpose

Most homeowners want two practical answers before they approve a repair or replacement:

1. How old is my HVAC system?
2. What size is my HVAC system?

The System Decoder lets the homeowner either take a picture of the data plate or manually type the brand, model number, and serial number. The app then uses manufacturer-specific rules to estimate system age and size.

## Product flow

1. User opens **Decode My System** from the dashboard or My System profile.
2. User takes a data plate photo or manually enters model/serial information.
3. OCR extraction will later suggest model and serial values from the photo.
4. User confirms or edits the extracted values.
5. Decoder rule engine evaluates model number and serial number.
6. App displays age, size, confidence level, reasoning, warnings, and save button.
7. Confirmed results save to the user system profile.

## Confidence model

The app must never overclaim manufacturer decoding accuracy. Every decode result gets one of these confidence labels:

- **High**: verified manufacturer or internal rule with clean match.
- **Medium**: recognizable pattern and brand family, but not yet manufacturer-confirmed.
- **Low**: likely size or age clue only; requires confirmation.
- **Unable**: no safe decode possible.

## MVP rule strategy

V4 includes starter rules, not final production-grade manufacturer warranty logic.

The safest initial production behavior is:

- Decode model-number capacity codes when a standard BTUH code is found.
- Decode serial-number age only when the rule is verified enough to show at least medium confidence.
- Display warnings for starter rules.
- Save raw model/serial/photo data for contractor review.

## Core outputs

For each decode, store:

- input brand
- input model number
- input serial number
- normalized model/serial
- estimated manufacture year/month
- estimated age years
- estimated tonnage
- estimated BTUH
- confidence
- confidence reasons
- warnings
- matched rule keys
- homeowner confirmation flag

## Why this matters

The decoder makes the rest of HVAC Truth smarter:

- Quote checker can factor in system age and tonnage.
- Repair-vs-replace guidance becomes more credible.
- Contractor handoff is cleaner.
- User system profile becomes useful instead of just decorative.
- Premium reports can include data plate photos and decoded equipment summaries.

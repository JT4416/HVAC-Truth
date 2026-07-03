# HVAC Truth App

**HVAC Truth** is a homeowner-focused mobile app designed to help everyday people understand their air conditioning system before they call a contractor, approve a repair, or replace equipment.

The app helps users troubleshoot common AC issues safely, decode model and serial numbers, store equipment data plate photos, check repair quotes, generate contractor-ready system reports, and find trusted local HVAC contractors by ZIP code.

## Project Status

Current build stage: **V10 — Live Contractor Discovery**

The MVP architecture now includes the foundation for:

- Homeowner onboarding
- HVAC system profile creation
- Indoor/outdoor data plate photo storage
- System age and size decoding
- Data plate OCR
- Quote checking
- Safe troubleshooting guidance
- Contractor-ready system reports
- Contractor lead request flow
- Contractor contact routing
- Live contractor discovery architecture

## Core Product Promise

**Know before you call.**

Most homeowners do not know how old their AC system is, what size it is, whether a repair quote is fair, or which contractor they can trust. HVAC Truth is designed to answer those questions in plain English while keeping homeowners away from unsafe HVAC work.

## Key Features

### Homeowner HVAC System Profile

Users can create and maintain a profile for their HVAC system, including:

- System type
- Brand
- Estimated age
- Estimated tonnage
- Filter size
- Refrigerant type
- Indoor model number
- Indoor serial number
- Outdoor model number
- Outdoor serial number
- Air handler location
- Access notes
- Warranty notes
- Service notes

### Data Plate Photo Capture

Homeowners can upload or capture photos of indoor and outdoor unit data plates. These photos are tied to the user's HVAC system profile and are used for OCR extraction, contractor reports, quote review, and equipment recordkeeping.

### System Age and Size Decoder

The app lets users take a photo of the data plate or manually enter model and serial numbers. It then estimates:

- Manufacture date
- System age
- Equipment size / tonnage
- Equipment type
- Confidence level
- Plain-English decoding explanation

Manufacturer-specific decoder rules are confidence-scored because model and serial number formats vary by manufacturer and production era.

### Data Plate OCR

The OCR flow extracts visible data plate text and suggests:

- Brand
- Model number
- Serial number
- Equipment type
- Refrigerant type
- Voltage, if visible

The user confirms or edits extracted values before they are saved.

### Safe Troubleshooting Guidance

The app provides homeowner-safe guidance for common AC issues such as warm air, no airflow, water leaks, frozen coils, thermostat issues, dirty filters, unusual smells, and outdoor unit problems.

The app clearly separates safe homeowner checks from work that requires a licensed technician.

### Quote Checker

The quote checker helps homeowners understand whether a repair quote appears low, fair, high, suspicious, or in need of further review. It also suggests questions to ask and red flags to watch for.

### Contractor-Ready System Report

The app can generate a contractor-ready report containing:

- ZIP code
- System type
- Brand
- System age
- System size
- Refrigerant type
- Filter size
- Indoor/outdoor model and serial numbers
- Data plate photo status
- Air handler location
- Access notes
- Homeowner issue summary
- Decoder confidence
- Quote history notes

This helps contractors provide better ballpark estimates remotely and better final pricing after verifying site conditions.

### Contractor Lead Request Flow

Homeowners can create a service request with:

- Service type
- Urgency
- Symptom summary
- Desired outcome
- Preferred contact method
- Preferred time window
- Attached system report
- Selected contractors

### Contractor Contact Routing

HVAC Truth does not assume every contractor has a public email address. The app chooses the best available contact route:

1. HVAC Truth verified contractor dashboard
2. Published email
3. Website contact form
4. Contractor website
5. Phone call with script
6. SMS script
7. Google or Yelp profile
8. No usable delivery route

### Live Contractor Discovery

The V10 architecture supports contractor discovery from:

- Google Places
- Yelp
- HVAC Truth verified contractors
- Manually seeded contractors
- Future contractor-claimed profiles

Ranking can factor in rating, review count, distance, emergency service, contact route availability, listing confidence, and HVAC Truth verification.

## Tech Stack

Current MVP direction:

- React Native mobile app
- Supabase backend
- Supabase Auth
- Supabase Postgres
- Supabase Storage for private data plate photos
- Supabase Edge Functions for server-side API calls
- OpenAI API for OCR/data plate extraction support
- Google Places API for contractor discovery
- Yelp Fusion API for contractor discovery
- Future Stripe integration for subscriptions and paid services

## Project Structure

```text
app/
  src/
    components/
    content/
    context/
    data/
    domain/
    screens/
    services/

backend/
  supabase/
    schema.sql
    functions/

docs/
  architecture/
  build/
  content/
  features/
  prompts/
  research/
```

## Environment Variables

The mobile app should only use public-safe environment values:

```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

Sensitive provider keys should stay server-side as Supabase secrets:

```bash
supabase secrets set OPENAI_API_KEY=your_openai_api_key
supabase secrets set GOOGLE_PLACES_API_KEY=your_google_places_key
supabase secrets set YELP_API_KEY=your_yelp_api_key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Supabase Edge Functions

Current planned Edge Functions:

```text
data-plate-ocr
contractor-discovery
```

Deploy examples:

```bash
supabase functions deploy data-plate-ocr
supabase functions deploy contractor-discovery
```

## Local Development

Install dependencies:

```bash
cd app
npm install
```

Create environment file:

```bash
cp .env.example .env
```

Start the app:

```bash
npx expo start
```

Expo is currently used for MVP speed. The architecture is being kept portable so the app can later move to bare React Native, Flutter, or native development if needed.

## Safety Principles

HVAC Truth should never instruct homeowners to perform unsafe work.

The app should not tell users to:

- Open live electrical panels
- Bypass safety switches
- Handle refrigerant
- Cut or braze refrigerant lines
- Replace electrical components without proper training
- Jump contactors
- Disable float switches
- Ignore burning smells
- Keep running a frozen system
- Pour unsafe chemicals into drain lines

The app should recommend a licensed technician when there is:

- Burning smell
- Electrical arcing
- Refrigerant leak suspicion
- Compressor failure
- Repeated breaker trips
- Frozen coil that returns after thawing
- Major water damage
- No cooling after safe homeowner checks

## Product Philosophy

HVAC Truth is not meant to replace licensed HVAC contractors.

It is meant to:

- Educate homeowners
- Reduce confusion
- Improve contractor communication
- Help users recognize fair pricing
- Help contractors receive better information before dispatch
- Reduce wasted trips
- Build trust between homeowners and honest HVAC professionals

## Future Roadmap

### V11 — Contractor Profile Claiming

Contractors can claim their business profile, verify service area, select lead preferences, and receive direct HVAC Truth leads.

### V12 — Contractor Dashboard

Contractors can view leads, reports, homeowner system details, and lead status.

### V13 — Paid Homeowner Features

Premium quote review, unlimited system reports, extended decoding, warranty clues, and second-opinion workflows.

### V14 — Contractor Monetization

Verified contractor badges, premium placement based on trust rules, lead subscriptions, and service-area targeting.

### V15 — Repair-vs-Replace Advisor

Uses system age, size, issue type, quote amount, refrigerant type, and contractor report data to help users understand whether repair or replacement may make more sense.

## Short Description

HVAC Truth is a homeowner-focused mobile app that helps users decode their AC system, troubleshoot safely, check repair quotes, store equipment data, generate contractor-ready reports, and find trusted local HVAC pros before making repair decisions.

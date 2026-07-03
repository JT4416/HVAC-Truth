# V10 Feature: Live Contractor Discovery

HVAC Truth separates contractor discovery from contractor lead delivery.

Discovery answers:

- Which HVAC contractors are near this ZIP code?
- How strong are their public ratings and review counts?
- Are they close enough to be practical?
- Do they appear to offer emergency service?
- Are they already HVAC Truth verified?
- What public contact channels are available?

Lead delivery answers:

- Can HVAC Truth send directly to a claimed contractor dashboard?
- Is there a published email?
- Is there a contact/request-service page?
- Is there a website only?
- Is phone the best available route?
- Does the homeowner need to manually paste the standardized request?

## Architecture

The mobile app calls a Supabase Edge Function:

```text
contractor-discovery
```

The Edge Function can search:

1. HVAC Truth verified/internal contractors
2. Google Places
3. Yelp
4. manually seeded contractors
5. future contractor-claimed profiles

Provider API keys stay on the server side. They should never be shipped in the mobile app.

## Mobile app files

```text
app/src/services/contractorDiscovery.ts
app/src/screens/ContractorFinderScreen.tsx
```

## Backend files

```text
backend/supabase/functions/contractor-discovery/index.ts
backend/supabase/schema.sql
```

## Search result scoring

V10 scores contractor candidates with a simple MVP trust score:

- rating strength
- review count
- distance
- verified listing status
- emergency service flag
- HVAC Truth verification
- usable contact route

This score is not a final production ranking algorithm. It is intentionally readable and easy to adjust.

## Result fields

Each contractor result can include:

- business name
- phone
- website
- contact page URL
- published email, only if actually known
- Google Place ID
- Google Maps URL
- Yelp Business ID
- Yelp URL
- rating
- review count
- distance
- categories
- address
- emergency flag
- HVAC Truth verified flag
- trust score
- trust score reasons
- best contact route

## Provider setup

Deploy the Edge Function:

```bash
supabase functions deploy contractor-discovery
```

Set secrets:

```bash
supabase secrets set GOOGLE_PLACES_API_KEY=your_google_places_key
supabase secrets set YELP_API_KEY=your_yelp_api_key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

The app falls back to demo contractors until provider keys and the Edge Function are configured.

## Production notes

Do not scrape contractor websites aggressively from the mobile app. For MVP, use provider APIs and public business listing data. Later, contact-page discovery can be handled by a compliant backend job that respects robots.txt, terms of service, rate limits, and CAPTCHA boundaries.

Do not assume every business has an email. Many will only have a phone number, website, Google profile, Yelp profile, or embedded booking widget.

## Long-term contractor flywheel

1. Homeowner discovers contractors from public listings.
2. HVAC Truth prepares a standardized contractor-ready packet.
3. Homeowner routes the packet through the best available public contact channel.
4. Contractor sees higher-quality leads.
5. Contractor claims HVAC Truth profile.
6. Claimed contractors receive direct dashboard leads.
7. HVAC Truth improves lead quality and contractor trust scoring over time.

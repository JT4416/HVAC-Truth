# Next Build Steps After V10

## Immediate testing

1. Run the latest schema in Supabase.
2. Deploy the `contractor-discovery` Edge Function.
3. Add provider secrets for Google Places and/or Yelp.
4. Test ZIP code search in the app.
5. Confirm that results fall back to demo contractors when the function or provider keys are missing.
6. Confirm that each contractor displays a best contact route.

## Next product build: V11 Contractor Profile Claiming

V11 should add the contractor-side path:

- contractor claim request
- business verification fields
- service area setup
- lead preference setup
- contractor dashboard lead inbox foundation
- direct lead delivery for verified contractors
- homeowner trust badge rules

## Provider-hardening backlog

- cache provider search results by ZIP code and category
- dedupe Google/Yelp/internal contractors more aggressively
- normalize phone numbers
- normalize addresses
- add service-area radius logic
- improve emergency-service detection
- add license verification fields by state
- create contractor quality audit queue
- store provider attribution requirements for display compliance

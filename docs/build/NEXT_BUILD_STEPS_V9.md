# Next Build Steps after V9

## V10 recommended build: Live Contractor Discovery

The next build should replace the demo contractor list with a provider abstraction that can later support Google Places, Yelp, internal verified contractors, and manual seed contractors.

## V10 tasks

1. Create `contractorDiscovery.ts` service.
2. Add contractor provider interface:
   - searchByZip(zipCode, serviceType)
   - getBusinessDetails(providerId)
   - normalizeContractorResult(rawResult)
3. Add Google Places-ready normalized fields:
   - provider
   - provider_place_id
   - business_name
   - phone
   - website
   - rating
   - review_count
   - distance
   - categories
   - google_maps_url
4. Add Yelp-ready normalized fields:
   - yelp_business_id
   - yelp_business_url
   - rating
   - review_count
   - categories
5. Feed normalized contractor records into existing V9 contact routing.
6. Preserve the rule that ratings discovery is not the same as lead delivery.

## V10 production caution

Do not scrape contact forms blindly. Use official APIs where possible, contractor-owned published contact details, and homeowner-assisted routing until contractors claim profiles.

# V11: Contractor Profile Claiming

V11 adds the first contractor-side marketplace feature to HVAC Truth.

The goal is to let legitimate HVAC contractors claim their public listing, verify their business, define where they work, and choose how they want to receive leads.

## Why this matters

Before V11, HVAC Truth could discover contractors from public sources and route homeowner lead packets through whatever public contact method was available.

That works for an MVP, but it is not the long-term contractor marketplace.

The better long-term path is:

1. Discover contractors from Google, Yelp, seeded data, and internal sources.
2. Let contractors claim their profile.
3. Verify that the claimant is authorized to represent the company.
4. Let verified contractors receive direct HVAC Truth leads.
5. Build monetization around verified profiles, lead delivery, and service-area targeting.

## Homeowner impact

Verified contractor profiles can eventually improve homeowner trust by showing:

- verified business status
- service areas
- emergency service availability
- preferred contact method
- license information where available
- HVAC Truth response history
- accepted lead status

## Contractor claim form

The V11 form captures:

- business name
- website
- license number
- authorized contact name
- authorized contact role
- contact email
- contact phone
- service ZIP codes
- service radius
- emergency service availability
- lead delivery preferences
- verification notes

## Lead delivery preferences

Contractors can choose any combination of:

- HVAC Truth dashboard
- email
- phone
- text / SMS
- website contact form

The long-term best route is the HVAC Truth contractor dashboard, but V11 keeps other routes available because contractors will onboard gradually.

## Claim statuses

Claims use this lifecycle:

```text
draft
submitted
needs_review
verified
rejected
```

## Database objects

V11 adds:

```text
contractor_profile_claims
contractor_service_areas
contractor_lead_preferences
```

It also expands `contractors` with:

```text
claimed_by_user_id
claimed_at
verification_status
verified_at
lead_preferences
service_zip_codes
```

## Security notes

- Homeowners and contractors must be signed in before submitting a profile claim.
- A signed-in user can read their own claims.
- A signed-in user can update claims only while they are draft or need more information.
- Public users can read active service areas and lead preferences.
- Admin review and claim approval should be added as a separate secure admin workflow.

## Review workflow planned for later

A future admin or internal operation should:

1. Review submitted claim.
2. Verify business website, license number, email domain, and phone.
3. Confirm the claimant is authorized.
4. Link the claim to an existing contractor listing or create a new listing.
5. Copy service ZIPs and lead preferences into contractor tables.
6. Set `hvac_truth_verified = true` when verification is complete.
7. Enable direct dashboard lead delivery when the contractor accepts that route.

## Product rule

A contractor should not receive the HVAC Truth verified badge merely because they submitted a claim.

The claim is only a request. Verification is a separate review step.

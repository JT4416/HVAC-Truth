# V16 — Search Result to Lead Request

V16 connects contractor finder results directly into the homeowner lead request flow.

## Purpose

V15 made live contractor discovery results persist to real contractor records and return contractor IDs to the app.

V16 lets the homeowner select one of those search results and carry it into the lead request screen instead of starting from the MVP demo contractor list.

## What V16 Adds

V16 adds a direct path:

```text
ContractorFinderScreen -> ContractorLeadRequestScreen
```

When the homeowner taps `Request Help` on a contractor search result, the app sends that contractor into the lead request route.

## Preserved Contractor Data

The selected contractor carries:

```text
contractorId
businessName
phone
website
contactPageUrl
publishedEmail
googlePlaceId
googleMapsUrl
yelpBusinessUrl
rating
reviewCount
distanceMiles
verified
emergencyService
hvacTruthVerified
acceptsDashboardLeads
acceptsEmailLeads
acceptsSmsLeads
```

## Lead Request Behavior

If the lead request screen receives a selected contractor from search:

- It replaces the MVP demo list with that contractor.
- It preselects that contractor.
- It shows a “started from contractor search” card.
- It keeps the contractor ID visible in the contractor card.
- It uses the V14 routing helper to decide dashboard delivery versus public-contact routing.

If no contractor is passed, the screen still falls back to the MVP demo list.

## Relationship to V14

V14 decides whether a selected contractor is eligible for direct dashboard delivery.

V16 gives V14 real persisted contractor data from the search result.

## Relationship to V15

V15 creates or reuses contractor records during discovery.

V16 carries those persisted records into lead submission.

## Files Updated

```text
app/App.tsx
app/src/screens/ContractorFinderScreen.tsx
app/src/screens/ContractorLeadRequestScreen.tsx
README.md
```

## Files Added

```text
docs/features/SEARCH_RESULT_TO_LEAD_REQUEST.md
docs/build/NEXT_BUILD_STEPS_V16.md
```

## MVP Limitation

The selected contractor is passed through navigation state. Later versions should persist a selected-contractor draft or lead intent so users can leave and return without losing the selected contractor context.

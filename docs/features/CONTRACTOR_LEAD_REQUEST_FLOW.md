# Contractor Lead Request Flow

V8 adds the first homeowner-to-contractor handoff flow.

## Goal

Help a homeowner send a cleaner request than a normal web lead form. The request includes the system profile, decoded equipment details, data plate status, air handler location, access notes, symptoms, urgency, contact preference, and selected contractors.

This improves remote ballpark pricing because the contractor can see the important variables before dispatching:

- ZIP code / service area
- equipment type
- estimated system age
- estimated system size
- model and serial numbers
- air handler location
- access notes
- homeowner symptom summary
- urgency
- preferred contact method
- attached contractor-ready report snapshot

## User flow

1. Homeowner taps **Request Contractor Help**.
2. Homeowner chooses service type.
3. Homeowner enters symptom summary and desired outcome.
4. Homeowner chooses urgency and contact preference.
5. Homeowner decides whether to attach the contractor-ready system report.
6. Homeowner selects one or more contractors.
7. Homeowner reviews the lead preview.
8. Homeowner submits the request.
9. App creates a `contractor_lead_requests` record.
10. App creates one `contractor_lead_recipients` record for each selected contractor.

## MVP limitation

V8 uses a demo contractor list in the mobile app. The next production step is to replace the demo list with contractors from the database or a contractor search provider.

## Database tables

### `contractor_lead_requests`

Stores the homeowner request, lead summary, selected contractor JSON, and attached report snapshot.

### `contractor_lead_recipients`

Stores one recipient row for each selected contractor so the app can track status independently.

Recipient statuses can later support:

- selected
- sent
- viewed
- responded
- accepted
- declined
- scheduled
- closed

## Safety and trust rules

- The app should not promise a final price from a remote request.
- The app should clearly say a firm quote requires field verification.
- Contractor ranking should remain trust-first, not pay-to-win.
- Paid contractor placement should not override license, complaint, review, or homeowner feedback signals.

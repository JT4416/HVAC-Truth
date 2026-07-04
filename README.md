# HVAC Truth MVP Starter

HVAC Truth is a homeowner-focused HVAC assistant app: troubleshooting, quote checking, contractor finding, maintenance education, safe AI guidance, contractor lead routing, and verified contractor dashboard delivery.

## MVP Stack

- Mobile: React Native + Expo
- Backend/Auth/DB: Supabase
- AI: OpenAI API through backend or Supabase Edge Functions
- Contractor discovery: Supabase Edge Function with Google Places/Yelp provider support
- Payments: Stripe later, after beta validation

## Local Setup

```bash
cd app
npm install
cp .env.example .env
npx expo start
```

Fill in Supabase and API values in `app/.env`.

## Important Safety Boundary

HVAC Truth helps homeowners understand, document, and ask better questions. It must not guide users through dangerous electrical, refrigerant, gas, combustion, or code-sensitive repairs.

## Current Build Stage

Current stage: **V16 — Search Result to Lead Request**.

The app can now search contractors, persist provider results to real contractor records, select a specific contractor from the finder, and carry that contractor into the homeowner lead request flow with ID, verification, dashboard lead, and contact-route data preserved.

## Build History

### V1-V2 — MVP Foundation

- App navigation and homeowner dashboard
- Basic troubleshooting screen
- Contractor finder placeholder
- Quote checker
- Maintenance tips
- Ask HVAC Truth placeholder
- Supabase starter schema
- Homeowner safety guardrails

### V3 — Data Plate Photo Capture

- Indoor/outdoor data plate photo capture
- System photo metadata
- Private Supabase Storage plan

### V4 — System Age & Size Decoder

- Brand/model/serial input
- Starter size and age decoding
- Confidence scoring
- Manufacturer decoder rule framework

### V5 — Supabase Auth + Profile Persistence

- Email/password authentication
- Persistent app session
- Profile and primary home creation
- My System save/load
- Private data plate upload

### V6 — Data Plate OCR

- Data plate OCR service
- OpenAI-backed Edge Function plan
- Homeowner confirmation before saving OCR values

### V7 — Contractor-Ready System Report

- Air handler location
- Air handler access notes
- Contractor-ready report snapshot
- Ballpark-estimate context for contractors

### V8 — Contractor Lead Request Flow

- Homeowner service request form
- Service type, urgency, contact preference, and symptom summary
- Contractor report snapshot attached to lead request
- `contractor_lead_requests`
- `contractor_lead_recipients`

### V9 — Contractor Contact Routing

- Separates discovery from delivery
- Supports verified dashboard, published email, website/contact form, website, phone, SMS, Google/Yelp profile, and no-route states
- Generates a standardized lead packet and phone script

### V10 — Live Contractor Discovery

- Provider-ready contractor discovery Edge Function
- Google Places/Yelp support
- Server-side API keys
- Discovery run and search result tables

Deploy:

```bash
supabase functions deploy contractor-discovery
```

Set provider secrets:

```bash
supabase secrets set GOOGLE_PLACES_API_KEY=your_google_places_key
supabase secrets set YELP_API_KEY=your_yelp_api_key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### V11 — Contractor Profile Claiming

- Contractor profile claim screen
- Claim service
- Claim migration
- Contractors submit business info, contact info, service ZIPs, emergency status, and lead preferences

### V12 — Contractor Dashboard

- Verified contractor dashboard
- Lead detail screen
- Lead preferences screen
- Contractor notes and activity
- Dashboard access gated by verified dashboard user rows

### V13 — Contractor Claim Review

- Internal claim review screen
- Claim detail decision screen
- Approval, needs-review, and rejection decisions
- Approval creates/updates contractor profile
- Approval activates verified contractor dashboard access

Run the V13 migration, then bootstrap the first reviewer:

```sql
insert into public.app_admin_users (user_id, role, active)
values ('<profile_uuid>', 'owner', true);
```

### V14 — Verified Dashboard Lead Routing

- Verified routing helper
- Homeowner lead submission routes eligible contractors to dashboard
- Unverified contractors remain on public-contact routing
- Dashboard delivery tracking fields

Run:

```text
backend/supabase/migrations/20260703_v14_verified_dashboard_lead_routing.sql
```

Direct dashboard delivery requires:

- HVAC Truth verification
- dashboard lead acceptance
- a real contractor profile ID

### V15 — Persisted Contractor Discovery

- Searches internal contractor records
- Searches Google Places/Yelp when configured
- Deduplicates provider results
- Matches or creates contractor records
- Preserves HVAC Truth verification and dashboard lead flags
- Returns `contractorId`, `persisted`, and `matchMethod` to the app
- Shows persisted record status in the contractor finder screen

Run:

```text
backend/supabase/migrations/20260703_v15_persisted_contractor_discovery.sql
```

Then deploy:

```bash
supabase functions deploy contractor-discovery
```

### V16 — Search Result to Lead Request

V16 connects contractor finder selections into the homeowner lead request flow.

New V16 files:

```text
docs/features/SEARCH_RESULT_TO_LEAD_REQUEST.md
docs/build/NEXT_BUILD_STEPS_V16.md
```

Updated V16 files:

```text
app/App.tsx
app/src/screens/ContractorFinderScreen.tsx
app/src/screens/ContractorLeadRequestScreen.tsx
README.md
```

V16 behavior:

- `Request Help` on a search result navigates to `ContractorLeadRequest`.
- The selected contractor is passed through navigation state.
- The lead request screen replaces the demo list with the selected contractor.
- The selected contractor is preselected.
- Contractor ID, verification state, dashboard lead flags, contact route data, and provider source data are preserved.
- If no contractor is passed, the MVP demo list still works as a fallback.

## Next Recommended Build

**V17 — Troubleshooting Workflow Engine**

Build deeper symptom-specific homeowner troubleshooting flows and attach the results to contractor reports and lead packets.

## Active Repository

```text
https://github.com/JT4416/HVAC-Truth
```

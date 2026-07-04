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

Current stage: **V20 — Troubleshooting to Lead Conversion**.

The app now lets homeowners complete a safe troubleshooting workflow and move directly into a contractor lead request. The lead request opens with the saved troubleshooting session preselected, troubleshooting attachment enabled, and service type, urgency, symptom summary, and desired outcome prefilled from the workflow result.

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

- `Request Help` on a search result navigates to `ContractorLeadRequest`
- Selected contractor is passed through navigation state
- Lead request screen replaces the demo list with the selected contractor
- Contractor ID, verification state, dashboard lead flags, contact route data, and provider source data are preserved

### V17 — Troubleshooting Workflow Engine

- Replaced the simple troubleshooting evaluator with a homeowner-safe workflow engine
- Added the priority both-units-off float switch / drain / emergency pan workflow
- Added no cooling, water leak, frozen coil, weak airflow, odor, noise, and quote validation workflows
- Added safety gates for no electrical testing, no refrigerant work, no bypassing safeties, and no combustion work

Run:

```text
backend/supabase/migrations/20260703_v17_troubleshooting_workflow_engine.sql
```

### V18 — Troubleshooting Session Persistence

- Saves completed troubleshooting sessions to Supabase
- Shows recent troubleshooting sessions on the troubleshooting screen
- Adds the latest saved troubleshooting session to the contractor-ready report
- Adds the latest saved troubleshooting snapshot to lead request report snapshots
- Shows attached troubleshooting context in the contractor dashboard lead packet

### V19 — Troubleshooting Session Controls

V19 gives homeowners control over saved troubleshooting sessions and contractor visibility.

New V19 files:

```text
app/src/screens/TroubleshootingSessionDetailScreen.tsx
backend/supabase/migrations/20260703_v19_troubleshooting_session_controls.sql
docs/features/TROUBLESHOOTING_SESSION_CONTROLS.md
docs/build/NEXT_BUILD_STEPS_V19.md
```

Updated V19 files:

```text
app/App.tsx
app/src/screens/TroubleshootingScreen.tsx
app/src/screens/ContractorLeadRequestScreen.tsx
app/src/services/troubleshootingSessions.ts
README.md
```

V19 behavior:

- Opens saved troubleshooting sessions from history.
- Lets homeowners label sessions.
- Lets homeowners attach or hide sessions from contractor reports.
- Lets homeowners attach or hide sessions from lead packets.
- Lets homeowners archive sessions so they are hidden from active handoff flows.
- Lets homeowners choose the exact session to attach during lead request submission.
- Shows a troubleshooting packet preview before submission.
- Recommends a troubleshooting workflow based on service type.

Run after V17 migration:

```text
backend/supabase/migrations/20260703_v19_troubleshooting_session_controls.sql
```

### V20 — Troubleshooting to Lead Conversion

V20 lets a completed or saved troubleshooting workflow directly start a contractor lead request.

New V20 files:

```text
docs/features/TROUBLESHOOTING_TO_LEAD_CONVERSION.md
docs/build/NEXT_BUILD_STEPS_V20.md
```

Updated V20 files:

```text
app/App.tsx
app/src/screens/TroubleshootingScreen.tsx
app/src/screens/TroubleshootingSessionDetailScreen.tsx
app/src/screens/ContractorLeadRequestScreen.tsx
app/src/services/troubleshootingSessions.ts
README.md
```

V20 behavior:

- Adds **I Tried This, Now Request Help** after completed troubleshooting results.
- Saves the troubleshooting session during direct conversion when needed.
- Adds the same direct lead action from saved troubleshooting session detail.
- Routes to `ContractorLeadRequest` with `troubleshootingSessionId` and `leadDefaults`.
- Prefills service type, urgency, symptom summary, and desired outcome from the troubleshooting session.
- Preselects the saved troubleshooting session and enables lead packet attachment.
- Lets homeowners use any selected troubleshooting session to refill lead details.
- Keeps all homeowner safety boundaries unchanged.

No new migration is required for V20.

## Next Recommended Build

**V21 — Contractor Packet Intelligence**

Make contractor lead packets workflow-specific, add contractor-facing severity explanations, and add homeowner-safe photo prompts before lead submission.

## Active Repository

```text
https://github.com/JT4416/HVAC-Truth
```

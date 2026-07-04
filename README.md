# HVAC Truth MVP Starter

HVAC Truth is a homeowner-focused HVAC assistant app: troubleshooting, quote checking, contractor finding, maintenance education, safe AI guidance, contractor lead routing, verified contractor dashboard delivery, contractor-ready photo packet handoffs, packet completeness scoring, verified contractor participation controls, and delivery-method based contractor routing.

## MVP Stack

- Mobile: React Native + Expo
- Backend/Auth/DB: Supabase
- AI: OpenAI API through backend or Supabase Edge Functions
- Contractor discovery: Supabase Edge Function with Google Places/Yelp provider support
- Storage: Supabase Storage for homeowner system photos and contractor packet photos
- Payments: Stripe later, after beta validation

## Local Setup

```bash
cd app
npm install
cp .env.example .env
npm run typecheck
npm start
```

Fill in Supabase and API values in `app/.env`.

## Important Safety Boundary

HVAC Truth helps homeowners understand, document, and ask better questions. It must not guide users through dangerous electrical, refrigerant, gas, combustion, or code-sensitive repairs.

## Current Build Stage

Current stage: **V28 — Local Validation and Supabase Migration Hardening**.

V28 adds repeatable local TypeScript validation setup and documents the Supabase migration compatibility review needed before production database application. The repository now includes `app/tsconfig.json` and an `npm run typecheck` script.

## Core Marketplace Rule

```text
Verified contractors are either in or out of the HVAC Truth verified network.
They may set operating limits.
They may not cherry-pick request categories.
Packet score remains informational only.
```

Allowed contractor/admin controls:

```text
- service area
- emergency availability
- temporary pause status
- pause reason
- daily capacity limit
- weekly capacity limit
- active / inactive / paused / suspended participation status
- delivery methods such as dashboard, email, phone, SMS, and website contact form
```

Not allowed:

```text
- only replacement estimates
- only easy calls
- only high-score packets
- only quote checks
- only no-cooling calls
- only high-dollar calls
```

## Build History Summary

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
- Contractors submit business info, contact info, service ZIPs, emergency status, and delivery methods

### V12 — Contractor Dashboard

- Verified contractor dashboard
- Lead detail screen
- Contractor participation/settings screen
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

### V15 — Persisted Contractor Discovery

- Searches internal contractor records
- Searches Google Places/Yelp when configured
- Deduplicates provider results
- Matches or creates contractor records
- Preserves HVAC Truth verification and dashboard lead flags
- Returns `contractorId`, `persisted`, and `matchMethod` to the app

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
- Contractor ID, verification state, dashboard flags, contact route data, and provider source data are preserved

### V17 — Troubleshooting Workflow Engine

- Replaced the simple troubleshooting evaluator with a homeowner-safe workflow engine
- Added safe workflows for no cooling, water leak, frozen coil, weak airflow, odor, noise, and quote validation
- Added safety gates for no electrical testing, no refrigerant work, no bypassing safeties, and no combustion work

Run:

```text
backend/supabase/migrations/20260703_v17_troubleshooting_workflow_engine.sql
```

### V18 — Troubleshooting Session Persistence

- Saves completed troubleshooting sessions to Supabase
- Shows recent troubleshooting sessions on the troubleshooting screen
- Adds saved troubleshooting snapshots to contractor reports and lead request packets

### V19 — Troubleshooting Session Controls

- Opens saved troubleshooting sessions from history
- Lets homeowners label, archive, attach, or hide sessions from contractor reports and lead packets
- Lets homeowners choose the exact session to attach during lead request submission

Run after V17 migration:

```text
backend/supabase/migrations/20260703_v19_troubleshooting_session_controls.sql
```

### V20 — Troubleshooting to Lead Conversion

- Adds **I Tried This, Now Request Help** after completed troubleshooting results
- Routes to `ContractorLeadRequest` with saved troubleshooting context
- Prefills service type, urgency, symptom summary, and desired outcome

No new migration is required for V20.

### V21 — Contractor Packet Intelligence

- Adds workflow-specific contractor handoff intelligence
- Adds severity explanations, professional verification focus, safety summaries, and safe photo prompts
- Embeds packet intelligence into lead reports and contractor dashboard detail

No new migration is required for V21.

### V22 — Photo Capture for Contractor Packets

- Turns safe photo prompts into homeowner upload/status controls
- Uploads packet photos to private Supabase Storage
- Shows photo status in lead summaries and dashboard detail

Run:

```text
backend/supabase/migrations/20260704_v22_contractor_packet_photo_storage.sql
```

### V23 — Contractor Packet Review and Scoring

- Scores contractor packet completeness before submission and inside contractor dashboard lead detail
- Adds badges: Complete, Strong, Needs details, and Thin
- Packet score is informational only

No new migration is required for V23.

### V24 — Verified Contractor Participation Rules

- Adds verified contractor participation rules service
- Uses active participation plus operating limits for verified dashboard routing
- Allows service area, emergency availability, pause status, and capacity limits
- Keeps packet score informational

Run:

```text
backend/supabase/migrations/20260704_v24_verified_contractor_participation.sql
```

### V25 — Participation Admin Controls

- Adds `getParticipationContractors()` and `getParticipationContractor(contractorId)`
- Adds `updateContractorParticipation(input)`
- Adds `buildAdminParticipationSummary(contractor, zipCode)`
- Adds admin policy/RPC support for participation updates
- Adds activity/event logging for participation changes

Run after V24:

```text
backend/supabase/migrations/20260704_v25_participation_admin_controls.sql
```

### V26 — Participation Control Screens

- Added admin participation contractor list screen
- Added admin participation detail editor screen
- Added active / inactive / paused / suspended status controls
- Added pause reason, service ZIP, emergency availability, and lead capacity controls
- Reworked contractor-facing copy from **Lead Preferences** to **Participation Settings**

### V27 — Delivery Method Cleanup

- Added `app/src/services/contractorDeliveryMethods.ts`
- Added `backend/supabase/migrations/20260704_v27_delivery_method_cleanup.sql`
- Added docs for delivery method cleanup
- Updated contractor claim, claim review, and participation settings copy to say delivery methods instead of lead preferences
- Preserved legacy compatibility paths

Run after V25:

```text
backend/supabase/migrations/20260704_v27_delivery_method_cleanup.sql
```

### V28 — Local Validation and Supabase Migration Hardening

New V28 files:

```text
app/tsconfig.json
docs/build/V28_VALIDATION_AND_MIGRATION_HARDENING.md
```

Updated V28 files:

```text
app/package.json
README.md
```

V28 behavior:

- Adds a repeatable `npm run typecheck` command.
- Adds a strict Expo-compatible TypeScript configuration.
- Documents Supabase migration compatibility checks for V25 and V27.
- Identifies that local TypeScript, Expo, and Supabase CLI validation still need to be run outside the GitHub connector environment.

## Next Recommended Build

**V29 — Claim Review RPC Delivery Method Write-Through**

Recommended next work:

- Update claim approval database flow so approved claims write directly to `contractor_delivery_methods`.
- Preserve legacy compatibility fields during the transition period.
- Run local `npm run typecheck` and Expo validation.
- Run migrations in a clean Supabase branch or staging project.

## Active Repository

```text
https://github.com/JT4416/HVAC-Truth
```

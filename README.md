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

Current stage: **V31 — Claim Approval Harness Expansion and App Read Verification**.

V31 expands V30 with SQL negative-path coverage for claim review approval and adds app-side delivery-method read verification helpers. The app delivery-method service now reports whether rows came from the new `contractor_delivery_methods` table or the legacy `contractor_lead_preferences` fallback path.

## Core Marketplace Rule

```text
Verified contractors are either in or out of the HVAC Truth verified network.
They may set operating limits.
They may configure delivery/contact routes.
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

Bootstrap the first reviewer after running the V13 migration:

```sql
insert into public.app_admin_users (user_id, role, active)
values ('<profile_uuid>', 'owner', true);
```

### V14-V16 — Verified Routing and Search-to-Lead Flow

- Verified dashboard lead routing
- Persisted contractor discovery
- Search result to lead request flow
- Selected contractor metadata preserved through lead submission

### V17-V21 — Troubleshooting Workflow and Contractor Packet Intelligence

- Homeowner-safe troubleshooting workflow engine
- Troubleshooting session persistence and controls
- Troubleshooting-to-lead conversion
- Workflow-specific contractor handoff intelligence
- Severity explanations, safety summaries, professional verification focus, and safe photo prompts

### V22 — Photo Capture for Contractor Packets

- Turns safe photo prompts into homeowner upload/status controls
- Uploads packet photos to private Supabase Storage
- Shows photo status in lead summaries and dashboard detail

### V23 — Contractor Packet Review and Scoring

- Scores contractor packet completeness before submission and inside contractor dashboard lead detail
- Adds badges: Complete, Strong, Needs details, and Thin
- Packet score is informational only

### V24 — Verified Contractor Participation Rules

- Adds verified contractor participation rules service
- Uses active participation plus operating limits for verified dashboard routing
- Allows service area, emergency availability, pause status, and capacity limits
- Keeps packet score informational

### V25 — Participation Admin Controls

- Adds admin participation read/update services
- Adds admin policy/RPC support for participation updates
- Adds activity/event logging for participation changes

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

### V28 — Local Validation and Supabase Migration Hardening

- Added `app/tsconfig.json`
- Added `docs/build/V28_VALIDATION_AND_MIGRATION_HARDENING.md`
- Added repeatable `npm run typecheck` command
- Added strict Expo-compatible TypeScript configuration
- Documented Supabase migration compatibility checks for V25 and V27

### V29 — Claim Review RPC Delivery Method Write-Through

- Added `backend/supabase/migrations/20260704_v29_claim_review_delivery_method_write_through.sql`
- Added `docs/build/V29_CLAIM_REVIEW_DELIVERY_METHOD_WRITE_THROUGH.md`
- Replaced `public.review_contractor_profile_claim(...)`
- Approved claims now write to `public.contractor_delivery_methods`
- Legacy compatibility rows are still written to `public.contractor_lead_preferences`
- Contractor-level legacy delivery fields remain populated during the transition
- Verified dashboard access, contractor service areas, and verified contractor status are preserved

### V30 — Staging Validation and Claim Approval Test Harness

- Added `backend/supabase/tests/v30_claim_review_delivery_method_write_through_test.sql`
- Added `docs/build/V30_STAGING_VALIDATION_AND_TEST_HARNESS.md`
- Added rollback-safe positive-path SQL harness for local/staging Supabase validation
- Validates contractor verification, dashboard access, service areas, new delivery-method rows, legacy compatibility rows, and destination mapping

### V31 — Claim Approval Harness Expansion and App Read Verification

New V31 files:

```text
backend/supabase/tests/v31_claim_review_negative_paths_and_read_verification.sql
app/src/services/contractorDeliveryMethods.fixture.ts
docs/build/V31_CLAIM_APPROVAL_HARNESS_EXPANSION_AND_APP_READ_VERIFICATION.md
```

Updated V31 files:

```text
app/src/services/contractorDeliveryMethods.ts
README.md
```

V31 behavior:

- Adds negative-path SQL harness checks for unauthorized reviewer, invalid decision, and missing claim.
- Runs a positive claim approval after negative-path checks.
- Verifies new delivery-method rows are available from `contractor_delivery_methods`.
- Keeps the rollback-safe harness pattern.
- Adds app-side read result source metadata: `contractor_delivery_methods` or `contractor_lead_preferences`.
- Adds a typechecked fixture that validates preferred new-table reads, legacy fallback normalization, and delivery-method summary formatting.

Run after V29 in a local, staging, or clean Supabase branch:

```bash
psql "$SUPABASE_DB_URL" -f backend/supabase/tests/v31_claim_review_negative_paths_and_read_verification.sql
```

Or paste the script into Supabase SQL editor after replacing the placeholder profile UUIDs.

## Local Validation

Run locally:

```bash
cd app
npm install
npm run typecheck
npm start
```

Run Supabase migrations in a clean branch or staging project before production.

## Next Recommended Build

**V32 — Contractor Dashboard Delivery Method UI Source Visibility**

Recommended next work:

- Surface delivery method source metadata in admin/debug copy for verified contractor delivery-method reads.
- Add UI-safe handling for empty new-table reads versus true fallback errors.
- Add clearer validation copy for staging claim approval tests.
- Run local `npm run typecheck` and Expo validation.

## Active Repository

```text
https://github.com/JT4416/HVAC-Truth
```

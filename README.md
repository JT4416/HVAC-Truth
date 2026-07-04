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

Current stage: **V29 — Claim Review RPC Delivery Method Write-Through**.

V29 updates the contractor claim approval database flow so verified claims now write delivery/contact routes directly to `contractor_delivery_methods` while preserving legacy compatibility rows in `contractor_lead_preferences` during the transition period.

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

New V29 files:

```text
backend/supabase/migrations/20260704_v29_claim_review_delivery_method_write_through.sql
docs/build/V29_CLAIM_REVIEW_DELIVERY_METHOD_WRITE_THROUGH.md
```

Updated V29 files:

```text
README.md
docs/features/DELIVERY_METHOD_CLEANUP.md
```

V29 behavior:

- Replaces `public.review_contractor_profile_claim(...)`.
- Approved claims now write to `public.contractor_delivery_methods`.
- Legacy compatibility rows are still written to `public.contractor_lead_preferences`.
- Contractor-level legacy delivery fields remain populated during the transition.
- Verified dashboard access, contractor service areas, and verified contractor status are preserved.

Run after V27:

```text
backend/supabase/migrations/20260704_v24_verified_contractor_participation.sql
backend/supabase/migrations/20260704_v25_participation_admin_controls.sql
backend/supabase/migrations/20260704_v27_delivery_method_cleanup.sql
backend/supabase/migrations/20260704_v29_claim_review_delivery_method_write_through.sql
```

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

**V30 — Staging Validation and Claim Approval Test Harness**

Recommended next work:

- Run the V24, V25, V27, and V29 migrations in a clean Supabase branch or staging project.
- Create a seed/test claim for each delivery method.
- Approve the claim through `review_contractor_profile_claim`.
- Confirm `contractor_delivery_methods` and legacy compatibility rows match.
- Run local `npm run typecheck` and Expo validation.

## Active Repository

```text
https://github.com/JT4416/HVAC-Truth
```

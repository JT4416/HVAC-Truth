# HVAC Truth Handoff — V25 Complete

Date: 2026-07-04
Repository: `JT4416/HVAC-Truth`
Current stage: **V25 — Participation Admin Controls**
Latest verified V25 commit: `8708b5ef91bf8c233f69184fa0e4f4b4d5b51bf0`

---

## 1. Product Summary

HVAC Truth is a homeowner-focused HVAC assistant app. It helps homeowners understand HVAC problems, safely document issues, check quotes, find contractors, generate contractor-ready handoff packets, and route leads to contractors without pushing homeowners into unsafe DIY repair steps.

Core homeowner promise:

```text
HVAC Truth helps homeowners understand, document, and ask better questions.
It does not guide dangerous electrical, refrigerant, gas, combustion, or code-sensitive repairs.
```

Core contractor marketplace promise:

```text
Verified contractors are either active or inactive in the HVAC Truth network.
They do not choose preferred lead categories.
They take the good with the bad inside their service area and operating limits.
```

---

## 2. Current Architecture

### Frontend

```text
React Native + Expo
```

### Backend / Auth / Database

```text
Supabase
```

### Storage

```text
Supabase Storage
```

Used for:

- homeowner system photos,
- contractor packet photos,
- data plate photos.

### AI Layer

Planned through backend/Supabase Edge Functions using OpenAI API.

### Contractor Discovery

Provider-ready Supabase Edge Function with support for:

- Google Places,
- Yelp,
- internal contractor records.

---

## 3. Safety Boundary

This app must stay homeowner-safe.

Allowed:

- observation,
- documentation,
- symptom collection,
- safe visible photos,
- filter checks,
- drain observations,
- quote interpretation,
- contractor handoff packet generation.

Not allowed:

- electrical testing,
- refrigerant work,
- opening energized panels,
- bypassing safeties,
- gas/combustion repair,
- code-sensitive repair steps,
- instructions that turn the homeowner into the technician.

---

## 4. Build History Summary

### V1-V2 — MVP Foundation

- App navigation
- Homeowner dashboard
- Basic troubleshooting
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
- Starter age and size decoding
- Confidence scoring
- Manufacturer decoder framework

### V5 — Supabase Auth + Profile Persistence

- Email/password authentication
- Persistent session
- Profile and primary home creation
- My System save/load
- Private data plate upload

### V6 — Data Plate OCR

- OCR service plan
- OpenAI-backed Edge Function plan
- Homeowner review before saving extracted data

### V7 — Contractor-Ready System Report

- Air handler location
- Access notes
- Contractor-ready snapshot
- Ballpark-estimate context

### V8 — Contractor Lead Request Flow

- Homeowner service request form
- Service type, urgency, contact preference, symptom summary
- Contractor report snapshot attached to lead request
- Contractor lead request tables

### V9 — Contractor Contact Routing

- Separates contractor discovery from delivery
- Supports dashboard/email/website/phone/SMS/contact form routing
- Generates standardized lead packet and phone script

### V10 — Live Contractor Discovery

- Provider-ready discovery function
- Google Places/Yelp support
- Search result persistence

### V11 — Contractor Profile Claiming

- Contractor claim screen
- Claim service
- Claim migration
- Contractor business/contact/service area intake

### V12 — Contractor Dashboard

- Verified dashboard
- Lead detail screen
- Lead preferences screen
- Contractor notes and activity
- Dashboard access gated by verified dashboard user rows

### V13 — Contractor Claim Review

- Internal claim review
- Claim decision screen
- Approve / needs-review / reject
- Approval creates/updates contractor profile
- Approval activates dashboard access

### V14 — Verified Dashboard Lead Routing

- Verified routing helper
- Eligible contractors route to dashboard
- Unverified contractors use public-contact routing

### V15 — Persisted Contractor Discovery

- Searches internal contractor records
- Searches Google/Yelp when configured
- Dedupes provider results
- Matches or creates contractor records
- Preserves HVAC Truth verification flags

### V16 — Search Result to Lead Request

- Search result can start a lead request
- Selected contractor passed through navigation
- Contractor ID and route metadata preserved

### V17 — Troubleshooting Workflow Engine

- Replaced simple troubleshooting with workflow engine
- Added homeowner-safe workflows for no cooling, water leak, frozen coil, weak airflow, odor, noise, quote validation
- Added safety gates

### V18 — Troubleshooting Session Persistence

- Saves completed troubleshooting sessions
- Shows recent troubleshooting sessions
- Adds latest session to contractor report snapshots

### V19 — Troubleshooting Session Controls

- Opens saved sessions
- Lets homeowner label/archive sessions
- Lets homeowner attach/hide sessions from reports and lead packets
- Lets homeowner select exact session for contractor handoff

### V20 — Troubleshooting to Lead Conversion

- Adds “I Tried This, Now Request Help” action
- Routes completed troubleshooting into contractor lead request
- Prefills service type, urgency, summary, and desired outcome

### V21 — Contractor Packet Intelligence

- Adds workflow-specific contractor handoff intelligence
- Adds severity explanations
- Adds professional verification focus
- Adds safety boundary summaries
- Adds safe photo prompts
- Embeds packet intelligence into lead reports

### V22 — Photo Capture for Contractor Packets

- Turns safe photo prompts into upload/status controls
- Homeowner can take/retake safe photos
- Homeowner can skip, mark not applicable, or mark unsafe access
- Uploads packet photos to private Supabase Storage
- Adds photo status to lead summaries and dashboard detail

### V23 — Contractor Packet Review and Scoring

- Adds packet completeness scoring
- Shows packet score before homeowner submission
- Saves score in `reportSnapshot.packetScore`
- Adds badges: Complete, Strong, Needs details, Thin
- Shows missing high-value fields and warnings
- Adds score to saved lead summary, standardized contact packet, phone script, and dashboard lead detail

### V24 — Verified Contractor Participation Rules

- Establishes all-or-nothing verified contractor participation rule
- Verified contractors are active or inactive in the network
- Contractors may control operating limits only
- Packet score is informational, not a lead-category selection switch
- Adds contractor participation fields

### V25 — Participation Admin Controls

- Adds admin service for contractor participation controls
- Adds Supabase policy/RPC foundation for participation updates
- Adds event logging for participation changes
- Aligns claim review checklist with participation standard
- Updates README and docs

---

## 5. Current V25 Files Added

```text
app/src/services/contractorParticipationAdmin.ts
backend/supabase/migrations/20260704_v25_participation_admin_controls.sql
docs/features/PARTICIPATION_ADMIN_CONTROLS.md
docs/build/NEXT_BUILD_STEPS_V25.md
docs/handoffs/HVAC_TRUTH_HANDOFF_V25.md
```

---

## 6. Current V25 Files Updated

```text
app/src/services/contractorClaimReview.ts
README.md
```

---

## 7. Recent V24 Files Added

```text
app/src/services/contractorParticipationRules.ts
backend/supabase/migrations/20260704_v24_verified_contractor_participation.sql
docs/features/VERIFIED_CONTRACTOR_PARTICIPATION_RULES.md
docs/build/NEXT_BUILD_STEPS_V24.md
```

---

## 8. Key V24/V25 Business Decision

The app should **not** allow verified contractors to choose preferred lead categories.

Correct rule:

```text
Verified contractors are in or out.
```

Allowed contractor controls:

```text
- service area
- emergency availability
- business hours / availability windows
- temporary pause status
- daily capacity limit
- weekly capacity limit
- active / inactive / paused / suspended participation status
```

Not the model:

```text
I only want replacement estimates.
I only want high-score packets.
I only want easy no-cooling calls.
I only want quote second opinions.
```

Packet score should be used to inform both homeowner and contractor, not to let contractors filter categories.

---

## 9. V24 Participation Fields

Migration:

```text
backend/supabase/migrations/20260704_v24_verified_contractor_participation.sql
```

Fields added to `public.contractors`:

```text
hvac_truth_participation_status
participation_paused
participation_pause_reason
max_daily_dashboard_leads
max_weekly_dashboard_leads
accepts_all_eligible_lead_types
```

---

## 10. V25 Admin Control Fields

V25 admin service manages:

```text
hvac_truth_participation_status
participation_paused
participation_pause_reason
service_zip_codes
emergency_service
max_daily_dashboard_leads
max_weekly_dashboard_leads
accepts_all_eligible_lead_types
```

Primary service file:

```text
app/src/services/contractorParticipationAdmin.ts
```

Main functions:

```text
getParticipationContractors()
getParticipationContractor(contractorId)
updateContractorParticipation(input)
buildAdminParticipationSummary(contractor, zipCode)
```

---

## 11. Required Migrations To Run

Run migrations in order if the database has not already applied them:

```text
backend/supabase/migrations/20260703_v14_verified_dashboard_lead_routing.sql
backend/supabase/migrations/20260703_v15_persisted_contractor_discovery.sql
backend/supabase/migrations/20260703_v17_troubleshooting_workflow_engine.sql
backend/supabase/migrations/20260703_v19_troubleshooting_session_controls.sql
backend/supabase/migrations/20260704_v22_contractor_packet_photo_storage.sql
backend/supabase/migrations/20260704_v24_verified_contractor_participation.sql
backend/supabase/migrations/20260704_v25_participation_admin_controls.sql
```

V20, V21, and V23 did not require new migrations.

---

## 12. Known Caveats / Follow-Up Issues

### 12.1 UI Screen Rename Did Not Land

The contractor-facing screen:

```text
app/src/screens/ContractorLeadPreferencesScreen.tsx
```

still likely uses older “Lead Preferences” language.

Attempts to rewrite that screen into “Participation Standards” were blocked twice by the platform safety filter during prior work. The core logic, migrations, services, and docs landed, but this UI copy/screen update did not.

Recommended fix in V26:

```text
Rename/rework ContractorLeadPreferencesScreen.tsx into a participation standard screen.
```

### 12.2 V25 Is Service + Database Foundation

V25 does not yet add full visible admin screens.

It creates the service and DB/RPC layer needed for those screens.

### 12.3 Local TypeScript Validation Still Needed

The repository was updated through GitHub connector. Local app compile was not executed in this environment.

Run locally:

```bash
cd app
npm install
npx tsc --noEmit
npx expo start
```

### 12.4 SQL Policy Syntax Should Be Reviewed Locally

The V25 migration uses `create policy if not exists`. Confirm Supabase/Postgres version compatibility. If unsupported, convert to a `drop policy if exists` + `create policy` pattern.

### 12.5 Claim Review RPC Still Has Older Lead Preference Mechanics

V25 updated the claim review service/checklist language, but the older V13 SQL function still copies `lead_preferences` into delivery method tables. That may remain useful for delivery method selection, but it should not be interpreted as contractor lead-category preference.

Recommended future cleanup:

```text
Rename contractor_lead_preferences concept to contractor_delivery_methods, or clearly separate delivery methods from lead category preferences.
```

---

## 13. Most Important Files To Inspect Next

```text
README.md
app/src/services/contractorParticipationRules.ts
app/src/services/contractorParticipationAdmin.ts
app/src/services/verifiedLeadRouting.ts
app/src/services/contractorLeadFlow.ts
app/src/services/contractorClaimReview.ts
app/src/screens/ContractorLeadPreferencesScreen.tsx
backend/supabase/migrations/20260704_v24_verified_contractor_participation.sql
backend/supabase/migrations/20260704_v25_participation_admin_controls.sql
docs/features/VERIFIED_CONTRACTOR_PARTICIPATION_RULES.md
docs/features/PARTICIPATION_ADMIN_CONTROLS.md
docs/build/NEXT_BUILD_STEPS_V25.md
```

---

## 14. Recommended V26

Next build:

```text
V26 — Participation Control Screens
```

Goal:

```text
Build the visible admin/contractor UI for the V25 participation service.
```

Recommended V26 scope:

```text
- Add admin participation contractor list screen.
- Add participation detail editor screen.
- Add active/inactive/paused/suspended status control.
- Add pause/resume action.
- Add pause reason field.
- Add service ZIP editor.
- Add emergency availability toggle.
- Add daily lead capacity input.
- Add weekly lead capacity input.
- Add route visibility messages explaining why a contractor is active, inactive, paused, suspended, outside service area, or capacity-limited.
- Rework ContractorLeadPreferencesScreen into Participation Standard / Participation Settings language.
```

---

## 15. Recommended V27

After V26:

```text
V27 — Delivery Method Cleanup
```

Goal:

```text
Separate delivery method preferences from lead category preferences.
```

Recommended work:

```text
- Rename concepts in code/docs from lead_preferences to delivery_methods where appropriate.
- Keep email/phone/SMS/dashboard/contact-form routing options.
- Remove ambiguity that could imply contractors choose lead categories.
- Update claim review docs and SQL comments.
```

---

## 16. Current GitHub State

As of the V25 completion message:

```text
main was 6 commits ahead of V24 commit 00465375ebf4ed87faca3f2018fded1d04736e6c.
Latest V25 commit before this handoff: 8708b5ef91bf8c233f69184fa0e4f4b4d5b51bf0.
```

This handoff file was added after that V25 commit.

---

## 17. Recovery Prompt For Next Chat

Paste this into a fresh chat if needed:

```text
We are building the HVAC Truth app in GitHub repo JT4416/HVAC-Truth. Read docs/handoffs/HVAC_TRUTH_HANDOFF_V25.md first. Current stage is V25 complete: Participation Admin Controls. Continue with V26 — Participation Control Screens. Preserve the core marketplace rule: verified contractors are active or inactive in the network and cannot choose lead categories. They may only control service area, emergency availability, pause status, and daily/weekly capacity. Packet score is informational only. Start by inspecting app/src/services/contractorParticipationAdmin.ts, app/src/services/contractorParticipationRules.ts, app/src/screens/ContractorLeadPreferencesScreen.tsx, app/App.tsx, and README.md.
```

---

## 18. Do Not Forget

The strongest product decision so far:

```text
HVAC Truth is homeowner-first.
Verified contractors should not get to cherry-pick only the most profitable or easiest lead types.
They are either in or out.
```

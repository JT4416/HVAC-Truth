# HVAC Truth MVP Starter

HVAC Truth is a homeowner-focused HVAC assistant app: troubleshooting, quote checking, contractor finding, maintenance education, and safe AI guidance.

## MVP Stack

- Mobile: React Native + Expo
- Backend/Auth/DB: Supabase
- AI: OpenAI API through a backend edge function or secure server route
- Contractor Finder: Google Places API or another local business data provider
- Payments: Stripe, added after beta validation

## MVP Features Included in This Starter

1. Account and ZIP-code driven onboarding
2. Home dashboard
3. Broken AC troubleshooting flow
4. Maintenance tips library
5. Quote checker form
6. Contractor finder placeholder
7. Ask HVAC Truth AI assistant placeholder
8. My System profile screen
9. Supabase database schema
10. Safety guardrails for homeowner-facing HVAC guidance

## Local Setup

```bash
cd app
npm install
cp .env.example .env
npx expo start
```

Fill in your environment variables in `app/.env`.

## Recommended Build Order

1. Create Supabase project
2. Run `backend/supabase/schema.sql`
3. Add Supabase keys to `.env`
4. Start Expo app
5. Wire authentication
6. Test ZIP-code onboarding
7. Connect contractor search API
8. Add AI backend route
9. Add Stripe once paid quote checking is ready

## Important Safety Boundary

HVAC Truth should help homeowners understand, document, and ask better questions. It must not guide users through dangerous electrical, refrigerant, gas, or code-sensitive repairs.

## V3 Update: Data Plate Photo Capture

V3 adds a homeowner system profile upgrade:

- Indoor unit data plate photo capture
- Outdoor unit data plate photo capture
- Indoor/outdoor model and serial fields
- Filter size, estimated age, and notes
- Supabase Storage plan for private system photos
- Database tables for photo metadata and future OCR/AI extraction

Install the new dependency before running the app:

```bash
cd app
npm install
```

Then run the starter app as before.

## V4 Update - System Age & Size Decoder

V4 adds the homeowner-facing **Decode My System** feature.

Homeowners can now:

- Take a data plate photo for decoder review.
- Type a brand, model number, and serial number.
- Estimate system size from common model-number BTUH capacity codes.
- Estimate system age when a starter manufacturer rule supports it.
- See confidence level, warnings, and plain-English reasoning.
- Prepare the result to be saved into My System after persistence is wired.

New V4 files:

- `app/src/screens/SystemDecoderScreen.tsx`
- `app/src/domain/decoder/systemDecoder.ts`
- `app/src/domain/decoder/systemDecoderTypes.ts`
- `app/src/domain/decoder/manufacturerRules.ts`
- `docs/features/SYSTEM_DECODER.md`
- `docs/research/MANUFACTURER_DECODER_RESEARCH_PLAN.md`
- `docs/prompts/SYSTEM_DECODER_EXTRACTION_ASSISTANT.md`
- `docs/build/NEXT_BUILD_STEPS_V4.md`

Database additions are appended to:

- `backend/supabase/schema.sql`

The decoder intentionally uses confidence scoring. Starter rules should be verified before the app makes high-confidence age or warranty-related claims.

## V5 Update - Supabase Auth + Real Profile Persistence

V5 adds the first real persistence layer:

- Supabase email/password authentication
- Persistent app session storage
- Homeowner profile creation with ZIP code
- Primary home creation
- My System save/load
- Private indoor/outdoor data plate photo upload
- Saved photo metadata
- System Decoder result persistence
- Decoder outputs copied back into the system profile

New V5 files:

- `app/src/screens/AuthScreen.tsx`
- `app/src/context/AuthContext.tsx`
- `app/src/services/profilePersistence.ts`
- `docs/features/AUTH_PROFILE_PERSISTENCE.md`
- `docs/build/NEXT_BUILD_STEPS_V5.md`

New dependency:

```bash
npm install @react-native-async-storage/async-storage
```

Before testing V5, create a Supabase project, run `backend/supabase/schema.sql`, create/confirm the private `system-data-plates` bucket, and add Supabase keys to `app/.env`.

## V6 Update - Data Plate OCR

V6 adds the photo-reading layer for **Decode My System**.

Homeowners can now:

- Take a data plate photo.
- Run OCR on the photo.
- Review suggested brand, model number, serial number, equipment type, refrigerant, and voltage.
- Paste/type label text if the photo cannot be read.
- Confirm or edit values before decoding.
- Save the data plate photo, OCR text, confirmed values, and decoder result to My System.

New V6 files:

- `app/src/domain/decoder/dataPlateExtraction.ts`
- `app/src/services/dataPlateOcr.ts`
- `backend/supabase/functions/data-plate-ocr/index.ts`
- `docs/features/DATA_PLATE_OCR.md`
- `docs/prompts/DATA_PLATE_OCR_PROMPT.md`
- `docs/build/NEXT_BUILD_STEPS_V6.md`

Updated V6 files:

- `app/src/screens/SystemDecoderScreen.tsx`
- `app/src/services/dataPlatePhotos.ts`
- `app/src/services/profilePersistence.ts`
- `backend/supabase/schema.sql`
- `app/package.json`

New dependency:

```bash
npm install expo-file-system
```

Supabase Edge Function setup:

```bash
supabase secrets set OPENAI_API_KEY=your_openai_api_key
supabase functions deploy data-plate-ocr
```

Run the updated SQL in `backend/supabase/schema.sql` before testing photo upload and OCR persistence.

## V7 Update - Contractor-Ready System Report

V7 adds a contractor handoff report and air handler location tracking.

Homeowners can now save:

- Air handler location
- Air handler location details
- Access notes for the contractor

The Contractor Report includes:

- ZIP code
- system age and size
- indoor/outdoor model and serial numbers
- data plate photo status
- air handler location and access details
- decoder confidence
- contractor estimate guidance

New V7 file:

- `app/src/screens/ContractorReportScreen.tsx`

Updated V7 files:

- `app/App.tsx`
- `app/src/screens/HomeScreen.tsx`
- `app/src/screens/MySystemScreen.tsx`
- `app/src/domain/systemProfileTypes.ts`
- `app/src/services/profilePersistence.ts`
- `backend/supabase/schema.sql`

Run the updated SQL before testing the new location fields.

## V8 Update: Contractor Lead Request Flow

V8 adds the first homeowner-to-contractor lead flow.

New files:

```text
app/src/screens/ContractorLeadRequestScreen.tsx
app/src/services/contractorLeadFlow.ts
docs/features/CONTRACTOR_LEAD_REQUEST_FLOW.md
docs/build/NEXT_BUILD_STEPS_V8.md
```

Updated files:

```text
app/App.tsx
app/src/screens/HomeScreen.tsx
app/src/screens/ContractorReportScreen.tsx
backend/supabase/schema.sql
```

The homeowner can now:

1. Choose the service type.
2. Describe the problem.
3. Choose urgency.
4. Choose contact preference.
5. Attach the contractor-ready system report.
6. Select one or more contractors.
7. Preview the lead summary.
8. Submit the lead request.

The app saves:

```text
contractor_lead_requests
contractor_lead_recipients
```

The attached report snapshot includes system profile details such as age, tonnage, model/serial numbers, air handler location, access notes, and decoder confidence.

Production note: V8 still uses a demo contractor list. The next step is connecting the contractor selection list to a real contractor data provider or internal contractor onboarding table.

## V9: Contractor Contact Routing

V9 separates contractor discovery from lead delivery.

The contractor list can be generated from ZIP-code search, ratings, review count, distance, and trust signals, but lead delivery no longer assumes HVAC Truth has direct email addresses for every contractor.

New V9 behavior:

- Detects the best available contact route for each contractor.
- Supports HVAC Truth verified dashboard delivery later.
- Supports published email when available.
- Supports website/contact-form routing.
- Supports call routing with a homeowner script.
- Supports Google/Yelp profile fallback links.
- Prepares a standardized lead packet that homeowners can paste, email, or share.
- Tracks route status separately from lead status.

New V9 files:

```text
app/src/services/contractorContactRouting.ts
docs/features/CONTRACTOR_CONTACT_ROUTING.md
docs/build/NEXT_BUILD_STEPS_V9.md
```

Updated V9 files:

```text
app/src/services/contractorLeadFlow.ts
app/src/screens/ContractorLeadRequestScreen.tsx
backend/supabase/schema.sql
```

## V10 Update - Live Contractor Discovery

V10 replaces the contractor finder placeholder with a provider-ready contractor discovery layer.

New V10 files:

- `app/src/services/contractorDiscovery.ts`
- `backend/supabase/functions/contractor-discovery/index.ts`
- `docs/features/LIVE_CONTRACTOR_DISCOVERY.md`
- `docs/build/NEXT_BUILD_STEPS_V10.md`

Updated V10 files:

- `app/src/screens/ContractorFinderScreen.tsx`
- `backend/supabase/schema.sql`
- `app/.env.example`

V10 searches through a Supabase Edge Function so Google Places/Yelp keys stay off the mobile device.

Deploy the function:

```bash
supabase functions deploy contractor-discovery
```

Set provider secrets in Supabase:

```bash
supabase secrets set GOOGLE_PLACES_API_KEY=your_google_places_key
supabase secrets set YELP_API_KEY=your_yelp_api_key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

The app will use demo contractors until live provider keys and the Edge Function are configured.

V10 keeps two systems separate:

1. Contractor discovery: rating, review count, distance, provider source, ZIP code, and HVAC Truth trust score.
2. Lead delivery: dashboard, email, contact form, website, phone, SMS, Google/Yelp profile, or no usable route.

## V11 Update - Contractor Profile Claiming

V11 lets contractors claim a profile and submit verification details.

New V11 files:

```text
app/src/screens/ContractorProfileClaimScreen.tsx
app/src/services/contractorProfileClaiming.ts
backend/supabase/migrations/20260703_v11_contractor_profile_claiming.sql
docs/features/CONTRACTOR_PROFILE_CLAIMING.md
docs/build/NEXT_BUILD_STEPS_V11.md
```

Contractors can submit business information, authorized contact details, service ZIP codes, service radius, emergency service status, lead preferences, and review notes.

## V12 Update - Contractor Dashboard

V12 adds the verified contractor dashboard foundation.

New V12 files:

```text
app/src/services/contractorDashboard.ts
app/src/screens/ContractorDashboardScreen.tsx
app/src/screens/ContractorLeadDetailScreen.tsx
app/src/screens/ContractorLeadPreferencesScreen.tsx
backend/supabase/migrations/20260703_v12_contractor_dashboard.sql
docs/features/CONTRACTOR_DASHBOARD.md
docs/build/NEXT_BUILD_STEPS_V12.md
```

Verified contractors can view dashboard-routed lead packets, open contractor-ready report snapshots, accept or decline leads, mark leads as scheduled, add internal notes, and review lead preferences.

Direct dashboard leads require an active verified row in `contractor_dashboard_users`. Unverified contractors remain on V9 public-contact routing.

## V13 Update - Contractor Claim Review

V13 adds the internal review workflow that turns submitted contractor claims into verified contractor dashboard access.

New V13 files:

```text
app/src/services/contractorClaimReview.ts
app/src/screens/AdminContractorClaimReviewScreen.tsx
app/src/screens/AdminContractorClaimDetailScreen.tsx
backend/supabase/migrations/20260703_v13_contractor_claim_review.sql
docs/features/CONTRACTOR_CLAIM_REVIEW.md
docs/build/NEXT_BUILD_STEPS_V13.md
```

Reviewers can approve and verify, request more information, or reject a contractor claim. Approval creates or updates the contractor profile, marks the contractor as HVAC Truth verified, creates dashboard access, copies service areas, and copies lead preferences.

Run the V13 migration, then bootstrap the first reviewer in Supabase:

```sql
insert into public.app_admin_users (user_id, role, active)
values ('<profile_uuid>', 'owner', true);
```

## GitHub Recommendation

The active repository for this build is:

```text
https://github.com/JT4416/HVAC-Truth
```

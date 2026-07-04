# HVAC Truth Handoff — V26 Complete

Date: 2026-07-04
Repository: `JT4416/HVAC-Truth`
Current stage: **V26 — Participation Control Screens**
Latest V26 implementation commit before this handoff: `133dec38ebad3bc302a53ba6ca67c5cdbdee1d7c`

---

## 1. What V26 Completed

V26 turned the V25 participation admin service into visible screens and cleaned up the contractor-facing language that still implied lead-category preferences.

Completed scope:

```text
- Added admin participation contractor list screen.
- Added admin participation detail editor screen.
- Added active / inactive / paused / suspended status controls.
- Added pause reason field.
- Added service ZIP editor.
- Added emergency availability toggle.
- Added daily dashboard lead capacity input.
- Added weekly dashboard lead capacity input.
- Added route visibility messages.
- Reworked contractor-facing screen copy from Lead Preferences to Participation Settings.
- Preserved the all-or-nothing verified contractor participation rule.
```

---

## 2. Core Product Rule Preserved

```text
Verified contractors are either in or out of the HVAC Truth verified network.
They may set operating limits.
They may not cherry-pick lead categories.
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

---

## 3. Files Added In V26

```text
app/src/screens/AdminContractorParticipationScreen.tsx
app/src/screens/AdminContractorParticipationDetailScreen.tsx
docs/features/PARTICIPATION_CONTROL_SCREENS.md
docs/build/NEXT_BUILD_STEPS_V26.md
docs/handoffs/HVAC_TRUTH_HANDOFF_V26.md
```

---

## 4. Files Updated In V26

```text
app/App.tsx
app/src/screens/HomeScreen.tsx
app/src/screens/ContractorDashboardScreen.tsx
app/src/screens/ContractorLeadPreferencesScreen.tsx
app/src/services/contractorParticipationAdmin.ts
```

---

## 5. Important Implementation Notes

### 5.1 Admin list screen

File:

```text
app/src/screens/AdminContractorParticipationScreen.tsx
```

Purpose:

```text
Shows verified contractors and summarizes whether each contractor is participating, not participating, paused, outside service area, or capacity-limited.
```

### 5.2 Admin detail editor

File:

```text
app/src/screens/AdminContractorParticipationDetailScreen.tsx
```

Purpose:

```text
Lets an owner/admin edit participation status, pause reason, service ZIPs, emergency availability, and lead capacity limits.
```

### 5.3 Contractor-facing settings screen

File remains:

```text
app/src/screens/ContractorLeadPreferencesScreen.tsx
```

Reason:

```text
The navigation key and filename were preserved for compatibility, but the visible UI is now Participation Settings.
```

### 5.4 Service mapping fix

File:

```text
app/src/services/contractorParticipationAdmin.ts
```

Important change:

```text
The admin record mapper now exposes both snake_case Supabase fields and camelCase app fields so participation decisions can evaluate service ZIPs, pause status, and capacity limits correctly.
```

---

## 6. Current GitHub State

Compared with V25 implementation commit `8708b5ef91bf8c233f69184fa0e4f4b4d5b51bf0`, `main` was ahead by 12 commits before this handoff file was added.

Net changed files from V26 implementation:

```text
app/App.tsx
app/src/screens/AdminContractorParticipationDetailScreen.tsx
app/src/screens/AdminContractorParticipationScreen.tsx
app/src/screens/ContractorDashboardScreen.tsx
app/src/screens/ContractorLeadPreferencesScreen.tsx
app/src/screens/HomeScreen.tsx
app/src/services/contractorParticipationAdmin.ts
docs/build/NEXT_BUILD_STEPS_V26.md
docs/features/PARTICIPATION_CONTROL_SCREENS.md
```

The previous V25 handoff file was read and then deleted from the repository as requested.

---

## 7. Local Validation Still Needed

The repository was updated through the GitHub connector. Local compile/runtime validation was not executed in this environment.

Run locally:

```bash
cd app
npm install
npx tsc --noEmit
npx expo start
```

Also confirm the Supabase migrations have been applied:

```text
backend/supabase/migrations/20260704_v24_verified_contractor_participation.sql
backend/supabase/migrations/20260704_v25_participation_admin_controls.sql
```

Review whether the V25 migration syntax is compatible with the deployed Supabase/Postgres version, especially any `create policy if not exists` statements.

---

## 8. Recommended V27

Next build:

```text
V27 — Delivery Method Cleanup
```

Goal:

```text
Separate delivery method preferences from lead category preferences.
```

Recommended V27 scope:

```text
- Rename concepts in code/docs from lead_preferences to delivery_methods where appropriate.
- Keep email/phone/SMS/dashboard/contact-form routing options.
- Remove ambiguity that could imply contractors choose lead categories.
- Update claim review docs and SQL comments.
- Consider a migration that introduces contractor_delivery_methods while preserving/backfilling existing data.
```

---

## 9. Recovery Prompt For Next Chat

```text
We are building the HVAC Truth app in GitHub repo JT4416/HVAC-Truth. Read docs/handoffs/HVAC_TRUTH_HANDOFF_V26.md first. Current stage is V26 complete: Participation Control Screens. Continue with V27 — Delivery Method Cleanup. Preserve the core marketplace rule: verified contractors are active or inactive in the network and cannot choose lead categories. They may only control service area, emergency availability, pause status, and daily/weekly capacity. Packet score is informational only. Start by inspecting app/src/screens/ContractorLeadPreferencesScreen.tsx, app/src/services/contractorDashboard.ts, app/src/services/contractorClaimReview.ts, app/src/services/verifiedLeadRouting.ts, backend/supabase/migrations/20260703_v13_contractor_claim_review.sql, and README.md.
```

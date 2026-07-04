# HVAC Truth Handoff — V28 Complete

Date: 2026-07-04
Repository: `JT4416/HVAC-Truth`
Current stage: **V28 — Local Validation and Supabase Migration Hardening**
Latest V28 implementation commit before this handoff: `78e839c513f68e46b95c6761e727f6a2f92896e1`

---

## 1. What V28 Completed

V28 focused on repeatable local validation setup and database compatibility review.

Completed scope:

```text
- Read and removed the V27 handoff after intake.
- Added app TypeScript config.
- Added npm run typecheck script.
- Reviewed V25 and V27 migration risk areas.
- Added V28 validation and migration-hardening notes.
- Updated README to V28 current stage.
```

---

## 2. Files Added In V28

```text
app/tsconfig.json
docs/build/V28_VALIDATION_AND_MIGRATION_HARDENING.md
docs/handoffs/HVAC_TRUTH_HANDOFF_V28.md
```

---

## 3. Files Updated In V28

```text
app/package.json
README.md
```

---

## 4. Files Removed In V28

```text
docs/handoffs/HVAC_TRUTH_HANDOFF_V27.md
```

The V27 handoff was read first and then removed from the repository.

---

## 5. Local Validation Commands

Run locally:

```bash
cd app
npm install
npm run typecheck
npm start
```

The GitHub connector could not execute local TypeScript, Expo, or Supabase CLI validation.

---

## 6. Database Validation Notes

Test migrations in a clean Supabase branch or staging project before production application.

Recommended order:

```text
backend/supabase/migrations/20260704_v24_verified_contractor_participation.sql
backend/supabase/migrations/20260704_v25_participation_admin_controls.sql
backend/supabase/migrations/20260704_v27_delivery_method_cleanup.sql
```

Important finding:

```text
V25 includes database access-rule syntax that should be checked against the deployed Supabase/Postgres version before production use.
```

V27 should be checked for:

```text
- contractor_delivery_methods table creation,
- backfill from legacy delivery rows,
- admin access to delivery methods,
- verified contractor access to their own delivery methods,
- app read fallback behavior.
```

---

## 7. Core Product Rule Preserved

```text
Verified contractors are either in or out of the HVAC Truth verified network.
They may set operating limits.
They may configure delivery/contact routes.
Packet score remains informational only.
```

---

## 8. Recommended V29

Next build:

```text
V29 — Claim Review RPC Delivery Method Write-Through
```

Recommended V29 scope:

```text
- Update claim approval database flow so approved claims write directly to contractor_delivery_methods.
- Preserve legacy compatibility fields during the transition period.
- Keep old delivery-method fields available until production data has been verified.
- Run local TypeScript and Expo validation.
- Run Supabase migrations in staging.
```

---

## 9. Recovery Prompt For Next Chat

```text
We are building the HVAC Truth app in GitHub repo JT4416/HVAC-Truth. Read docs/handoffs/HVAC_TRUTH_HANDOFF_V28.md first. Current stage is V28 complete: Local Validation and Supabase Migration Hardening. Continue with V29 — Claim Review RPC Delivery Method Write-Through. Preserve the verified contractor participation standard. Start by inspecting backend/supabase/migrations/20260703_v13_contractor_claim_review.sql, backend/supabase/migrations/20260704_v27_delivery_method_cleanup.sql, app/src/services/contractorDeliveryMethods.ts, app/src/services/contractorClaimReview.ts, and README.md.
```

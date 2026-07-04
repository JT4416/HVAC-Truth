# Next Build Steps After V16

V16 connected contractor search results into the homeowner lead request flow.

## Completed in V16

- Updated navigation typing for `ContractorLeadRequest`.
- Updated `ContractorFinderScreen` so `Request Help` passes the selected contractor to the lead request screen.
- Updated `ContractorLeadRequestScreen` so a passed contractor replaces the demo list and is preselected.
- Preserved contractor ID, source IDs, verification state, dashboard lead flags, and contact route data.
- Kept the demo list fallback when no contractor is passed.
- Documented the V16 feature.

## Product Rule

A homeowner who searches for a contractor should be able to submit a lead to that same contractor record without losing the contractor ID or verification flags.

## Recommended V17

V17 should build the deeper homeowner troubleshooting workflow engine.

Recommended V17 goals:

- Replace the current simple troubleshooting form with symptom-specific workflows.
- Add workflows for no cooling, no power, water leak, frozen coil, short cycling, high humidity, weak airflow, noise, odor, thermostat issues, and quote validation.
- Save troubleshooting sessions to Supabase.
- Attach troubleshooting output to the contractor-ready report.
- Attach troubleshooting output to contractor lead requests.
- Keep all homeowner instructions inside safe boundaries.
- Add clear “stop and call a pro” gates for electrical, refrigerant, gas, combustion, burning smell, and repeated breaker trips.

## Recommended V17 Files

```text
app/src/domain/troubleshootingWorkflowEngine.ts
app/src/domain/troubleshootingWorkflows.ts
app/src/screens/TroubleshootingScreen.tsx
backend/supabase/migrations/20260703_v17_troubleshooting_workflow_engine.sql
docs/features/TROUBLESHOOTING_WORKFLOW_ENGINE.md
docs/build/NEXT_BUILD_STEPS_V17.md
```

## Later Build

After the troubleshooting workflow engine, connect saved troubleshooting sessions into the contractor report and lead packets.

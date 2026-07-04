# V17 — Troubleshooting Workflow Engine

V17 replaces the simple troubleshooting evaluator with a homeowner-safe workflow engine.

## Primary V17 Requirement

The highest-priority workflow is for this symptom:

```text
Both pieces of the system are off:
- indoor machine off
- outdoor machine off
```

That workflow includes:

1. Check the float switch.
2. Vacuum out the condensate drain line.
3. If the system is installed horizontally:
   - Check the emergency pan and/or pan switch.
   - Clean out the drain line and pan with a shop vac.

## Safety Boundary

The app does not tell homeowners to:

- Open electrical compartments.
- Bypass float switches.
- Bypass pan switches.
- Bypass door switches, fuses, breakers, or safeties.
- Touch exposed wiring or terminals.
- Work on refrigerant components.
- Add refrigerant.
- Use gauges.
- Perform gas or combustion work.

## New Engine Files

```text
app/src/domain/troubleshootingWorkflowEngine.ts
app/src/domain/troubleshootingWorkflows.ts
```

## Updated Screen

```text
app/src/screens/TroubleshootingScreen.tsx
```

The screen now lets the homeowner:

- Choose a symptom workflow.
- Answer workflow-specific questions.
- See safe homeowner steps.
- See do-not-do safety warnings.
- See call-a-pro triggers.
- Get a technician-ready script.
- Generate contractor report notes for later attachment.

## Workflows Added

V17 includes these homeowner-safe workflows:

```text
Indoor and Outdoor Units Both Off
No Cooling / Warm Air
Water Leak / Drain or Pan Issue
Frozen Coil / Ice Visible
Weak Airflow
Odor / Smell Safety Check
Noise / Vibration
Quote / Repair Recommendation Check
```

## Both-Units-Off Workflow Details

The both-units-off workflow asks about:

```text
thermostat cooling demand
whether both indoor and outdoor are off
water near indoor unit
visible float switch
installation orientation
emergency pan water
shop vac availability
```

If water, a float switch, or pan condition is suspected, the result warns that a condensate safety may have shut the system down.

Homeowner-safe steps include:

- Confirm thermostat cooling demand.
- Check the float switch visually.
- Vacuum the condensate drain line.
- For horizontal installs, check the emergency pan and pan switch.
- For horizontal installs, clean the drain and pan with a shop vac.
- Replace a dirty filter.
- Restart only after water is cleared and monitor for shutdown or water return.

## Database Support

V17 adds a future-ready table:

```text
troubleshooting_sessions
```

Migration:

```text
backend/supabase/migrations/20260703_v17_troubleshooting_workflow_engine.sql
```

The screen currently creates an in-app session snapshot. Later versions should persist that snapshot and attach it to contractor reports and lead packets.

## Relationship to Contractor Reports and Leads

Each workflow result includes:

```text
contractorReportNotes
homeownerScript
safeSteps
doNotDo
callProWhen
```

These fields are designed to be attached to:

- Contractor-ready reports.
- Contractor lead requests.
- Dashboard lead packets.

## MVP Limitation

V17 creates the workflow engine and session snapshot shape. It does not yet save troubleshooting sessions to Supabase or attach them to submitted leads. That should be V18.

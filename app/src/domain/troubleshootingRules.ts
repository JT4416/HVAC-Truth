export type TroubleshootingAnswerKey =
  | 'thermostatCooling'
  | 'indoorFanRunning'
  | 'outdoorUnitRunning'
  | 'warmAir'
  | 'waterNearIndoorUnit'
  | 'breakerTripped'
  | 'dirtyFilter'
  | 'iceVisible'
  | 'burningSmell'
  | 'chemicalSmell'
  | 'weakAirflow'
  | 'unusualNoise';

export type TroubleshootingQuestion = {
  key: TroubleshootingAnswerKey;
  prompt: string;
  helper: string;
};

export type TroubleshootingResult = {
  severity: 'safe-check' | 'caution' | 'call-pro' | 'urgent-stop';
  title: string;
  summary: string;
  safeSteps: string[];
  callProWhen: string[];
  homeownerScript: string;
};

export const troubleshootingQuestions: TroubleshootingQuestion[] = [
  { key: 'thermostatCooling', prompt: 'Is the thermostat on and set to Cool?', helper: 'Make sure the setpoint is at least 3 degrees below room temperature.' },
  { key: 'indoorFanRunning', prompt: 'Is the indoor fan or blower running?', helper: 'You may feel air at the vents even when cooling is not working.' },
  { key: 'outdoorUnitRunning', prompt: 'Is the outdoor unit running?', helper: 'Listen for the fan and compressor outside. Do not open the cabinet.' },
  { key: 'warmAir', prompt: 'Is warm or room-temperature air coming from the vents?', helper: 'This often means the system is moving air but not removing heat.' },
  { key: 'waterNearIndoorUnit', prompt: 'Is there water near the indoor unit?', helper: 'Water can indicate a clogged drain, overflow pan, or float switch issue.' },
  { key: 'breakerTripped', prompt: 'Is the breaker tripped?', helper: 'Resetting once may be reasonable. Repeated trips require service.' },
  { key: 'dirtyFilter', prompt: 'Is the air filter dirty or clogged?', helper: 'A clogged filter can freeze the coil and reduce cooling.' },
  { key: 'iceVisible', prompt: 'Do you see ice on the copper line or coil area?', helper: 'Ice usually means airflow or refrigerant-side trouble.' },
  { key: 'burningSmell', prompt: 'Do you smell burning, electrical, or melting plastic?', helper: 'This is a stop-use condition.' },
  { key: 'chemicalSmell', prompt: 'Do you smell a strong chemical or sweet odor?', helper: 'This may be refrigerant, solvent, or another indoor air concern.' },
  { key: 'weakAirflow', prompt: 'Is airflow weak at multiple vents?', helper: 'Weak airflow can point to a dirty filter, blower issue, duct issue, or frozen coil.' },
  { key: 'unusualNoise', prompt: 'Do you hear grinding, buzzing, banging, or screeching?', helper: 'Noise can be a motor, fan, contactor, compressor, or loose component.' }
];

export function evaluateTroubleshooting(answers: Partial<Record<TroubleshootingAnswerKey, boolean>>): TroubleshootingResult {
  if (answers.burningSmell) {
    return {
      severity: 'urgent-stop',
      title: 'Stop using the system and call a licensed technician',
      summary: 'A burning, electrical, or melting-plastic smell can indicate overheating wiring, a failing motor, or another unsafe electrical condition.',
      safeSteps: ['Turn the system off at the thermostat.', 'Do not open electrical compartments.', 'Keep the area clear and monitor for smoke or worsening odor.'],
      callProWhen: ['Call immediately if the odor is strong, returns, or is paired with buzzing, smoke, or a tripped breaker.'],
      homeownerScript: 'My AC has a burning or electrical smell. I turned it off and need a licensed technician to inspect the electrical side before it runs again.'
    };
  }

  if (answers.breakerTripped) {
    return {
      severity: 'call-pro',
      title: 'Possible electrical fault or overloaded component',
      summary: 'A breaker that trips can be caused by a shorted component, failing motor, compressor problem, loose wiring, or overload condition.',
      safeSteps: ['You may reset the breaker once if there is no smell, smoke, or visible damage.', 'If it trips again, leave it off.'],
      callProWhen: ['Call a technician if the breaker trips more than once, trips immediately, or trips with noise or odor.'],
      homeownerScript: 'The AC breaker tripped. It either will not reset or trips again after cooling is requested. Please check the electrical components safely.'
    };
  }

  if (answers.iceVisible) {
    return {
      severity: 'caution',
      title: 'System may be frozen',
      summary: 'Ice often points to restricted airflow, low refrigerant charge, a blower issue, dirty coil, or metering problem. Continuing to run cooling can make it worse.',
      safeSteps: ['Turn cooling off.', 'Set fan to On if the thermostat allows it.', 'Replace a dirty filter if needed.', 'Let ice fully thaw before service or further testing.'],
      callProWhen: ['Call if ice returns, airflow remains weak, or cooling is poor after thawing and a clean filter.'],
      homeownerScript: 'There is ice on the AC line or coil. I turned cooling off and need the cause checked, not just the ice thawed.'
    };
  }

  if (answers.waterNearIndoorUnit) {
    return {
      severity: 'caution',
      title: 'Likely drain or overflow issue',
      summary: 'Water near the indoor unit commonly comes from a clogged condensate drain, dirty pan, failed condensate pump, disconnected drain, or frozen coil thawing.',
      safeSteps: ['Turn cooling off if water is spreading.', 'Move valuables away from the area.', 'Check whether the filter is clogged.', 'Do not pour harsh chemicals into the drain.'],
      callProWhen: ['Call if water continues, the float switch has shut the system off, or there is ceiling/wall damage risk.'],
      homeownerScript: 'There is water around my indoor AC unit. I need the condensate drain, pan, float switch, and coil condition checked.'
    };
  }

  if (answers.dirtyFilter || answers.weakAirflow) {
    return {
      severity: 'safe-check',
      title: 'Start with airflow',
      summary: 'A dirty filter or weak airflow can cause poor cooling, high humidity, coil freeze-ups, noise, and higher energy use.',
      safeSteps: ['Replace the filter with the correct size and airflow direction.', 'Make sure supply and return vents are open and not blocked.', 'Confirm the outdoor unit has clear airflow around it.'],
      callProWhen: ['Call if airflow stays weak, the coil freezes, or temperature does not improve after basic checks.'],
      homeownerScript: 'I replaced the filter and checked vents, but airflow/cooling is still poor. Please check blower operation, coil condition, and duct restrictions.'
    };
  }

  if (answers.warmAir && answers.indoorFanRunning && !answers.outdoorUnitRunning) {
    return {
      severity: 'call-pro',
      title: 'Indoor fan runs, outdoor unit may not be starting',
      summary: 'This pattern can point to a thermostat/control issue, capacitor, contactor, outdoor fan motor, compressor issue, float switch, or power problem.',
      safeSteps: ['Confirm thermostat is set to Cool.', 'Confirm the outdoor disconnect has not been visibly turned off.', 'Do not open the outdoor unit or touch electrical parts.'],
      callProWhen: ['Call for service if the outdoor unit does not run after basic thermostat and breaker checks.'],
      homeownerScript: 'The indoor fan runs but the outdoor unit does not start. Please test the outdoor unit safely, including capacitor, contactor, fan motor, compressor, and control signal.'
    };
  }

  return {
    severity: 'safe-check',
    title: 'Begin with the safe basics',
    summary: 'The answers do not point to one urgent issue yet. Start with thermostat settings, filter condition, breaker status, and airflow around the outdoor unit.',
    safeSteps: ['Set thermostat to Cool and lower the setpoint.', 'Replace a dirty filter.', 'Check that vents are open.', 'Clear leaves and debris around the outdoor unit without opening it.'],
    callProWhen: ['Call if the system still does not cool, makes unusual noises, leaks water, trips a breaker, or freezes.'],
    homeownerScript: 'My AC is not cooling after basic thermostat, filter, breaker, and airflow checks. I need a diagnostic with readings and photos if possible.'
  };
}

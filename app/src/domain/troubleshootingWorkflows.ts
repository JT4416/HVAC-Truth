import {
  TroubleshootingAnswers,
  TroubleshootingResult,
  TroubleshootingWorkflow,
  answerNo,
  answerYes,
  selected
} from './troubleshootingWorkflowEngine';

const stopElectrical: string[] = [
  'Do not open electrical panels or equipment cabinets.',
  'Do not bypass float switches, pan switches, door switches, fuses, breakers, or safeties.',
  'Do not touch exposed wiring or terminals.',
  'Do not reset a breaker more than once.'
];

const refrigerantBoundary: string[] = [
  'Do not connect gauges or release refrigerant.',
  'Do not open sealed refrigerant components.',
  'Do not add refrigerant or use leak-seal products.'
];

function baseResult(workflowId: string, overrides: Partial<TroubleshootingResult>): TroubleshootingResult {
  return {
    workflowId,
    severity: overrides.severity ?? 'safe-check',
    title: overrides.title ?? 'Start with safe homeowner checks',
    summary: overrides.summary ?? 'This workflow stays limited to safe homeowner checks and documentation.',
    safeSteps: overrides.safeSteps ?? [],
    doNotDo: overrides.doNotDo ?? [...stopElectrical],
    callProWhen: overrides.callProWhen ?? ['Call a licensed technician if the issue remains after the safe checks.'],
    homeownerScript: overrides.homeownerScript ?? 'I completed the safe homeowner checks and need a licensed technician to diagnose the remaining issue.',
    contractorReportNotes: overrides.contractorReportNotes ?? []
  };
}

export const troubleshootingWorkflows: TroubleshootingWorkflow[] = [
  {
    id: 'both-indoor-outdoor-off-drain-float',
    title: 'Indoor and Outdoor Units Both Off',
    symptom: 'Nothing is running inside or outside when cooling is requested.',
    homeownerGoal: 'Check common homeowner-safe shutdown causes, especially condensate float and pan switch shutdowns.',
    safetyBoundary: 'Do not bypass safeties or open electrical compartments. This workflow is for visual checks, thermostat checks, filter checks, and drain/pan cleanup only.',
    questions: [
      { id: 'thermostatCool', type: 'yes_no', prompt: 'Is the thermostat set to Cool and at least 3 degrees below room temperature?', helper: 'Also confirm batteries if your thermostat uses them.' },
      { id: 'bothOff', type: 'yes_no', prompt: 'Are both the indoor blower and outdoor unit off?', helper: 'No air from vents and no outdoor fan/compressor sound.' },
      { id: 'waterNearIndoor', type: 'yes_no', prompt: 'Do you see water near the indoor unit, drain line, or air handler?', helper: 'Water may indicate a float switch or pan switch shutdown.' },
      { id: 'floatSwitchPresent', type: 'yes_no', prompt: 'Can you see a condensate float switch on the drain line or near the unit?', helper: 'Do not bypass it. Only inspect whether it looks wet, tripped, or full of water.' },
      { id: 'installOrientation', type: 'single_choice', prompt: 'How is the indoor unit installed?', helper: 'Choose the closest match.', options: [
        { label: 'Vertical / upright', value: 'vertical' },
        { label: 'Horizontal / attic / closet / suspended', value: 'horizontal' },
        { label: 'Not sure', value: 'unknown' }
      ] },
      { id: 'emergencyPanWater', type: 'yes_no', prompt: 'If horizontal, is there water in the emergency pan?', helper: 'The emergency pan is the secondary pan under a horizontal air handler.' },
      { id: 'shopVacAvailable', type: 'yes_no', prompt: 'Do you have a wet/dry shop vac available?', helper: 'Only use it from an accessible drain termination or safe pan location.' }
    ],
    evaluate: (answers: TroubleshootingAnswers) => {
      if (!answerYes(answers, 'bothOff')) {
        return baseResult('both-indoor-outdoor-off-drain-float', {
          severity: 'safe-check',
          title: 'This may not be the both-units-off workflow',
          summary: 'One part of the system appears to be running. Choose a more specific workflow such as indoor fan runs/outdoor off, warm air, weak airflow, or water leak.',
          safeSteps: [
            { title: 'Pick the closest symptom workflow', detail: 'Use the workflow that matches what is actually running and what is not running.' }
          ],
          contractorReportNotes: ['User initially selected both-units-off, but answers suggest one side may still be operating.']
        });
      }

      const horizontal = selected(answers, 'installOrientation', 'horizontal');
      const waterRelated = answerYes(answers, 'waterNearIndoor') || answerYes(answers, 'floatSwitchPresent') || answerYes(answers, 'emergencyPanWater');

      return baseResult('both-indoor-outdoor-off-drain-float', {
        severity: waterRelated ? 'caution' : 'safe-check',
        title: waterRelated ? 'Possible float switch or pan switch shutdown' : 'Both indoor and outdoor units are off',
        summary: waterRelated
          ? 'A condensate float switch or emergency pan switch may have shut the system down to prevent water damage.'
          : 'When both pieces of equipment are off, start with thermostat settings, visible safeties, filter condition, and the condensate drain/pan area before calling for service.',
        safeSteps: [
          { title: 'Confirm thermostat demand', detail: 'Set the thermostat to Cool and lower the setpoint at least 3 degrees below room temperature. Wait a few minutes for any built-in delay.' },
          { title: 'Check the float switch visually', detail: 'Look for a float switch on the condensate drain line or near the indoor unit. If it is full of water or looks tripped, the drain may be backed up.', safetyNote: 'Do not bypass, tape down, disconnect, or jump out the float switch.' },
          { title: 'Vacuum the drain line', detail: 'If you can safely access the drain termination, use a wet/dry shop vac to pull sludge and water from the condensate drain line.', safetyNote: 'Do not pour harsh chemicals into the drain and do not disassemble electrical parts.' },
          ...(horizontal ? [
            { title: 'Check the emergency pan', detail: 'For a horizontal installation, inspect the emergency pan under the air handler. If water is present, the pan switch may be keeping the system off.', safetyNote: 'Do not bypass the pan switch.' },
            { title: 'Clean the drain and pan with a shop vac', detail: 'Use a wet/dry shop vac to remove standing water and debris from the emergency pan and accessible drain outlet. Dry the pan as much as practical.' }
          ] : [
            { title: 'Look for a secondary pan if present', detail: 'If you are not sure whether the unit is horizontal, look for a pan under the indoor unit or signs of overflow. Stop if access is unsafe.' }
          ]),
          { title: 'Replace a dirty filter', detail: 'A clogged filter can contribute to coil freezing and excess water after thawing. Replace it with the correct size and airflow direction.' },
          { title: 'Try cooling again only after water is cleared', detail: 'After clearing visible water and vacuuming the drain, restore cooling from the thermostat and monitor for shutdown or water return.' }
        ],
        doNotDo: [...stopElectrical, 'Do not keep running the system if water returns or ceiling damage is possible.'],
        callProWhen: [
          'The system does not restart after the drain line/pan is cleared.',
          'The float switch or pan switch trips again.',
          'Water returns, leaks through a ceiling, or the pan keeps filling.',
          'You cannot safely access the drain termination or pan.',
          'There is burning smell, buzzing, repeated breaker trip, or visible electrical damage.'
        ],
        homeownerScript: horizontal
          ? 'Both the indoor and outdoor AC units were off. This is a horizontal installation. I checked the emergency pan/pan switch area, vacuumed the drain/pan with a shop vac, and need the condensate drain, float switch, pan switch, and air handler checked.'
          : 'Both the indoor and outdoor AC units were off. I checked the thermostat, looked at the float switch area, vacuumed the condensate drain line if accessible, and need the drain safety circuit and air handler checked.',
        contractorReportNotes: [
          'Priority workflow: both indoor and outdoor units off.',
          waterRelated ? 'Water/float/pan switch condition suspected.' : 'No confirmed water condition from homeowner answers.',
          horizontal ? 'Horizontal installation path selected; emergency pan and pan switch included.' : 'Horizontal installation not confirmed.'
        ]
      });
    }
  },
  {
    id: 'no-cooling-warm-air',
    title: 'No Cooling / Warm Air',
    symptom: 'System runs but air is warm or room temperature.',
    homeownerGoal: 'Check thermostat, filter, airflow, outdoor airflow clearance, and visible ice without touching refrigerant or electrical components.',
    safetyBoundary: 'No electrical cabinet access, no capacitor/contactor testing, and no refrigerant work.',
    questions: [
      { id: 'airflowAtVents', type: 'yes_no', prompt: 'Do you feel air moving from the vents?', helper: 'This separates airflow problems from cooling-only problems.' },
      { id: 'outdoorRunning', type: 'yes_no', prompt: 'Is the outdoor unit running?', helper: 'Listen from outside. Do not open the outdoor unit.' },
      { id: 'filterDirty', type: 'yes_no', prompt: 'Is the filter dirty or overdue?', helper: 'A clogged filter can reduce airflow and freeze the coil.' },
      { id: 'iceVisible', type: 'yes_no', prompt: 'Do you see ice on the copper line or coil area?', helper: 'Ice requires cooling to be turned off.' },
      { id: 'outdoorBlocked', type: 'yes_no', prompt: 'Is the outdoor unit blocked by leaves, grass, or debris?', helper: 'Only clear around the outside. Do not remove panels.' }
    ],
    evaluate: (answers) => baseResult('no-cooling-warm-air', {
      severity: answerYes(answers, 'iceVisible') ? 'caution' : answerNo(answers, 'outdoorRunning') ? 'call-pro' : 'safe-check',
      title: answerYes(answers, 'iceVisible') ? 'Possible frozen coil' : answerNo(answers, 'outdoorRunning') ? 'Outdoor unit may not be starting' : 'Start with airflow and outdoor clearance',
      summary: 'Warm air can come from airflow restriction, frozen coil, outdoor unit failure, thermostat/control issue, or refrigerant-side trouble.',
      safeSteps: [
        { title: 'Confirm thermostat settings', detail: 'Set to Cool with the fan on Auto and the setpoint below room temperature.' },
        { title: 'Replace dirty filter', detail: 'Use the correct size and airflow direction.' },
        { title: 'Open supply and return vents', detail: 'Make sure furniture, rugs, and curtains are not blocking airflow.' },
        { title: 'Clear outdoor airflow', detail: 'Remove leaves and debris around the outdoor unit without removing panels.' },
        ...(answerYes(answers, 'iceVisible') ? [{ title: 'Thaw the system', detail: 'Turn cooling off and set fan to On if available until ice is fully gone.' }] : [])
      ],
      doNotDo: [...stopElectrical, ...refrigerantBoundary],
      callProWhen: ['Outdoor unit does not start.', 'Ice returns after thawing and filter replacement.', 'Air stays warm after basic checks.', 'Breaker trips or electrical odor appears.'],
      homeownerScript: 'My AC is running but not cooling. I checked thermostat settings, filter, airflow, outdoor clearance, and visible ice. Please diagnose the cooling side safely.',
      contractorReportNotes: ['No cooling/warm air workflow completed.']
    })
  },
  {
    id: 'water-leak-drain-pan',
    title: 'Water Leak / Drain or Pan Issue',
    symptom: 'Water near indoor unit, pan, ceiling, or drain line.',
    homeownerGoal: 'Stop water damage, check safe drain/pan items, and prepare contractor notes.',
    safetyBoundary: 'No electrical bypassing, no ceiling demolition, and no harsh drain chemicals.',
    questions: [
      { id: 'activeLeak', type: 'yes_no', prompt: 'Is water actively leaking or spreading?', helper: 'If yes, protect property first.' },
      { id: 'ceilingRisk', type: 'yes_no', prompt: 'Is there ceiling, wall, or attic water risk?', helper: 'Ceiling leaks can become urgent.' },
      { id: 'panWater', type: 'yes_no', prompt: 'Is there standing water in a pan?', helper: 'Standing pan water can trip a safety switch.' },
      { id: 'shopVacAvailable', type: 'yes_no', prompt: 'Do you have a wet/dry shop vac?', helper: 'Useful for drain outlet and pan cleanup.' }
    ],
    evaluate: (answers) => baseResult('water-leak-drain-pan', {
      severity: answerYes(answers, 'ceilingRisk') || answerYes(answers, 'activeLeak') ? 'caution' : 'safe-check',
      title: 'Condensate drain or pan issue likely',
      summary: 'Indoor AC water issues commonly come from a clogged drain, dirty pan, failed pump, frozen coil thawing, or disconnected drain.',
      safeSteps: [
        { title: 'Turn cooling off if water is spreading', detail: 'Stop active water production while you inspect safely.' },
        { title: 'Move valuables away', detail: 'Protect floors, ceilings, stored items, and electronics.' },
        { title: 'Vacuum accessible drain or pan', detail: 'Use a wet/dry shop vac on the drain termination or pan if safely accessible.' },
        { title: 'Check the filter', detail: 'Replace a dirty filter because freeze/thaw can create water overflow.' }
      ],
      doNotDo: [...stopElectrical, 'Do not pour harsh chemicals into the drain.', 'Do not ignore water in a ceiling or attic pan.'],
      callProWhen: ['Water continues after vacuuming.', 'Emergency pan fills again.', 'Float/pan switch trips.', 'Ceiling, wall, or attic damage is possible.'],
      homeownerScript: 'I have water near the indoor AC unit/pan/drain. I turned cooling off if needed and used a shop vac where accessible. Please check the drain, pan, float switch, coil, and condensate pump if present.',
      contractorReportNotes: ['Water leak/drain-pan workflow completed.']
    })
  },
  {
    id: 'frozen-coil-airflow',
    title: 'Frozen Coil / Ice Visible',
    symptom: 'Ice on copper line, coil area, or air handler.',
    homeownerGoal: 'Safely thaw the system and check airflow basics.',
    safetyBoundary: 'No refrigerant work or cabinet access.',
    questions: [
      { id: 'iceVisible', type: 'yes_no', prompt: 'Is ice visible on the copper line or coil area?', helper: 'Do not chip or scrape ice.' },
      { id: 'filterDirty', type: 'yes_no', prompt: 'Is the filter dirty?', helper: 'Dirty filters are a common homeowner-correctable cause.' },
      { id: 'weakAirflow', type: 'yes_no', prompt: 'Was airflow weak before the ice appeared?', helper: 'Weak airflow points toward airflow restrictions or blower trouble.' }
    ],
    evaluate: (answers) => baseResult('frozen-coil-airflow', {
      severity: 'caution',
      title: 'System is or may be frozen',
      summary: 'Running cooling while frozen can damage equipment and prevent proper diagnosis.',
      safeSteps: [
        { title: 'Turn cooling off', detail: 'Do not continue cooling while ice is present.' },
        { title: 'Set fan to On if available', detail: 'This can help thaw ice without running the compressor.' },
        { title: 'Replace dirty filter', detail: 'Use the correct size and airflow direction.' },
        { title: 'Wait until fully thawed', detail: 'A system may need several hours to fully thaw before a technician can diagnose it.' }
      ],
      doNotDo: [...refrigerantBoundary, ...stopElectrical, 'Do not chip, scrape, or heat the ice with a torch or heat gun.'],
      callProWhen: ['Ice returns.', 'Airflow remains weak.', 'Cooling remains poor after thawing and filter replacement.'],
      homeownerScript: 'The AC froze up. I turned cooling off, set fan to On if available, replaced the filter if dirty, and let it thaw. Please find the cause of the freeze-up.',
      contractorReportNotes: ['Frozen coil workflow completed.', answerYes(answers, 'filterDirty') ? 'Dirty filter reported.' : 'Dirty filter not reported.']
    })
  },
  {
    id: 'weak-airflow',
    title: 'Weak Airflow',
    symptom: 'Airflow is weak from multiple vents.',
    homeownerGoal: 'Check filters, vents, returns, and obvious airflow restrictions.',
    safetyBoundary: 'Do not open blower compartments or electrical cabinets.',
    questions: [
      { id: 'multipleVents', type: 'yes_no', prompt: 'Is airflow weak at multiple vents?', helper: 'One room can be a duct/damper issue; the whole house can be filter/blower/coil.' },
      { id: 'filterDirty', type: 'yes_no', prompt: 'Is the filter dirty or restrictive?', helper: 'Check size and airflow arrow.' },
      { id: 'returnBlocked', type: 'yes_no', prompt: 'Is the return grille blocked?', helper: 'Furniture, storage, or a clogged grille can restrict airflow.' }
    ],
    evaluate: (answers) => baseResult('weak-airflow', {
      severity: 'safe-check',
      title: 'Start with airflow restrictions',
      summary: 'Weak airflow can reduce comfort, freeze coils, increase humidity, and raise energy use.',
      safeSteps: [
        { title: 'Replace the filter', detail: 'Use the correct size and airflow direction. Avoid overly restrictive filters if airflow is already weak.' },
        { title: 'Open vents and returns', detail: 'Make sure supply and return grilles are open and not blocked.' },
        { title: 'Look for ice', detail: 'If ice is visible, switch to the frozen coil workflow.' }
      ],
      doNotDo: [...stopElectrical],
      callProWhen: ['Airflow remains weak after filter/vent checks.', 'Blower does not run.', 'Ice appears.', 'Only one area has weak airflow and duct/damper trouble is suspected.'],
      homeownerScript: 'Airflow is weak. I checked the filter, supply vents, return grille, and visible ice. Please check blower operation, coil condition, duct restrictions, and static pressure if needed.',
      contractorReportNotes: ['Weak airflow workflow completed.']
    })
  },
  {
    id: 'odor-safety',
    title: 'Odor / Smell Safety Check',
    symptom: 'Burning, chemical, musty, or unusual odor.',
    homeownerGoal: 'Separate urgent stop-use odors from safe filter/drain/cleanliness checks.',
    safetyBoundary: 'Stop-use for burning/electrical smells. No chemical mixing or refrigerant handling.',
    questions: [
      { id: 'burningSmell', type: 'yes_no', prompt: 'Is it a burning, electrical, or melting plastic smell?', helper: 'This is a stop-use condition.' },
      { id: 'chemicalSmell', type: 'yes_no', prompt: 'Is it a strong chemical or sweet smell?', helper: 'Could be refrigerant or another indoor air concern.' },
      { id: 'mustySmell', type: 'yes_no', prompt: 'Is it musty or dirty-sock like?', helper: 'Often related to moisture, drain, coil, filter, or duct conditions.' }
    ],
    evaluate: (answers) => {
      if (answerYes(answers, 'burningSmell')) {
        return baseResult('odor-safety', {
          severity: 'urgent-stop',
          title: 'Stop using the system',
          summary: 'Burning, electrical, or melting plastic odor can indicate an unsafe electrical or motor condition.',
          safeSteps: [{ title: 'Turn system off at thermostat', detail: 'Leave it off until inspected.' }],
          doNotDo: [...stopElectrical, 'Do not continue running the system to see if the smell clears.'],
          callProWhen: ['Call immediately for burning, smoke, buzzing, or repeated breaker trips.'],
          homeownerScript: 'My AC has a burning/electrical smell. I turned it off and need a licensed technician before it runs again.',
          contractorReportNotes: ['Urgent odor workflow: burning/electrical smell reported.']
        });
      }
      return baseResult('odor-safety', {
        severity: answerYes(answers, 'chemicalSmell') ? 'call-pro' : 'safe-check',
        title: answerYes(answers, 'chemicalSmell') ? 'Chemical odor needs professional evaluation' : 'Start with filter and moisture checks',
        summary: 'Musty odors can relate to moisture and biological growth; chemical odors should be evaluated by a professional.',
        safeSteps: [
          { title: 'Replace dirty filter', detail: 'A dirty filter can hold odor and reduce airflow.' },
          { title: 'Check for standing water', detail: 'Look near the indoor unit, pan, and drain line.' },
          { title: 'Improve drying', detail: 'Run fan only if it does not worsen odor and no unsafe smell is present.' }
        ],
        doNotDo: [...refrigerantBoundary, 'Do not mix cleaning chemicals.', 'Do not spray chemicals into the unit or ductwork.'],
        callProWhen: ['Chemical odor is strong.', 'Musty odor persists after filter/drain checks.', 'Water or biological growth is visible.'],
        homeownerScript: 'There is an odor from the AC. I checked the filter and visible water/drain area. Please inspect the coil, drain pan, duct conditions, and refrigerant side if needed.',
        contractorReportNotes: ['Odor workflow completed.']
      });
    }
  },
  {
    id: 'noise-vibration',
    title: 'Noise / Vibration',
    symptom: 'Grinding, buzzing, banging, rattling, or vibration.',
    homeownerGoal: 'Identify stop-use noises and check only safe external items.',
    safetyBoundary: 'Do not open cabinets or reach into fans.',
    questions: [
      { id: 'screechGrinding', type: 'yes_no', prompt: 'Is it screeching, grinding, or metal-on-metal?', helper: 'This can be a motor/bearing/fan issue.' },
      { id: 'buzzingElectrical', type: 'yes_no', prompt: 'Is it loud electrical buzzing?', helper: 'Do not open panels.' },
      { id: 'loosePanelVisible', type: 'yes_no', prompt: 'Is an exterior panel visibly loose?', helper: 'Only tighten accessible exterior screws if safe and power is not required.' }
    ],
    evaluate: (answers) => baseResult('noise-vibration', {
      severity: answerYes(answers, 'screechGrinding') || answerYes(answers, 'buzzingElectrical') ? 'call-pro' : 'safe-check',
      title: 'Noise should be documented before service',
      summary: 'Different noises can point to fan, blower, compressor, motor, contactor, duct, or panel issues.',
      safeSteps: [
        { title: 'Record a short video', detail: 'Capture the sound from a safe distance for the technician.' },
        { title: 'Check for obvious external debris', detail: 'Look around the outdoor unit without removing panels or reaching inside.' },
        { title: 'Stop use for harsh noises', detail: 'Turn the system off if the noise is grinding, screeching, banging, or electrical buzzing.' }
      ],
      doNotDo: [...stopElectrical, 'Do not reach through grilles or fan guards.', 'Do not remove panels to find the sound.'],
      callProWhen: ['Grinding, screeching, buzzing, banging, or vibration continues.', 'The outdoor fan looks unstable.', 'Noise is paired with burning smell or breaker trip.'],
      homeownerScript: 'My AC is making an unusual noise. I recorded it and turned the system off if the sound was severe. Please inspect motors, fans, mounts, panels, and electrical components safely.',
      contractorReportNotes: ['Noise/vibration workflow completed.']
    })
  },
  {
    id: 'quote-validation-safe',
    title: 'Quote / Repair Recommendation Check',
    symptom: 'Homeowner wants to understand a quote or repair recommendation.',
    homeownerGoal: 'Collect facts for a fair second opinion without telling the homeowner to perform unsafe tests.',
    safetyBoundary: 'No diagnostic measurements, electrical tests, refrigerant tests, or disassembly by homeowner.',
    questions: [
      { id: 'hasWrittenQuote', type: 'yes_no', prompt: 'Do you have a written quote or invoice?', helper: 'Written scope is easier to compare.' },
      { id: 'hasPhotos', type: 'yes_no', prompt: 'Do you have photos of the equipment/data plates?', helper: 'Model/serial photos help validate age and parts.' },
      { id: 'majorRepair', type: 'yes_no', prompt: 'Is it a major repair or replacement recommendation?', helper: 'Examples: compressor, coil, refrigerant leak, full system replacement.' }
    ],
    evaluate: (answers) => baseResult('quote-validation-safe', {
      severity: 'safe-check',
      title: 'Prepare a clean second-opinion packet',
      summary: 'A fair quote check needs scope, model/serial information, symptoms, photos, and what testing was performed by the contractor.',
      safeSteps: [
        { title: 'Collect written scope', detail: 'Save the quote, diagnosis, parts listed, labor scope, warranty, and exclusions.' },
        { title: 'Photograph data plates', detail: 'Take clear photos of indoor and outdoor model/serial labels if safely accessible.' },
        { title: 'Ask what was measured', detail: 'Ask the contractor what readings or observations support the recommendation.' }
      ],
      doNotDo: [...stopElectrical, ...refrigerantBoundary, 'Do not challenge a contractor based only on price without comparing scope.'],
      callProWhen: ['The quote involves refrigerant leak, compressor, coil, electrical, gas, combustion, structural, or code work.', 'The scope is unclear or missing model/serial details.'],
      homeownerScript: 'I need a second opinion on this HVAC quote. I have the written scope, equipment photos, symptoms, and any diagnostic notes the first contractor provided.',
      contractorReportNotes: ['Quote validation workflow completed.', answerYes(answers, 'majorRepair') ? 'Major repair/replacement involved.' : 'Major repair not indicated by homeowner.']
    })
  }
];

export function getTroubleshootingWorkflow(id: string) {
  return troubleshootingWorkflows.find((workflow) => workflow.id === id) ?? troubleshootingWorkflows[0];
}

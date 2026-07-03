export type MaintenanceArticle = {
  slug: string;
  title: string;
  category: 'airflow' | 'drain' | 'outdoor-unit' | 'thermostat' | 'humidity' | 'safety';
  summary: string;
  safeDifficulty: 'easy' | 'moderate';
  tools: string[];
  steps: string[];
  whenToCallPro: string[];
};

export const maintenanceLibrary: MaintenanceArticle[] = [
  {
    slug: 'replace-air-filter',
    title: 'Replace your air filter the right way',
    category: 'airflow',
    summary: 'A clogged filter is one of the most common causes of poor airflow, frozen coils, high bills, and comfort complaints.',
    safeDifficulty: 'easy',
    tools: ['Correct-size replacement filter', 'Marker for date'],
    steps: ['Turn the system off at the thermostat.', 'Remove the old filter.', 'Confirm the size printed on the filter frame.', 'Install the new filter with the airflow arrow pointing toward the unit.', 'Write the date on the filter frame.', 'Turn the system back on.'],
    whenToCallPro: ['Filter gets dirty very quickly', 'System freezes even with a clean filter', 'Airflow remains weak']
  },
  {
    slug: 'clear-outdoor-unit-area',
    title: 'Keep the outdoor unit breathing',
    category: 'outdoor-unit',
    summary: 'The outdoor unit needs open airflow to reject heat. Blocked coils and debris can reduce cooling and raise electric use.',
    safeDifficulty: 'easy',
    tools: ['Gloves', 'Garden hose with gentle spray'],
    steps: ['Turn cooling off.', 'Remove leaves and loose debris around the unit.', 'Keep plants trimmed back around the cabinet.', 'Gently rinse the outside coil from the outside only.', 'Do not bend fins or open panels.'],
    whenToCallPro: ['Coil is packed with dirt', 'Fan is noisy or not spinning', 'Unit runs but does not cool']
  },
  {
    slug: 'watch-condensate-drain',
    title: 'Prevent AC drain backups',
    category: 'drain',
    summary: 'Your AC removes humidity from the air. That water must drain safely. Slime, dust, algae, and debris can clog the drain.',
    safeDifficulty: 'moderate',
    tools: ['Wet/dry vacuum if accessible', 'Towels'],
    steps: ['Look for water near the indoor unit.', 'Find the outdoor drain termination if visible.', 'Use a wet/dry vacuum at the drain outlet only if accessible and safe.', 'Avoid harsh chemicals.', 'Install or maintain a water alarm near vulnerable equipment.'],
    whenToCallPro: ['Water is overflowing', 'Float switch has shut the unit off', 'Drain keeps clogging', 'Ceiling or wall damage risk']
  },
  {
    slug: 'thermostat-basic-checks',
    title: 'Thermostat checks before calling',
    category: 'thermostat',
    summary: 'Wrong mode, dead batteries, schedule settings, or Wi-Fi thermostat issues can look like an AC failure.',
    safeDifficulty: 'easy',
    tools: ['Fresh batteries if applicable'],
    steps: ['Set mode to Cool.', 'Lower the setpoint below room temperature.', 'Check the schedule or hold setting.', 'Replace batteries if the thermostat uses them.', 'Wait several minutes for built-in delays.'],
    whenToCallPro: ['Blank thermostat with no battery issue', 'System does not respond', 'Breaker or fuse issue suspected']
  },
  {
    slug: 'humidity-comfort-basics',
    title: 'Why your house feels sticky',
    category: 'humidity',
    summary: 'Cooling and dehumidification are related but not identical. Oversized systems, short runtimes, airflow issues, and duct leakage can leave humidity high.',
    safeDifficulty: 'easy',
    tools: ['Indoor hygrometer'],
    steps: ['Check indoor relative humidity.', 'Use Auto fan mode instead of On during cooling season.', 'Replace dirty filters.', 'Avoid extreme thermostat setbacks in humid climates.', 'Document humidity readings before service.'],
    whenToCallPro: ['Humidity stays high even while cooling', 'Ducts sweat', 'System short cycles', 'Rooms smell musty']
  }
];

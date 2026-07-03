import { ManufacturerDecoderRule } from './systemDecoderTypes';

export const CAPACITY_CODE_TO_TONS: Record<string, number> = {
  '018': 1.5,
  '024': 2,
  '030': 2.5,
  '036': 3,
  '042': 3.5,
  '048': 4,
  '060': 5,
  '072': 6,
  '090': 7.5,
  '120': 10
};

export const BRAND_ALIASES: Record<string, string[]> = {
  goodman: ['goodman', 'amana', 'daikin', 'janitrol'],
  carrier: ['carrier', 'bryant', 'payne', 'day & night', 'day and night', 'heil', 'tempstar', 'comfortmaker', 'arcoaire', 'keeprite', 'icp'],
  lennox: ['lennox', 'ducane', 'concord', 'armstrong air', 'aire-flo'],
  trane: ['trane', 'american standard', 'runtru'],
  rheem: ['rheem', 'ruud', 'weatherking'],
  york: ['york', 'coleman', 'luxaire', 'guardian'],
  nordyne: ['nordyne', 'nortek', 'frigidaire', 'maytag', 'tappan', 'westinghouse', 'broan', 'gibson', 'intertherm', 'miller'],
  bosch: ['bosch'],
  mitsubishi: ['mitsubishi', 'mitsubishi electric'],
  fujitsu: ['fujitsu'],
  lg: ['lg'],
  midea: ['midea'],
  gree: ['gree'],
  mrcool: ['mrcool', 'mr cool', 'mr. cool']
};

export const STARTER_MANUFACTURER_RULES: ManufacturerDecoderRule[] = [
  {
    id: 'goodman-family-common-yy-mm-prefix-001',
    brand: 'Goodman',
    family: 'Goodman / Amana / Daikin residential split systems',
    aliases: BRAND_ALIASES.goodman,
    appliesTo: ['central_ac', 'heat_pump', 'air_handler', 'evaporator_coil', 'package_unit', 'unknown'],
    notes: 'Common residential pattern: serial begins with two-digit year and two-digit month. Model often contains a three-digit nominal BTUH code such as 024, 036, 048, or 060.',
    capacityStrategy: 'btuh_code_anywhere',
    capacityCodeRegex: '(018|024|030|036|042|048|060)',
    ageStrategy: 'year_month_prefix',
    serialRegex: '^(\\d{2})(0[1-9]|1[0-2])',
    monthPosition: 'yy_mm',
    confidenceWhenMatched: 'medium',
    homeownerExplanation: 'This looks like a Goodman-family style number. The serial prefix may indicate year and month, and the model may contain a BTUH size code.',
    verificationStatus: 'starter_rule_needs_verification'
  },
  {
    id: 'carrier-family-capacity-code-001',
    brand: 'Carrier',
    family: 'Carrier / Bryant / Payne / ICP family',
    aliases: BRAND_ALIASES.carrier,
    appliesTo: ['central_ac', 'heat_pump', 'air_handler', 'package_unit', 'unknown'],
    notes: 'Starter rule only. Many Carrier-family model numbers include nominal capacity codes such as 024, 030, 036, 042, 048, or 060. Age decoding varies by brand/era and should not be overclaimed in MVP.',
    capacityStrategy: 'btuh_code_anywhere',
    capacityCodeRegex: '(018|024|030|036|042|048|060)',
    ageStrategy: 'none',
    confidenceWhenMatched: 'low',
    homeownerExplanation: 'This rule can often estimate nominal system size from a common BTUH code, but the serial age pattern needs brand/era verification before the app should make a date claim.',
    verificationStatus: 'starter_rule_needs_verification'
  },
  {
    id: 'lennox-family-capacity-code-001',
    brand: 'Lennox',
    family: 'Lennox / Ducane / Armstrong family',
    aliases: BRAND_ALIASES.lennox,
    appliesTo: ['central_ac', 'heat_pump', 'air_handler', 'package_unit', 'unknown'],
    notes: 'Starter capacity-only rule. Lennox-family model numbers frequently include a nominal BTUH capacity code. Serial age patterns require era-specific validation.',
    capacityStrategy: 'btuh_code_anywhere',
    capacityCodeRegex: '(018|024|030|036|042|048|060)',
    ageStrategy: 'none',
    confidenceWhenMatched: 'low',
    homeownerExplanation: 'This can estimate size when a standard BTUH code is present, but age should remain unconfirmed until the serial rule is verified.',
    verificationStatus: 'starter_rule_needs_verification'
  },
  {
    id: 'trane-american-standard-capacity-code-001',
    brand: 'Trane',
    family: 'Trane / American Standard',
    aliases: BRAND_ALIASES.trane,
    appliesTo: ['central_ac', 'heat_pump', 'air_handler', 'package_unit', 'unknown'],
    notes: 'Starter capacity-only rule. Common model numbers may include nominal BTUH codes; age rules can vary and require manufacturer-specific validation.',
    capacityStrategy: 'btuh_code_anywhere',
    capacityCodeRegex: '(018|024|030|036|042|048|060)',
    ageStrategy: 'none',
    confidenceWhenMatched: 'low',
    homeownerExplanation: 'The model may reveal size, but the serial number age code must be checked against the correct Trane/American Standard era.',
    verificationStatus: 'starter_rule_needs_verification'
  },
  {
    id: 'rheem-ruud-capacity-code-001',
    brand: 'Rheem',
    family: 'Rheem / Ruud',
    aliases: BRAND_ALIASES.rheem,
    appliesTo: ['central_ac', 'heat_pump', 'air_handler', 'package_unit', 'unknown'],
    notes: 'Starter capacity-only rule. Nominal capacity is often represented by BTUH codes in model numbers. Serial date decoding needs validation.',
    capacityStrategy: 'btuh_code_anywhere',
    capacityCodeRegex: '(018|024|030|036|042|048|060)',
    ageStrategy: 'none',
    confidenceWhenMatched: 'low',
    homeownerExplanation: 'The app may estimate size from the model, but age should remain a best-effort or unknown until a verified Rheem/Ruud serial rule is loaded.',
    verificationStatus: 'starter_rule_needs_verification'
  },
  {
    id: 'york-jci-capacity-code-001',
    brand: 'York',
    family: 'York / Coleman / Luxaire / Johnson Controls family',
    aliases: BRAND_ALIASES.york,
    appliesTo: ['central_ac', 'heat_pump', 'air_handler', 'package_unit', 'unknown'],
    notes: 'Starter capacity-only rule. Model numbers may include standard capacity codes. Serial age rules require era-specific validation.',
    capacityStrategy: 'btuh_code_anywhere',
    capacityCodeRegex: '(018|024|030|036|042|048|060)',
    ageStrategy: 'none',
    confidenceWhenMatched: 'low',
    homeownerExplanation: 'The model can sometimes reveal size, but the age result should be withheld unless a verified York-family date code rule matches.',
    verificationStatus: 'starter_rule_needs_verification'
  }
];

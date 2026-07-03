import { BRAND_ALIASES, CAPACITY_CODE_TO_TONS, STARTER_MANUFACTURER_RULES } from './manufacturerRules';
import { AgeDecode, CapacityDecode, DecodeConfidence, DecoderInput, DecoderResult, ManufacturerDecoderRule } from './systemDecoderTypes';

function normalize(value?: string): string {
  return (value || '').trim().toUpperCase().replace(/\s+/g, '').replace(/[^A-Z0-9.-]/g, '');
}

function normalizeBrand(value?: string): string | undefined {
  const raw = (value || '').trim().toLowerCase();
  if (!raw) return undefined;
  for (const [canonical, aliases] of Object.entries(BRAND_ALIASES)) {
    if (aliases.some((alias) => raw.includes(alias))) return canonical;
  }
  return raw;
}

function findRules(brand?: string): ManufacturerDecoderRule[] {
  const normalized = normalizeBrand(brand);
  if (!normalized) return STARTER_MANUFACTURER_RULES;
  return STARTER_MANUFACTURER_RULES.filter((rule) => rule.aliases.some((alias) => normalized.includes(alias) || alias.includes(normalized)) || rule.brand.toLowerCase().includes(normalized));
}

function decodeCapacity(modelNumber: string, rule: ManufacturerDecoderRule): CapacityDecode | undefined {
  if (!rule.capacityStrategy || rule.capacityStrategy === 'none' || !rule.capacityCodeRegex) return undefined;
  const regex = new RegExp(rule.capacityCodeRegex);
  const match = modelNumber.match(regex);
  if (!match?.[1]) return undefined;
  const code = match[1];
  const tons = CAPACITY_CODE_TO_TONS[code];
  if (!tons) return undefined;
  return {
    tons,
    btuh: Math.round(tons * 12000),
    matchedCode: code,
    explanation: `The model number contains capacity code ${code}, which commonly means about ${Math.round(tons * 12000).toLocaleString()} BTU/h or ${tons} tons.`
  };
}

function decodeAge(serialNumber: string, rule: ManufacturerDecoderRule): AgeDecode | undefined {
  if (!rule.ageStrategy || rule.ageStrategy === 'none' || !rule.serialRegex) return undefined;
  const regex = new RegExp(rule.serialRegex);
  const match = serialNumber.match(regex);
  if (!match) return undefined;

  if (rule.ageStrategy === 'year_month_prefix' && match[1] && match[2]) {
    const yy = Number(match[1]);
    const month = Number(match[2]);
    const currentYear = new Date().getFullYear();
    const century = yy > (currentYear % 100) + 1 ? 1900 : 2000;
    const year = century + yy;
    const estimatedAgeYears = Math.max(0, currentYear - year);
    return {
      manufactureYear: year,
      manufactureMonth: month,
      manufactureDateLabel: `${month.toString().padStart(2, '0')}/${year}`,
      estimatedAgeYears,
      matchedCode: `${match[1]}${match[2]}`,
      explanation: `The serial number starts with ${match[1]}${match[2]}, which this starter rule treats as year ${year} and month ${month}.`
    };
  }

  return undefined;
}

function combineConfidence(ruleConfidence: DecodeConfidence, hasAge: boolean, hasCapacity: boolean, brandKnown: boolean): DecodeConfidence {
  if (!hasAge && !hasCapacity) return 'unable';
  if (ruleConfidence === 'medium' && hasAge && hasCapacity && brandKnown) return 'medium';
  if (ruleConfidence === 'high' && (hasAge || hasCapacity) && brandKnown) return 'high';
  return ruleConfidence === 'unable' ? 'unable' : 'low';
}

export function decodeSystem(input: DecoderInput): DecoderResult {
  const normalizedModel = normalize(input.modelNumber);
  const normalizedSerial = normalize(input.serialNumber);
  const normalizedBrandKey = normalizeBrand(input.brand);
  const rules = findRules(input.brand);
  const warnings: string[] = [];
  const confidenceReasons: string[] = [];

  if (!normalizedModel && !normalizedSerial) {
    return {
      normalizedBrand: input.brand,
      normalizedModel,
      normalizedSerial,
      equipmentType: input.equipmentType || 'unknown',
      confidence: 'unable',
      confidenceReasons: ['No model number or serial number was provided.'],
      warnings: ['Take a clear data plate photo or type the model and serial numbers exactly as shown.'],
      homeownerSummary: 'I need a model number, serial number, or clear data plate photo before I can estimate system age or size.',
      technicianSummary: 'No decodable identifiers provided.',
      matchedRuleIds: []
    };
  }

  let selectedRule: ManufacturerDecoderRule | undefined;
  let capacity: CapacityDecode | undefined;
  let age: AgeDecode | undefined;

  for (const rule of rules) {
    const capacityAttempt = normalizedModel ? decodeCapacity(normalizedModel, rule) : undefined;
    const ageAttempt = normalizedSerial ? decodeAge(normalizedSerial, rule) : undefined;
    if (capacityAttempt || ageAttempt) {
      selectedRule = rule;
      capacity = capacityAttempt;
      age = ageAttempt;
      break;
    }
  }

  if (!selectedRule) {
    warnings.push('The app could not match these numbers to a known starter decoder rule. Save the data plate photo and have the manufacturer or a licensed contractor confirm it.');
    return {
      normalizedBrand: input.brand,
      normalizedModel,
      normalizedSerial,
      equipmentType: input.equipmentType || 'unknown',
      confidence: 'unable',
      confidenceReasons: ['No manufacturer decoder rule matched the provided model/serial pattern.'],
      warnings,
      homeownerSummary: 'I could not decode this system yet. The photo and numbers can still be saved to your system profile for a contractor to review.',
      technicianSummary: `Unable to decode. Brand=${input.brand || 'unknown'}, model=${normalizedModel || 'missing'}, serial=${normalizedSerial || 'missing'}.`,
      matchedRuleIds: []
    };
  }

  if (!age) warnings.push('System age could not be safely decoded from the current serial number rule.');
  if (!capacity) warnings.push('System size could not be safely decoded from the current model number rule.');
  if (selectedRule.verificationStatus === 'starter_rule_needs_verification') warnings.push('This is a starter decoder rule and should be verified before being used for warranty, replacement, or legal documentation.');

  if (capacity) confidenceReasons.push(capacity.explanation);
  if (age) confidenceReasons.push(age.explanation);
  confidenceReasons.push(selectedRule.homeownerExplanation);

  const confidence = combineConfidence(selectedRule.confidenceWhenMatched, Boolean(age), Boolean(capacity), Boolean(normalizedBrandKey));
  const ageText = age?.manufactureDateLabel ? `Manufactured around ${age.manufactureDateLabel}` : 'Age not decoded yet';
  const sizeText = capacity?.tons ? `${capacity.tons} tons / about ${capacity.btuh?.toLocaleString()} BTU/h` : 'Size not decoded yet';

  return {
    normalizedBrand: selectedRule.brand,
    normalizedModel,
    normalizedSerial,
    equipmentType: input.equipmentType || 'unknown',
    capacity,
    age,
    confidence,
    confidenceReasons,
    warnings,
    homeownerSummary: `${ageText}. Estimated size: ${sizeText}.`,
    technicianSummary: `Decoded with rule ${selectedRule.id}. Model=${normalizedModel || 'missing'}, serial=${normalizedSerial || 'missing'}, size=${sizeText}, age=${ageText}, confidence=${confidence}.`,
    matchedRuleIds: [selectedRule.id]
  };
}

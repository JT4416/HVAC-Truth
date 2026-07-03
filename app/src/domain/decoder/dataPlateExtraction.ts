import { EquipmentType } from './systemDecoderTypes';

export type ExtractedDataPlateField = {
  value?: string;
  confidence: 'high' | 'medium' | 'low' | 'none';
  source: 'ocr' | 'manual' | 'pattern' | 'unknown';
};

export type DataPlateExtraction = {
  rawText: string;
  brand: ExtractedDataPlateField;
  modelNumber: ExtractedDataPlateField;
  serialNumber: ExtractedDataPlateField;
  equipmentType: ExtractedDataPlateField & { value?: EquipmentType };
  refrigerantType: ExtractedDataPlateField;
  voltage: ExtractedDataPlateField;
  warnings: string[];
  candidates: {
    modelNumbers: string[];
    serialNumbers: string[];
    brands: string[];
  };
};

const BRAND_ALIASES = [
  'goodman', 'amana', 'daikin', 'janitrol',
  'carrier', 'bryant', 'payne', 'heil', 'tempstar', 'comfortmaker', 'arcoaire', 'day & night',
  'lennox', 'ducane', 'armstrong', 'concord', 'aire-flo',
  'trane', 'american standard', 'runtru',
  'rheem', 'ruud', 'weatherking',
  'york', 'coleman', 'luxaire', 'guardian',
  'bosch', 'mitsubishi', 'fujitsu', 'lg', 'gree', 'midea', 'mrcool'
];

function normalizeLine(line: string) {
  return line.replace(/[|]/g, 'I').replace(/\s+/g, ' ').trim();
}

function normalizeCandidate(value: string) {
  return value
    .replace(/[^A-Z0-9\-\.]/gi, '')
    .replace(/O/g, '0')
    .replace(/I(?=\d)/g, '1')
    .toUpperCase();
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function scoreField(value?: string, candidates: string[] = []): ExtractedDataPlateField['confidence'] {
  if (!value) return 'none';
  if (candidates.length === 1) return 'high';
  if (candidates[0] === value) return 'medium';
  return 'low';
}

export function parseDataPlateText(rawText: string): DataPlateExtraction {
  const text = rawText || '';
  const lower = text.toLowerCase();
  const lines = text.split(/\r?\n/).map(normalizeLine).filter(Boolean);
  const joined = lines.join(' ');

  const brands = BRAND_ALIASES.filter((brand) => lower.includes(brand));

  const modelCandidates: string[] = [];
  const serialCandidates: string[] = [];

  for (const line of lines) {
    const upper = line.toUpperCase();
    const modelMatch = upper.match(/(?:MODEL|MOD|M\/N|MODEL NO\.?|MODEL NUMBER)\s*[:#\-]?\s*([A-Z0-9][A-Z0-9\-\.]{3,24})/i);
    if (modelMatch?.[1]) modelCandidates.push(normalizeCandidate(modelMatch[1]));

    const serialMatch = upper.match(/(?:SERIAL|SER|S\/N|SERIAL NO\.?|SERIAL NUMBER)\s*[:#\-]?\s*([A-Z0-9][A-Z0-9\-\.]{4,24})/i);
    if (serialMatch?.[1]) serialCandidates.push(normalizeCandidate(serialMatch[1]));
  }

  // Fallback: HVAC model numbers often contain a BTUH code such as 018/024/030/036/042/048/060.
  const fallbackModelMatches = joined.toUpperCase().match(/\b[A-Z]{1,5}[A-Z0-9\-]*?(018|024|030|036|042|048|060)[A-Z0-9\-\.]{0,12}\b/g) ?? [];
  modelCandidates.push(...fallbackModelMatches.map(normalizeCandidate));

  // Fallback: serial numbers are often long alphanumeric strings near serial words or grouped numeric strings.
  const fallbackSerialMatches = joined.toUpperCase().match(/\b[A-Z0-9]{8,18}\b/g) ?? [];
  serialCandidates.push(...fallbackSerialMatches.map(normalizeCandidate).filter((candidate) => !modelCandidates.includes(candidate)));

  const cleanModels = unique(modelCandidates).slice(0, 5);
  const cleanSerials = unique(serialCandidates).slice(0, 5);
  const cleanBrands = unique(brands.map((brand) => brand.replace(/\b\w/g, (letter) => letter.toUpperCase()))).slice(0, 5);

  const refrigerantMatch = joined.toUpperCase().match(/\bR[- ]?(22|410A|32|454B|407C)\b/);
  const voltageMatch = joined.toUpperCase().match(/\b(115|208|230|240|460)\s*V\b/);

  let equipmentType: EquipmentType | undefined;
  if (/HEAT\s*PUMP/i.test(joined)) equipmentType = 'heat_pump';
  else if (/AIR\s*HANDLER|FAN\s*COIL/i.test(joined)) equipmentType = 'air_handler';
  else if (/FURNACE/i.test(joined)) equipmentType = 'furnace';
  else if (/CONDENSING\s*UNIT|AIR\s*CONDITIONER|A\/C/i.test(joined)) equipmentType = 'central_ac';

  const warnings: string[] = [];
  if (!cleanModels.length) warnings.push('No clear model number was found. Ask the homeowner to retake the photo or type it manually.');
  if (!cleanSerials.length) warnings.push('No clear serial number was found. Ask the homeowner to retake the photo or type it manually.');
  if (cleanModels.length > 1) warnings.push('More than one possible model number was found. The homeowner should confirm the correct value.');
  if (cleanSerials.length > 1) warnings.push('More than one possible serial number was found. The homeowner should confirm the correct value.');

  return {
    rawText: text,
    brand: { value: cleanBrands[0], confidence: scoreField(cleanBrands[0], cleanBrands), source: cleanBrands[0] ? 'ocr' : 'unknown' },
    modelNumber: { value: cleanModels[0], confidence: scoreField(cleanModels[0], cleanModels), source: cleanModels[0] ? 'ocr' : 'unknown' },
    serialNumber: { value: cleanSerials[0], confidence: scoreField(cleanSerials[0], cleanSerials), source: cleanSerials[0] ? 'ocr' : 'unknown' },
    equipmentType: { value: equipmentType, confidence: equipmentType ? 'medium' : 'none', source: equipmentType ? 'pattern' : 'unknown' },
    refrigerantType: { value: refrigerantMatch?.[0]?.replace(' ', '-'), confidence: refrigerantMatch ? 'medium' : 'none', source: refrigerantMatch ? 'ocr' : 'unknown' },
    voltage: { value: voltageMatch?.[0], confidence: voltageMatch ? 'medium' : 'none', source: voltageMatch ? 'ocr' : 'unknown' },
    warnings,
    candidates: {
      modelNumbers: cleanModels,
      serialNumbers: cleanSerials,
      brands: cleanBrands
    }
  };
}

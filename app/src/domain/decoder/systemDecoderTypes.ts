export type DecodeConfidence = 'high' | 'medium' | 'low' | 'unable';

export type EquipmentSide = 'indoor' | 'outdoor' | 'unknown';

export type EquipmentType =
  | 'central_ac'
  | 'heat_pump'
  | 'air_handler'
  | 'furnace'
  | 'evaporator_coil'
  | 'package_unit'
  | 'mini_split'
  | 'unknown';

export type CapacityDecode = {
  tons?: number;
  btuh?: number;
  matchedCode?: string;
  explanation: string;
};

export type AgeDecode = {
  manufactureYear?: number;
  manufactureMonth?: number;
  manufactureDateLabel?: string;
  estimatedAgeYears?: number;
  matchedCode?: string;
  explanation: string;
};

export type DecoderInput = {
  brand?: string;
  modelNumber?: string;
  serialNumber?: string;
  equipmentType?: EquipmentType;
  equipmentSide?: EquipmentSide;
};

export type DecoderResult = {
  normalizedBrand?: string;
  normalizedModel?: string;
  normalizedSerial?: string;
  equipmentType?: EquipmentType;
  capacity?: CapacityDecode;
  age?: AgeDecode;
  confidence: DecodeConfidence;
  confidenceReasons: string[];
  warnings: string[];
  homeownerSummary: string;
  technicianSummary: string;
  matchedRuleIds: string[];
};

export type BrandAlias = {
  brand: string;
  aliases: string[];
  family?: string;
};

export type ManufacturerDecoderRule = {
  id: string;
  brand: string;
  family?: string;
  aliases: string[];
  appliesTo: EquipmentType[];
  notes: string;
  capacityStrategy?: 'btuh_code_anywhere' | 'btuh_code_positioned' | 'none';
  capacityCodeRegex?: string;
  ageStrategy?: 'year_month_prefix' | 'year_week_prefix' | 'none';
  serialRegex?: string;
  monthPosition?: 'yy_mm' | 'yyyy_mm' | 'unknown';
  confidenceWhenMatched: DecodeConfidence;
  homeownerExplanation: string;
  verificationStatus: 'starter_rule_needs_verification' | 'verified_internal' | 'manufacturer_confirmed';
};

import { supabase } from './supabase';
import { HvacSystemProfile } from '../domain/systemProfileTypes';
import { DecoderResult, EquipmentSide } from '../domain/decoder/systemDecoderTypes';
import { DataPlateExtraction } from '../domain/decoder/dataPlateExtraction';

export type ProfileUpsertInput = {
  userId: string;
  email?: string;
  fullName?: string;
  zipCode: string;
};

export type HomeRecord = {
  id: string;
  user_id: string;
  zip_code: string;
  home_type?: string | null;
};

export type HvacSystemRecord = {
  id: string;
  user_id: string;
  home_id?: string | null;
  system_type?: string | null;
  brand?: string | null;
  model_number?: string | null;
  serial_number?: string | null;
  indoor_model_number?: string | null;
  indoor_serial_number?: string | null;
  outdoor_model_number?: string | null;
  outdoor_serial_number?: string | null;
  estimated_age_years?: number | null;
  tonnage?: number | null;
  refrigerant_type?: string | null;
  filter_size?: string | null;
  air_handler_location?: string | null;
  air_handler_location_notes?: string | null;
  access_notes?: string | null;
  notes?: string | null;
  warranty_notes?: string | null;
  decoder_confidence?: string | null;
  decoded_manufacture_year?: number | null;
  decoded_manufacture_month?: number | null;
};

export async function upsertProfile(input: ProfileUpsertInput) {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: input.userId,
      email: input.email,
      full_name: input.fullName,
      zip_code: input.zipCode
    }, { onConflict: 'id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getOrCreatePrimaryHome(userId: string, zipCode: string): Promise<HomeRecord> {
  const { data: existing, error: existingError } = await supabase
    .from('homes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) return existing as HomeRecord;

  const { data, error } = await supabase
    .from('homes')
    .insert({ user_id: userId, zip_code: zipCode })
    .select('*')
    .single();

  if (error) throw error;
  return data as HomeRecord;
}

export async function getPrimarySystem(userId: string): Promise<HvacSystemRecord | null> {
  const { data, error } = await supabase
    .from('hvac_systems')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as HvacSystemRecord | null;
}

export async function saveSystemProfile(userId: string, profile: HvacSystemProfile, fallbackZipCode: string): Promise<HvacSystemRecord> {
  const home = await getOrCreatePrimaryHome(userId, fallbackZipCode);
  const existing = profile.id ? { id: profile.id } : await getPrimarySystem(userId);

  const payload = {
    user_id: userId,
    home_id: home.id,
    system_type: profile.systemType,
    brand: profile.brand || null,
    model_number: profile.outdoorModelNumber || profile.indoorModelNumber || null,
    serial_number: profile.outdoorSerialNumber || profile.indoorSerialNumber || null,
    indoor_model_number: profile.indoorModelNumber || null,
    indoor_serial_number: profile.indoorSerialNumber || null,
    outdoor_model_number: profile.outdoorModelNumber || null,
    outdoor_serial_number: profile.outdoorSerialNumber || null,
    estimated_age_years: profile.estimatedAgeYears ?? null,
    tonnage: profile.tonnage ?? null,
    refrigerant_type: profile.refrigerantType || null,
    filter_size: profile.filterSize || null,
    air_handler_location: profile.airHandlerLocation || null,
    air_handler_location_notes: profile.airHandlerLocationNotes || null,
    access_notes: profile.accessNotes || null,
    warranty_notes: profile.warrantyNotes || null,
    notes: profile.notes || null,
    updated_at: new Date().toISOString()
  };

  if (existing?.id) {
    const { data, error } = await supabase
      .from('hvac_systems')
      .update(payload)
      .eq('id', existing.id)
      .select('*')
      .single();

    if (error) throw error;
    return data as HvacSystemRecord;
  }

  const { data, error } = await supabase
    .from('hvac_systems')
    .insert(payload)
    .select('*')
    .single();

  if (error) throw error;
  return data as HvacSystemRecord;
}

export async function saveDecodeResult(params: {
  userId: string;
  hvacSystemId?: string;
  photoId?: string;
  inputBrand?: string;
  inputModelNumber?: string;
  inputSerialNumber?: string;
  equipmentType?: string;
  equipmentSide?: EquipmentSide;
  extraction?: DataPlateExtraction;
  result: DecoderResult;
  copyToSystemProfile?: boolean;
}) {
  const payload = {
    user_id: params.userId,
    hvac_system_id: params.hvacSystemId ?? null,
    photo_id: params.photoId ?? null,
    input_brand: params.inputBrand ?? null,
    input_model_number: params.inputModelNumber ?? null,
    input_serial_number: params.inputSerialNumber ?? null,
    normalized_brand: params.result.normalizedBrand ?? null,
    normalized_model_number: params.result.normalizedModel ?? null,
    normalized_serial_number: params.result.normalizedSerial ?? null,
    equipment_type: params.equipmentType ?? params.result.equipmentType ?? 'unknown',
    estimated_manufacture_year: params.result.age?.manufactureYear ?? null,
    estimated_manufacture_month: params.result.age?.manufactureMonth ?? null,
    estimated_age_years: params.result.age?.estimatedAgeYears ?? null,
    estimated_tonnage: params.result.capacity?.tons ?? null,
    estimated_btuh: params.result.capacity?.btuh ?? null,
    confidence: params.result.confidence,
    confidence_reasons: params.result.confidenceReasons,
    warnings: params.result.warnings,
    matched_rule_keys: params.result.matchedRuleIds,
    raw_result: params.result,
    raw_ocr_text: params.extraction?.rawText ?? null,
    ocr_extraction: params.extraction ?? null,
    equipment_side: params.equipmentSide ?? 'unknown'
  };

  const { data, error } = await supabase
    .from('system_decode_results')
    .insert(payload)
    .select('*')
    .single();

  if (error) throw error;

  if (params.copyToSystemProfile && params.hvacSystemId) {
    const updatePayload: Record<string, unknown> = {
      decoder_confidence: params.result.confidence,
      decoded_manufacture_year: params.result.age?.manufactureYear ?? null,
      decoded_manufacture_month: params.result.age?.manufactureMonth ?? null,
      decoded_age_source: params.result.age ? 'system_decoder' : null,
      decoded_size_source: params.result.capacity ? 'system_decoder' : null,
      updated_at: new Date().toISOString()
    };

    if (params.result.age?.estimatedAgeYears !== undefined) updatePayload.estimated_age_years = params.result.age.estimatedAgeYears;
    if (params.result.capacity?.tons !== undefined) updatePayload.tonnage = params.result.capacity.tons;
    if (params.result.normalizedBrand) updatePayload.brand = params.result.normalizedBrand;
    if (params.result.normalizedModel) updatePayload.model_number = params.result.normalizedModel;
    if (params.result.normalizedSerial) updatePayload.serial_number = params.result.normalizedSerial;
    if (params.equipmentSide === 'indoor') {
      if (params.result.normalizedModel) updatePayload.indoor_model_number = params.result.normalizedModel;
      if (params.result.normalizedSerial) updatePayload.indoor_serial_number = params.result.normalizedSerial;
    }
    if (params.equipmentSide === 'outdoor' || params.equipmentSide === 'unknown') {
      if (params.result.normalizedModel) updatePayload.outdoor_model_number = params.result.normalizedModel;
      if (params.result.normalizedSerial) updatePayload.outdoor_serial_number = params.result.normalizedSerial;
    }
    if (params.extraction?.refrigerantType.value) updatePayload.refrigerant_type = params.extraction.refrigerantType.value;

    const { error: updateError } = await supabase
      .from('hvac_systems')
      .update(updatePayload)
      .eq('id', params.hvacSystemId);

    if (updateError) throw updateError;
  }

  return data;
}

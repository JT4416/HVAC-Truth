import { supabase } from './supabase';

export type ContractorClaimStatus =
  | 'draft'
  | 'submitted'
  | 'needs_review'
  | 'verified'
  | 'rejected';

export type LeadPreference = 'dashboard' | 'email' | 'phone' | 'sms' | 'website_form';
export type DeliveryMethod = LeadPreference;

export type ContractorProfileClaimInput = {
  contractorId?: string | null;
  businessName: string;
  contactName: string;
  contactRole?: string;
  contactEmail: string;
  contactPhone?: string;
  website?: string;
  licenseNumber?: string;
  serviceZipCodes: string[];
  serviceRadiusMiles?: number;
  emergencyService: boolean;
  leadPreferences: LeadPreference[];
  verificationNotes?: string;
};

export type ContractorClaimRecord = ContractorProfileClaimInput & {
  id: string;
  userId: string;
  claimStatus: ContractorClaimStatus;
  createdAt: string;
  updatedAt: string;
};

function normalizeZipList(value: string[]): string[] {
  return Array.from(
    new Set(
      value
        .map((zip) => zip.trim())
        .filter(Boolean)
    )
  );
}

export function validateContractorClaim(input: ContractorProfileClaimInput): string[] {
  const errors: string[] = [];

  if (!input.businessName.trim()) errors.push('Business name is required.');
  if (!input.contactName.trim()) errors.push('Contact name is required.');
  if (!input.contactEmail.trim()) errors.push('Contact email is required.');
  if (normalizeZipList(input.serviceZipCodes).length === 0) errors.push('At least one service ZIP code is required.');
  if (input.leadPreferences.length === 0) errors.push('Choose at least one delivery method.');

  return errors;
}

export async function submitContractorProfileClaim(input: ContractorProfileClaimInput) {
  const errors = validateContractorClaim(input);
  if (errors.length > 0) {
    return { data: null, error: new Error(errors.join(' ')) };
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getUser();
  if (sessionError || !sessionData.user) {
    return { data: null, error: sessionError || new Error('User must be signed in to claim a contractor profile.') };
  }

  const payload = {
    user_id: sessionData.user.id,
    contractor_id: input.contractorId || null,
    business_name: input.businessName.trim(),
    contact_name: input.contactName.trim(),
    contact_role: input.contactRole?.trim() || null,
    contact_email: input.contactEmail.trim(),
    contact_phone: input.contactPhone?.trim() || null,
    website: input.website?.trim() || null,
    license_number: input.licenseNumber?.trim() || null,
    service_zip_codes: normalizeZipList(input.serviceZipCodes),
    service_radius_miles: input.serviceRadiusMiles || null,
    emergency_service: input.emergencyService,
    lead_preferences: input.leadPreferences,
    verification_notes: input.verificationNotes?.trim() || null,
    claim_status: 'submitted'
  };

  const { data, error } = await supabase
    .from('contractor_profile_claims')
    .insert(payload)
    .select('*')
    .single();

  return { data, error };
}

export async function getMyContractorClaims() {
  const { data: sessionData, error: sessionError } = await supabase.auth.getUser();
  if (sessionError || !sessionData.user) {
    return { data: [], error: sessionError || new Error('User must be signed in.') };
  }

  const { data, error } = await supabase
    .from('contractor_profile_claims')
    .select('*')
    .eq('user_id', sessionData.user.id)
    .order('created_at', { ascending: false });

  return { data: data || [], error };
}

export function getClaimStatusLabel(status: ContractorClaimStatus | string) {
  switch (status) {
    case 'draft':
      return 'Draft';
    case 'submitted':
      return 'Submitted for review';
    case 'needs_review':
      return 'Needs more information';
    case 'verified':
      return 'Verified';
    case 'rejected':
      return 'Not approved';
    default:
      return 'Unknown';
  }
}

export function buildContractorVerificationChecklist(input: ContractorProfileClaimInput) {
  return [
    input.licenseNumber ? 'License number provided' : 'License number missing',
    input.website ? 'Website provided' : 'Website missing',
    input.contactEmail ? 'Contact email provided' : 'Contact email missing',
    normalizeZipList(input.serviceZipCodes).length > 0 ? 'Service area provided' : 'Service area missing',
    input.leadPreferences.length > 0 ? 'Delivery methods selected' : 'Delivery methods missing'
  ];
}

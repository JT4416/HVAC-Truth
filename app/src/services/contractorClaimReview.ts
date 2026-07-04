import { supabase } from './supabase';
import { ContractorClaimStatus, getClaimStatusLabel } from './contractorProfileClaiming';

export type ContractorClaimReviewStatus = ContractorClaimStatus | 'approved_for_dashboard';

export type ContractorClaimReviewRecord = {
  id: string;
  user_id: string;
  contractor_id?: string | null;
  business_name: string;
  contact_name: string;
  contact_role?: string | null;
  contact_email: string;
  contact_phone?: string | null;
  website?: string | null;
  license_number?: string | null;
  service_zip_codes: string[];
  service_radius_miles?: number | null;
  emergency_service: boolean;
  lead_preferences: string[];
  verification_notes?: string | null;
  claim_status: ContractorClaimStatus;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  review_notes?: string | null;
  created_at: string;
  updated_at: string;
};

export type ClaimReviewDecision = 'verified' | 'needs_review' | 'rejected';

export type ClaimReviewInput = {
  claimId: string;
  decision: ClaimReviewDecision;
  reviewNotes?: string;
};

export function normalizeClaimArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean);
  return [];
}

export function mapContractorClaimReviewRecord(row: any): ContractorClaimReviewRecord {
  return {
    ...row,
    service_zip_codes: normalizeClaimArray(row.service_zip_codes),
    lead_preferences: normalizeClaimArray(row.lead_preferences)
  };
}

export async function getPendingContractorClaims() {
  const { data, error } = await supabase
    .from('contractor_profile_claims')
    .select('*')
    .in('claim_status', ['submitted', 'needs_review'])
    .order('created_at', { ascending: true });

  return { data: (data || []).map(mapContractorClaimReviewRecord), error };
}

export async function getContractorClaimForReview(claimId: string) {
  const { data, error } = await supabase
    .from('contractor_profile_claims')
    .select('*')
    .eq('id', claimId)
    .single();

  return { data: data ? mapContractorClaimReviewRecord(data) : null, error };
}

export async function reviewContractorClaim(input: ClaimReviewInput) {
  const { data: sessionData, error: sessionError } = await supabase.auth.getUser();
  if (sessionError || !sessionData.user) {
    return { data: null, error: sessionError || new Error('Reviewer must be signed in.') };
  }

  const { data, error } = await supabase.rpc('review_contractor_profile_claim', {
    claim_id_input: input.claimId,
    reviewer_user_id_input: sessionData.user.id,
    decision_input: input.decision,
    review_notes_input: input.reviewNotes?.trim() || null
  });

  return { data, error };
}

export function getReviewDecisionLabel(decision: ClaimReviewDecision) {
  switch (decision) {
    case 'verified':
      return 'Approve and verify';
    case 'needs_review':
      return 'Request more information';
    case 'rejected':
      return 'Reject claim';
    default:
      return decision;
  }
}

export function buildClaimReviewChecklist(claim: ContractorClaimReviewRecord) {
  return [
    claim.business_name ? 'Business name provided' : 'Business name missing',
    claim.contact_name ? 'Authorized contact provided' : 'Authorized contact missing',
    claim.contact_email ? 'Contact email provided' : 'Contact email missing',
    claim.license_number ? 'License number provided' : 'License number missing',
    claim.website ? 'Website provided' : 'Website missing',
    claim.service_zip_codes.length > 0 ? 'Service ZIP codes provided' : 'Service ZIP codes missing',
    claim.lead_preferences.length > 0 ? 'Lead preferences selected' : 'Lead preferences missing'
  ];
}

export function formatClaimStatus(status: ContractorClaimStatus | string) {
  return getClaimStatusLabel(status);
}

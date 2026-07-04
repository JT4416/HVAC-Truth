import { supabase } from './supabase';
import { getContractorDeliveryMethods } from './contractorDeliveryMethods';

export type ContractorDashboardUser = {
  id: string;
  user_id: string;
  contractor_id: string;
  business_name?: string | null;
  role: 'owner' | 'manager' | 'dispatcher' | 'technician';
  dashboard_status: 'pending' | 'active' | 'suspended';
  verification_status: 'verified' | 'needs_review' | 'rejected';
  created_at: string;
};

export type ContractorDashboardLead = {
  recipientId: string;
  leadRequestId: string;
  contractorId: string;
  contractorName: string;
  status: string;
  deliveryMethod?: string | null;
  createdAt?: string | null;
  leadStatus?: string | null;
  zipCode?: string | null;
  serviceType?: string | null;
  urgency?: string | null;
  symptomSummary?: string | null;
  desiredOutcome?: string | null;
  contactPreference?: string | null;
  preferredTimeWindow?: string | null;
  homeownerName?: string | null;
  homeownerPhone?: string | null;
  homeownerEmail?: string | null;
  reportSnapshot?: Record<string, unknown> | null;
  leadSummary?: string | null;
};

export type ContractorNote = {
  id: string;
  contractor_id: string;
  lead_request_id: string;
  note_body: string;
  created_at: string;
};

function mapLeadRecipient(row: any): ContractorDashboardLead {
  const request = row.contractor_lead_requests || {};
  return {
    recipientId: row.id,
    leadRequestId: row.lead_request_id,
    contractorId: row.contractor_id,
    contractorName: row.contractor_name,
    status: row.recipient_status,
    deliveryMethod: row.delivery_method,
    createdAt: request.created_at,
    leadStatus: request.lead_status,
    zipCode: request.zip_code,
    serviceType: request.service_type,
    urgency: request.urgency,
    symptomSummary: request.symptom_summary,
    desiredOutcome: request.desired_outcome,
    contactPreference: request.contact_preference,
    preferredTimeWindow: request.preferred_time_window,
    homeownerName: request.homeowner_name,
    homeownerPhone: request.homeowner_phone,
    homeownerEmail: request.homeowner_email,
    reportSnapshot: request.report_snapshot,
    leadSummary: request.lead_summary
  };
}

export async function getVerifiedContractorDashboardUsers() {
  const { data: sessionData, error: sessionError } = await supabase.auth.getUser();
  if (sessionError || !sessionData.user) {
    return { data: [], error: sessionError || new Error('User must be signed in to view contractor dashboard.') };
  }

  const { data, error } = await supabase
    .from('contractor_dashboard_users')
    .select('*')
    .eq('user_id', sessionData.user.id)
    .eq('dashboard_status', 'active')
    .eq('verification_status', 'verified')
    .order('created_at', { ascending: false });

  return { data: (data || []) as ContractorDashboardUser[], error };
}

export async function loadContractorDashboardLeads() {
  const access = await getVerifiedContractorDashboardUsers();
  if (access.error) return { data: [], contractors: [], error: access.error };

  const contractorIds = access.data.map((item) => item.contractor_id);
  if (contractorIds.length === 0) return { data: [], contractors: access.data, error: null };

  const { data, error } = await supabase
    .from('contractor_lead_recipients')
    .select('*, contractor_lead_requests(*)')
    .in('contractor_id', contractorIds)
    .eq('delivery_method', 'verified_dashboard')
    .order('created_at', { ascending: false });

  return { data: (data || []).map(mapLeadRecipient), contractors: access.data, error };
}

export async function getContractorDashboardLead(leadRequestId: string) {
  const access = await getVerifiedContractorDashboardUsers();
  if (access.error) return { data: null, notes: [], error: access.error };

  const contractorIds = access.data.map((item) => item.contractor_id);
  if (contractorIds.length === 0) {
    return { data: null, notes: [], error: new Error('No verified contractor dashboard access found.') };
  }

  const { data, error } = await supabase
    .from('contractor_lead_recipients')
    .select('*, contractor_lead_requests(*)')
    .eq('lead_request_id', leadRequestId)
    .eq('delivery_method', 'verified_dashboard')
    .in('contractor_id', contractorIds)
    .single();

  if (error) return { data: null, notes: [], error };

  await recordContractorLeadActivity(data.contractor_id, leadRequestId, 'viewed', 'Lead viewed from contractor dashboard.');
  const notes = await getContractorLeadNotes(data.contractor_id, leadRequestId);
  return { data: mapLeadRecipient(data), notes: notes.data, error: notes.error };
}

export async function updateContractorLeadStatus(
  contractorId: string,
  leadRequestId: string,
  recipientStatus: 'accepted' | 'declined' | 'scheduled'
) {
  const { data, error } = await supabase
    .from('contractor_lead_recipients')
    .update({ recipient_status: recipientStatus, updated_at: new Date().toISOString() })
    .eq('contractor_id', contractorId)
    .eq('lead_request_id', leadRequestId)
    .eq('delivery_method', 'verified_dashboard')
    .select('*')
    .single();

  if (!error) {
    await recordContractorLeadActivity(contractorId, leadRequestId, recipientStatus, `Lead marked ${recipientStatus}.`);
  }

  return { data, error };
}

export async function recordContractorLeadActivity(
  contractorId: string,
  leadRequestId: string,
  activityType: 'viewed' | 'accepted' | 'declined' | 'scheduled' | 'note_added' | 'delivery_methods_updated',
  activitySummary?: string
) {
  const { data: sessionData } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('contractor_lead_activity')
    .insert({
      contractor_id: contractorId,
      lead_request_id: leadRequestId,
      user_id: sessionData.user?.id ?? null,
      activity_type: activityType,
      activity_summary: activitySummary ?? null
    })
    .select('*')
    .single();

  return { data, error };
}

export async function getContractorLeadNotes(contractorId: string, leadRequestId: string) {
  const { data, error } = await supabase
    .from('contractor_notes')
    .select('*')
    .eq('contractor_id', contractorId)
    .eq('lead_request_id', leadRequestId)
    .order('created_at', { ascending: false });

  return { data: (data || []) as ContractorNote[], error };
}

export async function addContractorLeadNote(contractorId: string, leadRequestId: string, noteBody: string) {
  const { data: sessionData } = await supabase.auth.getUser();
  const cleanNote = noteBody.trim();
  if (!cleanNote) return { data: null, error: new Error('Note cannot be blank.') };

  const { data, error } = await supabase
    .from('contractor_notes')
    .insert({
      contractor_id: contractorId,
      lead_request_id: leadRequestId,
      user_id: sessionData.user?.id ?? null,
      note_body: cleanNote
    })
    .select('*')
    .single();

  if (!error) await recordContractorLeadActivity(contractorId, leadRequestId, 'note_added', 'Contractor note added.');
  return { data, error };
}

export async function getContractorDashboardDeliveryMethods(contractorId: string) {
  return getContractorDeliveryMethods(contractorId);
}

export async function getContractorLeadPreferences(contractorId: string) {
  return getContractorDeliveryMethods(contractorId);
}

export async function getContractorAvailabilityWindows(contractorId: string) {
  const { data, error } = await supabase
    .from('contractor_availability_windows')
    .select('*')
    .eq('contractor_id', contractorId)
    .eq('active', true)
    .order('day_of_week', { ascending: true });

  return { data: data || [], error };
}

export function formatLeadServiceType(value?: string | null) {
  const labels: Record<string, string> = {
    no_cooling: 'AC is not cooling',
    not_turning_on: 'System will not turn on',
    water_leak: 'Water leaking / drain issue',
    noise: 'Noise or vibration',
    maintenance: 'Maintenance visit',
    quote_second_opinion: 'Quote second opinion',
    replacement_estimate: 'Replacement estimate',
    other: 'Other request'
  };
  return value ? labels[value] ?? value : 'Unknown service type';
}

export function formatLeadUrgency(value?: string | null) {
  const labels: Record<string, string> = {
    emergency_today: 'Emergency / today',
    within_24_hours: 'Within 24 hours',
    this_week: 'This week',
    planning_ahead: 'Planning ahead'
  };
  return value ? labels[value] ?? value : 'Unknown urgency';
}

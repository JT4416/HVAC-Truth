import { supabase } from './supabase';
import { ContractorParticipationStatus, buildContractorParticipationDecision } from './contractorParticipationRules';
import { SelectedContractor } from './contractorLeadFlow';

export type ContractorParticipationAdminRecord = SelectedContractor & {
  id: string;
  business_name?: string | null;
  hvac_truth_verified?: boolean | null;
  accepts_dashboard_leads?: boolean | null;
  hvac_truth_participation_status?: ContractorParticipationStatus | 'inactive' | 'suspended' | null;
  participation_paused?: boolean | null;
  participation_pause_reason?: string | null;
  service_zip_codes?: string[] | null;
  emergency_service?: boolean | null;
  max_daily_dashboard_leads?: number | null;
  max_weekly_dashboard_leads?: number | null;
  accepts_all_eligible_lead_types?: boolean | null;
};

export type ParticipationUpdateInput = {
  contractorId: string;
  participationStatus?: 'active' | 'inactive' | 'paused' | 'suspended';
  paused?: boolean;
  pauseReason?: string;
  serviceZipCodes?: string[];
  emergencyService?: boolean;
  maxDailyDashboardLeads?: number | null;
  maxWeeklyDashboardLeads?: number | null;
};

function normalizeArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return [];
}

function mapContractor(row: any): ContractorParticipationAdminRecord {
  return {
    ...row,
    id: row.id,
    businessName: row.business_name,
    hvacTruthVerified: row.hvac_truth_verified,
    acceptsDashboardLeads: row.accepts_dashboard_leads,
    emergencyService: row.emergency_service,
    serviceZipCodes: normalizeArray(row.service_zip_codes),
    service_zip_codes: normalizeArray(row.service_zip_codes)
  };
}

export async function getParticipationContractors() {
  const { data, error } = await supabase
    .from('contractors')
    .select('id, business_name, phone, website, published_email, hvac_truth_verified, accepts_dashboard_leads, hvac_truth_participation_status, participation_paused, participation_pause_reason, service_zip_codes, emergency_service, max_daily_dashboard_leads, max_weekly_dashboard_leads, accepts_all_eligible_lead_types')
    .eq('hvac_truth_verified', true)
    .order('business_name', { ascending: true });

  return { data: (data || []).map(mapContractor), error };
}

export async function getParticipationContractor(contractorId: string) {
  const { data, error } = await supabase
    .from('contractors')
    .select('id, business_name, phone, website, published_email, hvac_truth_verified, accepts_dashboard_leads, hvac_truth_participation_status, participation_paused, participation_pause_reason, service_zip_codes, emergency_service, max_daily_dashboard_leads, max_weekly_dashboard_leads, accepts_all_eligible_lead_types')
    .eq('id', contractorId)
    .single();

  return { data: data ? mapContractor(data) : null, error };
}

export async function updateContractorParticipation(input: ParticipationUpdateInput) {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (input.participationStatus !== undefined) {
    patch.hvac_truth_participation_status = input.participationStatus;
    patch.accepts_dashboard_leads = input.participationStatus === 'active';
  }
  if (input.paused !== undefined) patch.participation_paused = input.paused;
  if (input.pauseReason !== undefined) patch.participation_pause_reason = input.pauseReason.trim() || null;
  if (input.serviceZipCodes !== undefined) patch.service_zip_codes = input.serviceZipCodes.map((zip) => zip.trim()).filter(Boolean);
  if (input.emergencyService !== undefined) patch.emergency_service = input.emergencyService;
  if (input.maxDailyDashboardLeads !== undefined) patch.max_daily_dashboard_leads = input.maxDailyDashboardLeads;
  if (input.maxWeeklyDashboardLeads !== undefined) patch.max_weekly_dashboard_leads = input.maxWeeklyDashboardLeads;

  patch.accepts_all_eligible_lead_types = true;

  const { data, error } = await supabase
    .from('contractors')
    .update(patch)
    .eq('id', input.contractorId)
    .select('*')
    .single();

  if (!error) {
    await supabase.from('app_events').insert({
      event_name: 'contractor_participation_updated',
      event_payload: {
        contractorId: input.contractorId,
        participationStatus: input.participationStatus,
        paused: input.paused,
        serviceZipCodes: input.serviceZipCodes,
        emergencyService: input.emergencyService,
        maxDailyDashboardLeads: input.maxDailyDashboardLeads,
        maxWeeklyDashboardLeads: input.maxWeeklyDashboardLeads
      }
    });
  }

  return { data: data ? mapContractor(data) : null, error };
}

export function buildAdminParticipationSummary(contractor: ContractorParticipationAdminRecord, zipCode?: string) {
  const decision = buildContractorParticipationDecision({ contractor, zipCode });
  return {
    ...decision,
    adminSummary: `${contractor.businessName || contractor.business_name || 'Contractor'} is ${decision.label.toLowerCase()}. ${decision.reason}`
  };
}

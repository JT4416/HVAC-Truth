import { supabase } from './supabase';
import { SelectedContractor } from './contractorLeadFlow';
import { ContractorContactRoute, detectContractorContactRoute } from './contractorContactRouting';
import { buildContractorParticipationDecision } from './contractorParticipationRules';

export type VerifiedLeadRoutingDecision = {
  contractor: SelectedContractor;
  route: ContractorContactRoute;
  dashboardReady: boolean;
  reason: string;
  participationLabel?: string;
  participationStatus?: string;
};

export type VerifiedContractorRoutingRecord = {
  id: string;
  business_name: string;
  hvac_truth_verified: boolean;
  accepts_dashboard_leads: boolean;
  service_zip_codes?: string[] | null;
  emergency_service?: boolean | null;
};

function normalizeArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean);
  return [];
}

function buildPublicRoutingProfile(contractor: SelectedContractor): SelectedContractor {
  return { ...contractor, hvacTruthVerified: false, acceptsDashboardLeads: false };
}

export function getContractorId(contractor: SelectedContractor) {
  return contractor.id || contractor.contractorId || null;
}

export function isDashboardEligibleContractor(contractor: SelectedContractor, zipCode?: string) {
  return buildContractorParticipationDecision({ contractor, zipCode }).eligibleForVerifiedRouting;
}

export function getLeadDeliveryRoute(contractor: SelectedContractor, zipCode?: string) {
  if (isDashboardEligibleContractor(contractor, zipCode)) return detectContractorContactRoute(contractor);
  return detectContractorContactRoute(buildPublicRoutingProfile(contractor));
}

export function buildVerifiedLeadRoutingDecision(contractor: SelectedContractor, zipCode?: string): VerifiedLeadRoutingDecision {
  const participation = buildContractorParticipationDecision({ contractor, zipCode });
  const route = getLeadDeliveryRoute(contractor, zipCode);
  const dashboardReady = route.preferredMethod === 'verified_dashboard' && participation.eligibleForVerifiedRouting;

  return {
    contractor,
    route,
    dashboardReady,
    reason: dashboardReady
      ? 'Contractor is verified, participating in the all-or-nothing HVAC Truth lead network, and inside operational routing limits.'
      : participation.reason,
    participationLabel: participation.label,
    participationStatus: participation.status
  };
}

export function buildVerifiedLeadRoutingDecisions(contractors: SelectedContractor[], zipCode?: string) {
  return contractors.map((contractor) => buildVerifiedLeadRoutingDecision(contractor, zipCode));
}

export async function getVerifiedDashboardContractorsByZip(zipCode: string) {
  const { data, error } = await supabase
    .from('contractors')
    .select('id, business_name, hvac_truth_verified, accepts_dashboard_leads, service_zip_codes, emergency_service')
    .eq('hvac_truth_verified', true)
    .eq('accepts_dashboard_leads', true);

  if (error) return { data: [], error };

  const matches = (data || [])
    .map((contractor: any) => ({ ...contractor, service_zip_codes: normalizeArray(contractor.service_zip_codes) }))
    .filter((contractor: VerifiedContractorRoutingRecord) => {
      const zips = normalizeArray(contractor.service_zip_codes);
      return zips.length === 0 || zips.includes(zipCode);
    });

  return { data: matches as VerifiedContractorRoutingRecord[], error: null };
}

export function getDashboardRoutingSummary(decisions: VerifiedLeadRoutingDecision[]) {
  const dashboardCount = decisions.filter((decision) => decision.dashboardReady).length;
  const publicRouteCount = decisions.length - dashboardCount;
  return {
    dashboardCount,
    publicRouteCount,
    summary: dashboardCount > 0
      ? `${dashboardCount} verified contractor(s) can receive this lead directly under the HVAC Truth all-or-nothing participation standard. ${publicRouteCount} contractor(s) will use public-contact routing or are outside operational limits.`
      : 'No selected contractors are currently eligible for direct dashboard delivery. Public-contact routing will be used.'
  };
}

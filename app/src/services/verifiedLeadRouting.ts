import { supabase } from './supabase';
import { SelectedContractor } from './contractorLeadFlow';
import { ContractorContactRoute, detectContractorContactRoute } from './contractorContactRouting';

export type VerifiedLeadRoutingDecision = {
  contractor: SelectedContractor;
  route: ContractorContactRoute;
  dashboardReady: boolean;
  reason: string;
};

export type VerifiedContractorRoutingRecord = {
  id: string;
  business_name: string;
  hvac_truth_verified: boolean;
  accepts_dashboard_leads: boolean;
  service_zip_codes?: string[] | null;
  lead_preferences?: string[] | null;
};

function normalizeArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean);
  return [];
}

function buildPublicRoutingProfile(contractor: SelectedContractor): SelectedContractor {
  return {
    ...contractor,
    hvacTruthVerified: false,
    acceptsDashboardLeads: false
  };
}

export function getContractorId(contractor: SelectedContractor) {
  return contractor.id || contractor.contractorId || null;
}

export function isDashboardEligibleContractor(contractor: SelectedContractor) {
  return Boolean(contractor.hvacTruthVerified && contractor.acceptsDashboardLeads && getContractorId(contractor));
}

export function getLeadDeliveryRoute(contractor: SelectedContractor) {
  if (isDashboardEligibleContractor(contractor)) {
    return detectContractorContactRoute(contractor);
  }

  return detectContractorContactRoute(buildPublicRoutingProfile(contractor));
}

export function buildVerifiedLeadRoutingDecision(contractor: SelectedContractor): VerifiedLeadRoutingDecision {
  const route = getLeadDeliveryRoute(contractor);
  const dashboardReady = route.preferredMethod === 'verified_dashboard' && isDashboardEligibleContractor(contractor);

  return {
    contractor,
    route,
    dashboardReady,
    reason: dashboardReady
      ? 'Contractor is HVAC Truth verified, has a contractor profile ID, and accepts dashboard leads.'
      : 'Contractor is not eligible for direct dashboard delivery and should use public-contact routing.'
  };
}

export function buildVerifiedLeadRoutingDecisions(contractors: SelectedContractor[]) {
  return contractors.map(buildVerifiedLeadRoutingDecision);
}

export async function getVerifiedDashboardContractorsByZip(zipCode: string) {
  const { data, error } = await supabase
    .from('contractors')
    .select('id, business_name, hvac_truth_verified, accepts_dashboard_leads, service_zip_codes, lead_preferences')
    .eq('hvac_truth_verified', true)
    .eq('accepts_dashboard_leads', true);

  if (error) return { data: [], error };

  const matches = (data || [])
    .map((contractor: any) => ({
      ...contractor,
      service_zip_codes: normalizeArray(contractor.service_zip_codes),
      lead_preferences: normalizeArray(contractor.lead_preferences)
    }))
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
    summary:
      dashboardCount > 0
        ? `${dashboardCount} verified contractor(s) can receive this lead directly in HVAC Truth. ${publicRouteCount} contractor(s) will use public-contact routing.`
        : 'No selected contractors are verified for direct dashboard delivery yet. Public-contact routing will be used.'
  };
}

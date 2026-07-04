import { SelectedContractor } from './contractorLeadFlow';

export type ContractorParticipationStatus = 'participating' | 'not_participating' | 'paused' | 'outside_service_area' | 'capacity_limited';

export type ContractorParticipationInput = {
  contractor: SelectedContractor & {
    participationPaused?: boolean;
    paused?: boolean;
    serviceZipCodes?: string[];
    service_zip_codes?: string[];
    maxDailyLeads?: number;
    dailyLeadCount?: number;
    maxWeeklyLeads?: number;
    weeklyLeadCount?: number;
  };
  zipCode?: string;
};

export type ContractorParticipationDecision = {
  contractor: SelectedContractor;
  status: ContractorParticipationStatus;
  eligibleForVerifiedRouting: boolean;
  label: string;
  reason: string;
  policySummary: string;
  operationalLimits: string[];
};

function normalizeArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return [];
}

function isVerifiedNetworkParticipant(contractor: SelectedContractor) {
  return Boolean(contractor.hvacTruthVerified && contractor.acceptsDashboardLeads && (contractor.id || contractor.contractorId));
}

export const VERIFIED_CONTRACTOR_PARTICIPATION_STANDARD = [
  'Verified contractors are either in or out of the HVAC Truth lead network.',
  'Verified contractors accept all eligible homeowner HVAC Truth lead types inside their service area.',
  'Verified contractors may define service area, emergency availability, temporary pause status, and capacity limits.',
  'Verified contractors may not cherry-pick only replacement estimates, easy calls, high-dollar calls, or high-score packets.',
  'Packet score is informational. It is not a lead-type exclusion filter.',
  'Thin packets, emergency calls, second opinions, maintenance requests, leaks, no-cooling calls, and replacement estimates are part of the network standard.'
];

export function buildContractorParticipationDecision(input: ContractorParticipationInput): ContractorParticipationDecision {
  const contractor = input.contractor;
  const serviceZipCodes = normalizeArray(contractor.serviceZipCodes ?? contractor.service_zip_codes);
  const zipCode = input.zipCode?.trim();
  const paused = Boolean(contractor.participationPaused || contractor.paused);
  const dailyLimitReached = typeof contractor.maxDailyLeads === 'number' && typeof contractor.dailyLeadCount === 'number' && contractor.dailyLeadCount >= contractor.maxDailyLeads;
  const weeklyLimitReached = typeof contractor.maxWeeklyLeads === 'number' && typeof contractor.weeklyLeadCount === 'number' && contractor.weeklyLeadCount >= contractor.maxWeeklyLeads;
  const outsideServiceArea = Boolean(zipCode && serviceZipCodes.length && !serviceZipCodes.includes(zipCode));
  const operationalLimits = [
    serviceZipCodes.length ? `Service ZIPs: ${serviceZipCodes.join(', ')}` : 'Service area: not restricted in app yet',
    contractor.emergencyService ? 'Emergency availability: yes' : 'Emergency availability: standard hours only',
    typeof contractor.maxDailyLeads === 'number' ? `Daily capacity: ${contractor.dailyLeadCount ?? 0}/${contractor.maxDailyLeads}` : 'Daily capacity: not capped in app yet',
    typeof contractor.maxWeeklyLeads === 'number' ? `Weekly capacity: ${contractor.weeklyLeadCount ?? 0}/${contractor.maxWeeklyLeads}` : 'Weekly capacity: not capped in app yet'
  ];

  if (!isVerifiedNetworkParticipant(contractor)) {
    return {
      contractor,
      status: 'not_participating',
      eligibleForVerifiedRouting: false,
      label: 'Not participating',
      reason: 'Contractor is not fully opted into verified HVAC Truth dashboard lead delivery.',
      policySummary: VERIFIED_CONTRACTOR_PARTICIPATION_STANDARD.join(' '),
      operationalLimits
    };
  }

  if (paused) {
    return {
      contractor,
      status: 'paused',
      eligibleForVerifiedRouting: false,
      label: 'Paused',
      reason: 'Contractor is verified but temporarily paused from HVAC Truth lead routing.',
      policySummary: VERIFIED_CONTRACTOR_PARTICIPATION_STANDARD.join(' '),
      operationalLimits
    };
  }

  if (outsideServiceArea) {
    return {
      contractor,
      status: 'outside_service_area',
      eligibleForVerifiedRouting: false,
      label: 'Outside service area',
      reason: `ZIP ${zipCode} is outside this contractor's active service area.`,
      policySummary: VERIFIED_CONTRACTOR_PARTICIPATION_STANDARD.join(' '),
      operationalLimits
    };
  }

  if (dailyLimitReached || weeklyLimitReached) {
    return {
      contractor,
      status: 'capacity_limited',
      eligibleForVerifiedRouting: false,
      label: 'Capacity limit reached',
      reason: 'Contractor is verified but has reached an operational lead volume limit.',
      policySummary: VERIFIED_CONTRACTOR_PARTICIPATION_STANDARD.join(' '),
      operationalLimits
    };
  }

  return {
    contractor,
    status: 'participating',
    eligibleForVerifiedRouting: true,
    label: 'Participating',
    reason: 'Contractor is in the HVAC Truth lead network and accepts all eligible lead types inside operational limits.',
    policySummary: VERIFIED_CONTRACTOR_PARTICIPATION_STANDARD.join(' '),
    operationalLimits
  };
}

export function buildParticipationSummary(decisions: ContractorParticipationDecision[]) {
  const participating = decisions.filter((decision) => decision.eligibleForVerifiedRouting).length;
  const limited = decisions.length - participating;
  return {
    participating,
    limited,
    summary: participating > 0
      ? `${participating} verified contractor(s) are participating under the all-or-nothing HVAC Truth lead standard. ${limited} contractor(s) are outside routing limits or not opted in.`
      : 'No selected contractors are currently participating in verified HVAC Truth dashboard lead routing.'
  };
}

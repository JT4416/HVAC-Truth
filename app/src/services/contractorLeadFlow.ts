import { supabase } from './supabase';
import { getPrimarySystem, getProfile, HvacSystemRecord } from './profilePersistence';
import { detectContractorContactRoute, ContractorContactProfile } from './contractorContactRouting';
import { buildVerifiedLeadRoutingDecisions, getContractorId } from './verifiedLeadRouting';

export type LeadServiceType =
  | 'no_cooling'
  | 'not_turning_on'
  | 'water_leak'
  | 'noise'
  | 'maintenance'
  | 'quote_second_opinion'
  | 'replacement_estimate'
  | 'other';

export type LeadUrgency = 'emergency_today' | 'within_24_hours' | 'this_week' | 'planning_ahead';
export type ContactPreference = 'phone' | 'text' | 'email' | 'app_message';

export type SelectedContractor = ContractorContactProfile & {
  id?: string;
  verified?: boolean;
  emergencyService?: boolean;
};

export type ContractorLeadRequestInput = {
  userId: string;
  hvacSystemId?: string;
  zipCode: string;
  serviceType: LeadServiceType;
  urgency: LeadUrgency;
  symptomSummary: string;
  desiredOutcome: string;
  contactPreference: ContactPreference;
  preferredTimeWindow?: string;
  homeownerName?: string;
  homeownerPhone?: string;
  homeownerEmail?: string;
  attachContractorReport: boolean;
  selectedContractors: SelectedContractor[];
  reportSnapshot?: Record<string, unknown>;
};

export type LeadRequestRecord = {
  id: string;
  user_id: string;
  hvac_system_id?: string | null;
  zip_code: string;
  service_type: string;
  urgency: string;
  lead_status: string;
  created_at: string;
};

export const SERVICE_TYPE_OPTIONS: { label: string; value: LeadServiceType; contractorContext: string }[] = [
  { label: 'AC is not cooling', value: 'no_cooling', contractorContext: 'Possible no-cooling call. Contractor should expect basic diagnostics and verify airflow, power, refrigerant circuit, and outdoor unit operation.' },
  { label: 'System will not turn on', value: 'not_turning_on', contractorContext: 'Possible power, thermostat, safety switch, float switch, transformer, fuse, or control issue.' },
  { label: 'Water leaking / drain issue', value: 'water_leak', contractorContext: 'Possible condensate drain clog, pan issue, float switch, trap, slope, or secondary drain condition.' },
  { label: 'Noise or vibration', value: 'noise', contractorContext: 'Possible blower, condenser fan, compressor, loose panel, duct vibration, or mounting issue.' },
  { label: 'Maintenance visit', value: 'maintenance', contractorContext: 'Routine service request. Contractor should review filter size, indoor/outdoor access, and service history.' },
  { label: 'Quote second opinion', value: 'quote_second_opinion', contractorContext: 'Homeowner wants review or comparison of a prior quote. Contractor should ask for prior scope and photos.' },
  { label: 'Replacement estimate', value: 'replacement_estimate', contractorContext: 'Potential changeout estimate. System age, tonnage, air handler location, photos, electrical, drain, ductwork, and access are important.' },
  { label: 'Something else', value: 'other', contractorContext: 'General HVAC request. Contractor should review homeowner notes before scheduling.' }
];

export const URGENCY_OPTIONS: { label: string; value: LeadUrgency; note: string }[] = [
  { label: 'Emergency / today', value: 'emergency_today', note: 'Prioritize contractors that offer emergency service.' },
  { label: 'Within 24 hours', value: 'within_24_hours', note: 'Good fit for no cooling, leaks, or urgent comfort issues.' },
  { label: 'This week', value: 'this_week', note: 'Good for maintenance, non-emergency repairs, and second opinions.' },
  { label: 'Planning ahead', value: 'planning_ahead', note: 'Good for replacement planning, upgrades, and budgeting.' }
];

export const DEMO_CONTRACTORS: SelectedContractor[] = [
  {
    businessName: 'Summit Air Solutions',
    phone: '(555) 010-4411',
    website: 'https://example-summit-air.com',
    contactPageUrl: 'https://example-summit-air.com/contact',
    publishedEmail: 'service@example-summit-air.com',
    rating: 4.9,
    reviewCount: 246,
    distanceMiles: 0.8,
    verified: true,
    emergencyService: true,
    hvacTruthVerified: true,
    acceptsDashboardLeads: true
  },
  {
    businessName: 'Coastal Comfort HVAC',
    phone: '(555) 010-7722',
    website: 'https://example-coastal-comfort.com',
    contactPageUrl: 'https://example-coastal-comfort.com/request-service',
    rating: 4.8,
    reviewCount: 189,
    distanceMiles: 1.6,
    verified: true,
    emergencyService: true,
    hvacTruthVerified: false
  },
  {
    businessName: 'Precision Climate Pros',
    phone: '(555) 010-3838',
    googleMapsUrl: 'https://maps.google.com',
    rating: 4.7,
    reviewCount: 132,
    distanceMiles: 2.3,
    verified: true,
    emergencyService: false,
    hvacTruthVerified: false
  }
];

export function createContractorReportSnapshot(system: HvacSystemRecord | null, zipCode: string) {
  if (!system) return { zipCode, profileStatus: 'no_system_saved' };

  return {
    zipCode,
    systemType: system.system_type,
    brand: system.brand,
    estimatedAgeYears: system.estimated_age_years,
    tonnage: system.tonnage,
    refrigerantType: system.refrigerant_type,
    filterSize: system.filter_size,
    indoorModelNumber: system.indoor_model_number,
    indoorSerialNumber: system.indoor_serial_number,
    outdoorModelNumber: system.outdoor_model_number,
    outdoorSerialNumber: system.outdoor_serial_number,
    airHandlerLocation: system.air_handler_location,
    airHandlerLocationNotes: system.air_handler_location_notes,
    accessNotes: system.access_notes,
    decoderConfidence: system.decoder_confidence,
    homeownerNotes: system.notes
  };
}

export function buildLeadSummary(input: ContractorLeadRequestInput) {
  const service = SERVICE_TYPE_OPTIONS.find((option) => option.value === input.serviceType);
  const urgency = URGENCY_OPTIONS.find((option) => option.value === input.urgency);
  const routingDecisions = buildVerifiedLeadRoutingDecisions(input.selectedContractors);
  const dashboardCount = routingDecisions.filter((decision) => decision.dashboardReady).length;

  return [
    'HVAC Truth Contractor Lead Request',
    '',
    `ZIP code: ${input.zipCode}`,
    `Service type: ${service?.label ?? input.serviceType}`,
    `Urgency: ${urgency?.label ?? input.urgency}`,
    `Preferred contact: ${input.contactPreference}`,
    `Preferred time window: ${input.preferredTimeWindow || 'Not provided'}`,
    `Verified dashboard recipients: ${dashboardCount}`,
    '',
    'Homeowner issue summary:',
    input.symptomSummary || 'Not provided',
    '',
    'Desired outcome:',
    input.desiredOutcome || 'Not provided',
    '',
    'Contractor context:',
    service?.contractorContext ?? 'Review request details and system report before scheduling.',
    '',
    input.attachContractorReport ? 'Contractor-ready system report attached/included.' : 'Homeowner did not attach system report.'
  ].join('\n');
}

export async function loadLeadFlowDefaults(userId: string) {
  const profile = await getProfile(userId);
  const system = await getPrimarySystem(userId);
  const zipCode = profile?.zip_code ?? 'Not provided';
  return { profile, system, zipCode, reportSnapshot: createContractorReportSnapshot(system, zipCode) };
}

export async function submitContractorLeadRequest(input: ContractorLeadRequestInput): Promise<LeadRequestRecord> {
  const leadSummary = buildLeadSummary(input);
  const routingDecisions = buildVerifiedLeadRoutingDecisions(input.selectedContractors);

  const { data: request, error } = await supabase
    .from('contractor_lead_requests')
    .insert({
      user_id: input.userId,
      hvac_system_id: input.hvacSystemId ?? null,
      zip_code: input.zipCode,
      service_type: input.serviceType,
      urgency: input.urgency,
      symptom_summary: input.symptomSummary,
      desired_outcome: input.desiredOutcome,
      contact_preference: input.contactPreference,
      preferred_time_window: input.preferredTimeWindow ?? null,
      homeowner_name: input.homeownerName ?? null,
      homeowner_phone: input.homeownerPhone ?? null,
      homeowner_email: input.homeownerEmail ?? null,
      attach_contractor_report: input.attachContractorReport,
      report_snapshot: input.reportSnapshot ?? {},
      selected_contractors: input.selectedContractors,
      lead_summary: leadSummary,
      lead_status: 'submitted'
    })
    .select('*')
    .single();

  if (error) throw error;

  const recipients = routingDecisions.map((decision) => {
    const contractor = decision.contractor;
    const route = decision.dashboardReady ? decision.route : detectContractorContactRoute(contractor);
    return {
      user_id: input.userId,
      lead_request_id: request.id,
      contractor_id: getContractorId(contractor),
      contractor_name: contractor.businessName,
      contractor_phone: contractor.phone ?? null,
      contractor_email: contractor.publishedEmail ?? null,
      contractor_website: contractor.website ?? null,
      contractor_contact_page_url: contractor.contactPageUrl ?? null,
      delivery_method: route.preferredMethod,
      delivery_destination: route.destination ?? null,
      route_instructions: route.instructions,
      homeowner_action_required: route.requiresHomeownerAction,
      recipient_status: decision.dashboardReady ? 'sent' : 'selected'
    };
  });

  if (recipients.length) {
    const { error: recipientError } = await supabase.from('contractor_lead_recipients').insert(recipients);
    if (recipientError) throw recipientError;
  }

  return request as LeadRequestRecord;
}

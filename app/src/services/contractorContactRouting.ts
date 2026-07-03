import { Linking, Share } from 'react-native';
import { supabase } from './supabase';
import type { ContactPreference, LeadUrgency } from './contractorLeadFlow';

export type ContractorContactMethodType =
  | 'verified_dashboard'
  | 'published_email'
  | 'website_contact_form'
  | 'website'
  | 'phone'
  | 'sms'
  | 'google_profile'
  | 'yelp_profile'
  | 'none';

export type ContractorContactRouteStatus =
  | 'prepared'
  | 'opened'
  | 'email_prepared'
  | 'call_started'
  | 'sms_started'
  | 'shared'
  | 'manual_follow_up_needed'
  | 'blocked';

export type ContractorContactProfile = {
  contractorId?: string;
  businessName: string;
  phone?: string;
  website?: string;
  contactPageUrl?: string;
  publishedEmail?: string;
  googlePlaceId?: string;
  googleMapsUrl?: string;
  yelpBusinessUrl?: string;
  hvacTruthVerified?: boolean;
  acceptsDashboardLeads?: boolean;
  acceptsEmailLeads?: boolean;
  acceptsSmsLeads?: boolean;
  rating?: number;
  reviewCount?: number;
  distanceMiles?: number;
};

export type ContractorContactRoute = {
  contractorName: string;
  preferredMethod: ContractorContactMethodType;
  fallbackMethods: ContractorContactMethodType[];
  destination?: string;
  label: string;
  instructions: string;
  canAutoSend: boolean;
  requiresHomeownerAction: boolean;
};

export type ContractorLeadPacket = {
  leadRequestId?: string;
  serviceTypeLabel: string;
  urgency: LeadUrgency | string;
  zipCode: string;
  homeownerName?: string;
  homeownerPhone?: string;
  homeownerEmail?: string;
  contactPreference: ContactPreference;
  preferredTimeWindow?: string;
  symptomSummary: string;
  desiredOutcome?: string;
  reportSnapshot?: Record<string, any>;
};

function cleanPhone(phone?: string) {
  return (phone ?? '').replace(/[^0-9+]/g, '');
}

function makeWebsiteContactUrl(website?: string) {
  if (!website) return undefined;
  const normalized = website.startsWith('http') ? website : `https://${website}`;
  return normalized.replace(/\/$/, '') + '/contact';
}

export function detectContractorContactRoute(contractor: ContractorContactProfile): ContractorContactRoute {
  const fallbackMethods: ContractorContactMethodType[] = [];

  if (contractor.publishedEmail) fallbackMethods.push('published_email');
  if (contractor.contactPageUrl) fallbackMethods.push('website_contact_form');
  if (contractor.website) fallbackMethods.push('website');
  if (contractor.phone) fallbackMethods.push('phone', 'sms');
  if (contractor.googleMapsUrl || contractor.googlePlaceId) fallbackMethods.push('google_profile');
  if (contractor.yelpBusinessUrl) fallbackMethods.push('yelp_profile');

  if (contractor.hvacTruthVerified && contractor.acceptsDashboardLeads) {
    return {
      contractorName: contractor.businessName,
      preferredMethod: 'verified_dashboard',
      fallbackMethods,
      label: 'Send directly through HVAC Truth',
      instructions: 'This contractor is verified and can receive the lead packet directly in the HVAC Truth contractor portal.',
      canAutoSend: true,
      requiresHomeownerAction: false
    };
  }

  if (contractor.publishedEmail && contractor.acceptsEmailLeads !== false) {
    return {
      contractorName: contractor.businessName,
      preferredMethod: 'published_email',
      fallbackMethods: fallbackMethods.filter((method) => method !== 'published_email'),
      destination: contractor.publishedEmail,
      label: 'Prepare email',
      instructions: 'Use the published email address from the contractor website or verified business profile. The homeowner can review before sending.',
      canAutoSend: false,
      requiresHomeownerAction: true
    };
  }

  if (contractor.contactPageUrl || contractor.website) {
    const destination = contractor.contactPageUrl ?? makeWebsiteContactUrl(contractor.website);
    return {
      contractorName: contractor.businessName,
      preferredMethod: contractor.contactPageUrl ? 'website_contact_form' : 'website',
      fallbackMethods: fallbackMethods.filter((method) => method !== 'website_contact_form' && method !== 'website'),
      destination,
      label: contractor.contactPageUrl ? 'Open contact form' : 'Open website',
      instructions: 'Open the contractor website and paste or submit the standardized lead packet through their contact/request-service flow.',
      canAutoSend: false,
      requiresHomeownerAction: true
    };
  }

  if (contractor.phone) {
    return {
      contractorName: contractor.businessName,
      preferredMethod: 'phone',
      fallbackMethods: ['sms'],
      destination: contractor.phone,
      label: 'Call contractor',
      instructions: 'No reliable website contact method was found. Start a phone call and use the generated script.',
      canAutoSend: false,
      requiresHomeownerAction: true
    };
  }

  if (contractor.googleMapsUrl || contractor.yelpBusinessUrl) {
    return {
      contractorName: contractor.businessName,
      preferredMethod: contractor.googleMapsUrl ? 'google_profile' : 'yelp_profile',
      fallbackMethods,
      destination: contractor.googleMapsUrl ?? contractor.yelpBusinessUrl,
      label: 'Open business profile',
      instructions: 'Open the public business profile and use the available call, website, or request-service option.',
      canAutoSend: false,
      requiresHomeownerAction: true
    };
  }

  return {
    contractorName: contractor.businessName,
    preferredMethod: 'none',
    fallbackMethods: [],
    label: 'No delivery route found',
    instructions: 'This contractor can be displayed in search results, but the app does not have a usable public contact route yet.',
    canAutoSend: false,
    requiresHomeownerAction: false
  };
}

export function buildStandardizedLeadPacket(packet: ContractorLeadPacket) {
  const report = packet.reportSnapshot ?? {};
  const lines = [
    'HVAC Truth Contractor Request',
    '',
    `Service area ZIP: ${packet.zipCode}`,
    `Service needed: ${packet.serviceTypeLabel}`,
    `Urgency: ${packet.urgency}`,
    `Preferred contact: ${packet.contactPreference}`,
    `Preferred time window: ${packet.preferredTimeWindow || 'Not provided'}`,
    '',
    'Homeowner contact:',
    `Name: ${packet.homeownerName || 'Not provided'}`,
    `Phone: ${packet.homeownerPhone || 'Not provided'}`,
    `Email: ${packet.homeownerEmail || 'Not provided'}`,
    '',
    'Issue summary:',
    packet.symptomSummary || 'Not provided',
    '',
    'Desired outcome:',
    packet.desiredOutcome || 'Ballpark estimate first, then scheduled visit if appropriate.',
    '',
    'System information:',
    `System type: ${report.systemType || 'Not provided'}`,
    `Brand: ${report.brand || 'Not provided'}`,
    `Estimated age: ${report.estimatedAgeYears || 'Not provided'}`,
    `Estimated size: ${report.tonnage ? `${report.tonnage} tons` : 'Not provided'}`,
    `Refrigerant: ${report.refrigerantType || 'Not provided'}`,
    `Filter size: ${report.filterSize || 'Not provided'}`,
    `Indoor model: ${report.indoorModelNumber || 'Not provided'}`,
    `Indoor serial: ${report.indoorSerialNumber || 'Not provided'}`,
    `Outdoor model: ${report.outdoorModelNumber || 'Not provided'}`,
    `Outdoor serial: ${report.outdoorSerialNumber || 'Not provided'}`,
    `Air handler location: ${report.airHandlerLocation || 'Not provided'}`,
    `Location details: ${report.airHandlerLocationNotes || 'Not provided'}`,
    `Access notes: ${report.accessNotes || 'Not provided'}`,
    '',
    'Request:',
    'Please provide a ballpark estimate or next-step recommendation based on the information above. Final pricing can be confirmed after an in-person inspection.'
  ];

  return lines.join('\n');
}

export function buildPhoneScript(packet: ContractorLeadPacket) {
  return `Hi, I found your company through HVAC Truth. I am in ZIP ${packet.zipCode}. I need help with ${packet.serviceTypeLabel}. ${packet.symptomSummary} My system details and air handler location are available in a contractor-ready report. Can I send that over so you can give me a ballpark estimate before scheduling?`;
}

export async function performContactRoute(route: ContractorContactRoute, leadText: string, phoneScript: string) {
  if (route.preferredMethod === 'published_email' && route.destination) {
    const subject = encodeURIComponent('HVAC service request with system details');
    const body = encodeURIComponent(leadText);
    await Linking.openURL(`mailto:${route.destination}?subject=${subject}&body=${body}`);
    return 'email_prepared' as ContractorContactRouteStatus;
  }

  if ((route.preferredMethod === 'website_contact_form' || route.preferredMethod === 'website' || route.preferredMethod === 'google_profile' || route.preferredMethod === 'yelp_profile') && route.destination) {
    await Linking.openURL(route.destination);
    await Share.share({ message: leadText });
    return 'opened' as ContractorContactRouteStatus;
  }

  if (route.preferredMethod === 'phone' && route.destination) {
    const phone = cleanPhone(route.destination);
    await Linking.openURL(`tel:${phone}`);
    await Share.share({ message: phoneScript });
    return 'call_started' as ContractorContactRouteStatus;
  }

  if (route.preferredMethod === 'sms' && route.destination) {
    const phone = cleanPhone(route.destination);
    await Linking.openURL(`sms:${phone}?body=${encodeURIComponent(phoneScript)}`);
    return 'sms_started' as ContractorContactRouteStatus;
  }

  await Share.share({ message: leadText });
  return 'shared' as ContractorContactRouteStatus;
}

export async function saveContactRoutingSnapshot(params: {
  userId: string;
  leadRequestId: string;
  contractorName: string;
  route: ContractorContactRoute;
  leadText: string;
  status?: ContractorContactRouteStatus;
}) {
  const { error } = await supabase.from('contractor_contact_routes').insert({
    user_id: params.userId,
    lead_request_id: params.leadRequestId,
    contractor_name: params.contractorName,
    preferred_method: params.route.preferredMethod,
    fallback_methods: params.route.fallbackMethods,
    destination: params.route.destination ?? null,
    route_label: params.route.label,
    route_instructions: params.route.instructions,
    can_auto_send: params.route.canAutoSend,
    requires_homeowner_action: params.route.requiresHomeownerAction,
    prepared_message: params.leadText,
    route_status: params.status ?? 'prepared'
  });
  if (error) throw error;
}

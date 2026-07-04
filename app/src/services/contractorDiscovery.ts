import { supabase } from './supabase';
import { detectContractorContactRoute, ContractorContactProfile } from './contractorContactRouting';
import { DEMO_CONTRACTORS, SelectedContractor } from './contractorLeadFlow';

export type ContractorDiscoverySource = 'google_places' | 'yelp' | 'hvac_truth_verified' | 'manual_seed' | 'demo';

export type ContractorSearchInput = {
  zipCode: string;
  serviceType?: string;
  emergencyOnly?: boolean;
  maxResults?: number;
};

export type ContractorSearchResult = SelectedContractor & {
  contractorId?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  categories?: string[];
  sources?: ContractorDiscoverySource[];
  sourceIds?: Record<string, string>;
  googlePlaceId?: string;
  yelpBusinessId?: string;
  reviewUrl?: string;
  trustScore: number;
  trustScoreReasons: string[];
  contactRouteLabel: string;
  contactRouteMethod: string;
  persisted?: boolean;
  matchMethod?: string;
};

export type ContractorSearchResponse = {
  zipCode: string;
  providerStatus: 'live' | 'cached' | 'fallback_demo' | 'error';
  results: ContractorSearchResult[];
  persistedCount?: number;
  message?: string;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function normalizeRating(rating?: number) {
  if (!rating) return 0;
  return clamp((rating / 5) * 45, 0, 45);
}

function normalizeReviews(reviewCount?: number) {
  if (!reviewCount) return 0;
  if (reviewCount >= 250) return 25;
  if (reviewCount >= 100) return 20;
  if (reviewCount >= 50) return 15;
  if (reviewCount >= 20) return 10;
  return 5;
}

function distanceScore(distanceMiles?: number) {
  if (distanceMiles === undefined || distanceMiles === null) return 5;
  if (distanceMiles <= 5) return 15;
  if (distanceMiles <= 10) return 12;
  if (distanceMiles <= 20) return 8;
  return 4;
}

export function scoreContractor(contractor: SelectedContractor | ContractorContactProfile) {
  const reasons: string[] = [];
  let score = 0;

  score += normalizeRating(contractor.rating);
  if (contractor.rating) reasons.push(`${contractor.rating.toFixed(1)} star rating`);

  score += normalizeReviews(contractor.reviewCount);
  if (contractor.reviewCount) reasons.push(`${contractor.reviewCount} reviews`);

  score += distanceScore(contractor.distanceMiles);
  if (contractor.distanceMiles !== undefined) reasons.push(`${contractor.distanceMiles} miles away`);

  if ('verified' in contractor && contractor.verified) {
    score += 8;
    reasons.push('verified listing');
  }

  if ('emergencyService' in contractor && contractor.emergencyService) {
    score += 5;
    reasons.push('emergency service shown');
  }

  if (contractor.hvacTruthVerified) {
    score += 12;
    reasons.push('HVAC Truth verified');
  }

  const route = detectContractorContactRoute(contractor);
  if (route.preferredMethod !== 'none') {
    score += 5;
    reasons.push(`usable contact route: ${route.label}`);
  }

  return { trustScore: clamp(Math.round(score)), trustScoreReasons: reasons };
}

export function hydrateContractorSearchResult(contractor: SelectedContractor): ContractorSearchResult {
  const score = scoreContractor(contractor);
  const route = detectContractorContactRoute(contractor);
  return {
    ...contractor,
    contractorId: contractor.contractorId ?? contractor.id,
    sources: ['demo'],
    trustScore: score.trustScore,
    trustScoreReasons: score.trustScoreReasons,
    contactRouteLabel: route.label,
    contactRouteMethod: route.preferredMethod,
    persisted: Boolean(contractor.id || contractor.contractorId),
    matchMethod: contractor.id || contractor.contractorId ? 'existing_record' : 'demo'
  };
}

export async function searchContractors(input: ContractorSearchInput): Promise<ContractorSearchResponse> {
  const zipCode = input.zipCode.trim();
  if (!zipCode) {
    return { zipCode, providerStatus: 'error', results: [], message: 'ZIP code is required.' };
  }

  try {
    const { data, error } = await supabase.functions.invoke('contractor-discovery', {
      body: {
        zipCode,
        serviceType: input.serviceType ?? 'hvac service',
        emergencyOnly: input.emergencyOnly ?? false,
        maxResults: input.maxResults ?? 10
      }
    });

    if (error) throw error;

    const rawResults = Array.isArray(data?.results) ? data.results : [];
    const results = rawResults.map((item: any): ContractorSearchResult => {
      const contractorId = item.contractorId ?? item.id;
      const contractor: SelectedContractor = {
        id: contractorId,
        contractorId,
        businessName: item.businessName,
        phone: item.phone,
        website: item.website,
        contactPageUrl: item.contactPageUrl,
        publishedEmail: item.publishedEmail,
        googlePlaceId: item.googlePlaceId,
        googleMapsUrl: item.googleMapsUrl,
        yelpBusinessUrl: item.yelpBusinessUrl,
        rating: item.rating,
        reviewCount: item.reviewCount,
        distanceMiles: item.distanceMiles,
        verified: item.verified,
        emergencyService: item.emergencyService,
        hvacTruthVerified: item.hvacTruthVerified,
        acceptsDashboardLeads: item.acceptsDashboardLeads,
        acceptsEmailLeads: item.acceptsEmailLeads,
        acceptsSmsLeads: item.acceptsSmsLeads
      };
      const hydrated = hydrateContractorSearchResult(contractor);
      return {
        ...hydrated,
        contractorId,
        address: item.address,
        city: item.city,
        state: item.state,
        postalCode: item.postalCode,
        categories: item.categories ?? [],
        sources: item.sources ?? [item.discoverySource ?? 'google_places'],
        sourceIds: item.sourceIds ?? {},
        googlePlaceId: item.googlePlaceId,
        yelpBusinessId: item.yelpBusinessId,
        reviewUrl: item.reviewUrl,
        persisted: item.persisted ?? Boolean(contractorId),
        matchMethod: item.matchMethod ?? (contractorId ? 'contractor_record' : 'provider_result')
      };
    }).sort((a: ContractorSearchResult, b: ContractorSearchResult) => b.trustScore - a.trustScore);

    if (results.length) {
      return {
        zipCode,
        providerStatus: data?.providerStatus ?? 'live',
        results,
        persistedCount: data?.persistedCount ?? results.filter((item) => item.persisted).length,
        message: data?.message
      };
    }
  } catch (error) {
    console.warn('Contractor discovery function unavailable; using demo fallback.', error);
  }

  const fallback = DEMO_CONTRACTORS
    .filter((contractor) => !input.emergencyOnly || contractor.emergencyService)
    .map(hydrateContractorSearchResult)
    .sort((a, b) => b.trustScore - a.trustScore)
    .slice(0, input.maxResults ?? 10);

  return {
    zipCode,
    providerStatus: 'fallback_demo',
    results: fallback,
    persistedCount: 0,
    message: 'Using demo contractors until Google Places/Yelp keys and the contractor-discovery Edge Function are configured.'
  };
}

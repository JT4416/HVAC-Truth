import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

type SearchInput = {
  zipCode: string;
  serviceType?: string;
  emergencyOnly?: boolean;
  maxResults?: number;
};

type DiscoveryResult = {
  contractorId?: string;
  businessName: string;
  phone?: string;
  website?: string;
  contactPageUrl?: string;
  publishedEmail?: string;
  googlePlaceId?: string;
  googleMapsUrl?: string;
  yelpBusinessId?: string;
  yelpBusinessUrl?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  categories?: string[];
  rating?: number;
  reviewCount?: number;
  distanceMiles?: number;
  verified?: boolean;
  emergencyService?: boolean;
  hvacTruthVerified?: boolean;
  acceptsDashboardLeads?: boolean;
  acceptsEmailLeads?: boolean;
  acceptsSmsLeads?: boolean;
  discoverySource: string;
  sources: string[];
  sourceIds: Record<string, string>;
  persisted?: boolean;
  matchMethod?: string;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

function normalizePhone(value?: string | null) {
  return value || undefined;
}

function normalizeBusinessKey(name?: string, postalCode?: string, phone?: string) {
  const cleanName = (name ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanPostal = (postalCode ?? '').replace(/[^0-9]/g, '').slice(0, 5);
  const cleanPhone = (phone ?? '').replace(/[^0-9]/g, '').slice(-10);
  return [cleanName, cleanPostal || cleanPhone].filter(Boolean).join('_') || undefined;
}

function serviceClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY')!;
  return createClient(supabaseUrl, serviceRoleKey);
}

function mapGooglePlace(place: any): DiscoveryResult {
  const displayName = place.displayName?.text ?? place.name ?? 'Unknown contractor';
  const mapsUri = place.googleMapsUri;
  return {
    businessName: displayName,
    phone: normalizePhone(place.nationalPhoneNumber ?? place.internationalPhoneNumber),
    website: place.websiteUri,
    googlePlaceId: place.id,
    googleMapsUrl: mapsUri,
    address: place.formattedAddress,
    categories: place.types ?? [],
    rating: typeof place.rating === 'number' ? place.rating : undefined,
    reviewCount: typeof place.userRatingCount === 'number' ? place.userRatingCount : undefined,
    verified: true,
    emergencyService: /24|emergency|after.?hours/i.test(`${displayName} ${place.editorialSummary?.text ?? ''}`),
    hvacTruthVerified: false,
    discoverySource: 'google_places',
    sources: ['google_places'],
    sourceIds: { googlePlaceId: place.id }
  };
}

function mapYelpBusiness(business: any): DiscoveryResult {
  const location = business.location ?? {};
  return {
    businessName: business.name,
    phone: normalizePhone(business.display_phone || business.phone),
    website: business.url,
    yelpBusinessId: business.id,
    yelpBusinessUrl: business.url,
    address: [location.address1, location.city, location.state, location.zip_code].filter(Boolean).join(', '),
    city: location.city,
    state: location.state,
    postalCode: location.zip_code,
    categories: Array.isArray(business.categories) ? business.categories.map((cat: any) => cat.title ?? cat.alias).filter(Boolean) : [],
    rating: typeof business.rating === 'number' ? business.rating : undefined,
    reviewCount: typeof business.review_count === 'number' ? business.review_count : undefined,
    distanceMiles: typeof business.distance === 'number' ? Number((business.distance / 1609.344).toFixed(1)) : undefined,
    verified: true,
    emergencyService: /24|emergency|after.?hours/i.test(`${business.name} ${business.alias ?? ''}`),
    hvacTruthVerified: false,
    discoverySource: 'yelp',
    sources: ['yelp'],
    sourceIds: { yelpBusinessId: business.id }
  };
}

function dedupe(results: DiscoveryResult[]) {
  const byKey = new Map<string, DiscoveryResult>();
  for (const result of results) {
    const key = (result.googlePlaceId || result.yelpBusinessId || result.phone || normalizeBusinessKey(result.businessName, result.postalCode, result.phone) || result.businessName).toLowerCase().replace(/[^a-z0-9]/g, '');
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, result);
      continue;
    }
    byKey.set(key, {
      ...existing,
      ...result,
      contractorId: existing.contractorId || result.contractorId,
      businessName: existing.businessName || result.businessName,
      phone: existing.phone || result.phone,
      website: existing.website || result.website,
      contactPageUrl: existing.contactPageUrl || result.contactPageUrl,
      publishedEmail: existing.publishedEmail || result.publishedEmail,
      googlePlaceId: existing.googlePlaceId || result.googlePlaceId,
      googleMapsUrl: existing.googleMapsUrl || result.googleMapsUrl,
      yelpBusinessId: existing.yelpBusinessId || result.yelpBusinessId,
      yelpBusinessUrl: existing.yelpBusinessUrl || result.yelpBusinessUrl,
      rating: Math.max(existing.rating ?? 0, result.rating ?? 0) || undefined,
      reviewCount: Math.max(existing.reviewCount ?? 0, result.reviewCount ?? 0) || undefined,
      hvacTruthVerified: existing.hvacTruthVerified || result.hvacTruthVerified,
      acceptsDashboardLeads: existing.acceptsDashboardLeads || result.acceptsDashboardLeads,
      acceptsEmailLeads: existing.acceptsEmailLeads ?? result.acceptsEmailLeads,
      acceptsSmsLeads: existing.acceptsSmsLeads || result.acceptsSmsLeads,
      sources: Array.from(new Set([...(existing.sources ?? []), ...(result.sources ?? [])])),
      sourceIds: { ...(existing.sourceIds ?? {}), ...(result.sourceIds ?? {}) }
    });
  }
  return Array.from(byKey.values());
}

async function searchGooglePlaces(zipCode: string, maxResults: number) {
  const key = Deno.env.get('GOOGLE_PLACES_API_KEY');
  if (!key) return [];
  const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.googleMapsUri,places.types,places.editorialSummary'
    },
    body: JSON.stringify({
      textQuery: `HVAC contractor air conditioning repair near ${zipCode}`,
      maxResultCount: Math.min(maxResults, 20),
      languageCode: 'en'
    })
  });
  if (!response.ok) throw new Error(`Google Places search failed: ${response.status}`);
  const data = await response.json();
  return Array.isArray(data.places) ? data.places.map(mapGooglePlace) : [];
}

async function searchYelp(zipCode: string, maxResults: number) {
  const key = Deno.env.get('YELP_API_KEY');
  if (!key) return [];
  const params = new URLSearchParams({
    term: 'hvac air conditioning repair',
    location: zipCode,
    categories: 'hvac',
    limit: String(Math.min(maxResults, 20)),
    sort_by: 'best_match'
  });
  const response = await fetch(`https://api.yelp.com/v3/businesses/search?${params.toString()}`, {
    headers: { Authorization: `Bearer ${key}` }
  });
  if (!response.ok) throw new Error(`Yelp search failed: ${response.status}`);
  const data = await response.json();
  return Array.isArray(data.businesses) ? data.businesses.map(mapYelpBusiness) : [];
}

function mapContractorRow(contractor: any): DiscoveryResult {
  return {
    contractorId: contractor.id,
    businessName: contractor.business_name,
    phone: contractor.phone,
    website: contractor.website,
    contactPageUrl: contractor.contact_page_url,
    publishedEmail: contractor.published_email,
    googlePlaceId: contractor.google_place_id,
    googleMapsUrl: contractor.google_maps_url,
    yelpBusinessId: contractor.yelp_business_id,
    yelpBusinessUrl: contractor.yelp_business_url,
    address: contractor.address,
    city: contractor.city,
    state: contractor.state,
    postalCode: contractor.postal_code ?? contractor.zip_code,
    categories: contractor.categories ?? ['HVAC'],
    rating: Number(contractor.rating) || undefined,
    reviewCount: contractor.review_count ?? undefined,
    verified: contractor.verified ?? false,
    emergencyService: contractor.emergency_service ?? false,
    hvacTruthVerified: contractor.hvac_truth_verified ?? false,
    acceptsDashboardLeads: contractor.accepts_dashboard_leads ?? false,
    acceptsEmailLeads: contractor.accepts_email_leads ?? true,
    acceptsSmsLeads: contractor.accepts_sms_leads ?? false,
    discoverySource: contractor.discovery_source ?? 'manual_seed',
    sources: [contractor.discovery_source ?? 'manual_seed'],
    sourceIds: {
      ...(contractor.google_place_id ? { googlePlaceId: contractor.google_place_id } : {}),
      ...(contractor.yelp_business_id ? { yelpBusinessId: contractor.yelp_business_id } : {})
    },
    persisted: true,
    matchMethod: 'internal_contractor'
  };
}

async function loadInternalContractors(zipCode: string) {
  const client = serviceClient();
  const { data } = await client
    .from('contractors')
    .select('*')
    .or(`zip_code.eq.${zipCode},postal_code.eq.${zipCode},hvac_truth_verified.eq.true`)
    .limit(20);

  return (data ?? []).map(mapContractorRow);
}

async function findExistingContractor(client: any, result: DiscoveryResult, normalizedKey?: string) {
  if (result.googlePlaceId) {
    const { data } = await client.from('contractors').select('*').eq('google_place_id', result.googlePlaceId).maybeSingle();
    if (data) return { contractor: data, matchMethod: 'google_place_id' };
  }

  if (result.yelpBusinessId) {
    const { data } = await client.from('contractors').select('*').eq('yelp_business_id', result.yelpBusinessId).maybeSingle();
    if (data) return { contractor: data, matchMethod: 'yelp_business_id' };
  }

  const cleanPhone = (result.phone ?? '').replace(/[^0-9]/g, '').slice(-10);
  if (cleanPhone) {
    const { data } = await client.from('contractors').select('*').ilike('phone', `%${cleanPhone.slice(-7)}%`).limit(1);
    if (data?.[0]) return { contractor: data[0], matchMethod: 'phone' };
  }

  if (normalizedKey) {
    const { data } = await client.from('contractors').select('*').eq('normalized_business_key', normalizedKey).maybeSingle();
    if (data) return { contractor: data, matchMethod: 'normalized_business_key' };
  }

  return { contractor: null, matchMethod: 'new' };
}

function mergeSources(existing: any, result: DiscoveryResult) {
  const existingSources = Array.isArray(existing?.discovery_sources) ? existing.discovery_sources : [];
  return Array.from(new Set([...existingSources, ...(result.sources ?? [])]));
}

async function persistDiscoveryResult(client: any, zipCode: string, result: DiscoveryResult): Promise<DiscoveryResult> {
  if (result.contractorId) return result;

  const normalizedKey = normalizeBusinessKey(result.businessName, result.postalCode ?? zipCode, result.phone);
  const match = await findExistingContractor(client, result, normalizedKey);
  const existing = match.contractor;

  const basePayload = {
    business_name: result.businessName,
    phone: result.phone ?? existing?.phone ?? null,
    website: result.website ?? existing?.website ?? null,
    contact_page_url: result.contactPageUrl ?? existing?.contact_page_url ?? null,
    published_email: result.publishedEmail ?? existing?.published_email ?? null,
    google_place_id: result.googlePlaceId ?? existing?.google_place_id ?? null,
    google_maps_url: result.googleMapsUrl ?? existing?.google_maps_url ?? null,
    yelp_business_id: result.yelpBusinessId ?? existing?.yelp_business_id ?? null,
    yelp_business_url: result.yelpBusinessUrl ?? existing?.yelp_business_url ?? null,
    address: result.address ?? existing?.address ?? null,
    city: result.city ?? existing?.city ?? null,
    state: result.state ?? existing?.state ?? null,
    postal_code: result.postalCode ?? existing?.postal_code ?? zipCode,
    zip_code: existing?.zip_code ?? result.postalCode ?? zipCode,
    categories: result.categories ?? existing?.categories ?? [],
    rating: result.rating ?? existing?.rating ?? null,
    review_count: result.reviewCount ?? existing?.review_count ?? null,
    verified: result.verified ?? existing?.verified ?? false,
    emergency_service: result.emergencyService ?? existing?.emergency_service ?? false,
    discovery_source: result.discoverySource ?? existing?.discovery_source ?? 'provider',
    discovery_sources: mergeSources(existing, result),
    source_ids: { ...(existing?.source_ids ?? {}), ...(result.sourceIds ?? {}) },
    normalized_business_key: normalizedKey ?? existing?.normalized_business_key ?? null,
    last_discovered_at: new Date().toISOString(),
    last_provider_refresh_at: new Date().toISOString()
  };

  if (existing) {
    const { data, error } = await client
      .from('contractors')
      .update(basePayload)
      .eq('id', existing.id)
      .select('*')
      .single();

    if (error) throw error;
    return { ...result, ...mapContractorRow(data), persisted: true, matchMethod: match.matchMethod };
  }

  const { data, error } = await client
    .from('contractors')
    .insert({
      ...basePayload,
      hvac_truth_verified: false,
      accepts_dashboard_leads: false,
      accepts_email_leads: true,
      accepts_sms_leads: false,
      contact_confidence: result.phone || result.website ? 'published' : 'unknown',
      discovery_confidence: 'medium'
    })
    .select('*')
    .single();

  if (error) throw error;
  return { ...result, ...mapContractorRow(data), persisted: true, matchMethod: 'created' };
}

async function persistDiscoveryResults(zipCode: string, results: DiscoveryResult[]) {
  const client = serviceClient();
  const persisted: DiscoveryResult[] = [];

  for (const result of results) {
    try {
      persisted.push(await persistDiscoveryResult(client, zipCode, result));
    } catch (error) {
      console.error('Unable to persist contractor discovery result', result.businessName, error);
      persisted.push({ ...result, persisted: false, matchMethod: 'persist_error' });
    }
  }

  return persisted;
}

async function saveSearchResults(zipCode: string, results: DiscoveryResult[], runId?: string) {
  if (!runId) return;
  const client = serviceClient();
  const rows = results.map((item) => ({
    discovery_run_id: runId,
    contractor_id: item.contractorId ?? null,
    zip_code: zipCode,
    business_name: item.businessName,
    phone: item.phone ?? null,
    website: item.website ?? null,
    contact_page_url: item.contactPageUrl ?? null,
    published_email: item.publishedEmail ?? null,
    google_place_id: item.googlePlaceId ?? null,
    yelp_business_id: item.yelpBusinessId ?? null,
    google_maps_url: item.googleMapsUrl ?? null,
    yelp_business_url: item.yelpBusinessUrl ?? null,
    address: item.address ?? null,
    categories: item.categories ?? [],
    rating: item.rating ?? null,
    review_count: item.reviewCount ?? null,
    distance_miles: item.distanceMiles ?? null,
    emergency_service: item.emergencyService ?? false,
    hvac_truth_verified: item.hvacTruthVerified ?? false,
    discovery_sources: item.sources ?? [],
    source_ids: item.sourceIds ?? {},
    trust_score: 0,
    trust_score_reasons: [],
    best_contact_method: item.acceptsDashboardLeads ? 'verified_dashboard' : null,
    best_contact_destination: item.website ?? item.phone ?? null
  }));

  if (rows.length) await client.from('contractor_search_results').insert(rows);
}

async function logDiscovery(zipCode: string, results: DiscoveryResult[], providerStatus: string) {
  const client = serviceClient();
  const { data } = await client.from('contractor_discovery_runs').insert({
    zip_code: zipCode,
    provider_status: providerStatus,
    result_count: results.length,
    providers_used: Array.from(new Set(results.flatMap((item) => item.sources))),
    raw_summary: {
      names: results.slice(0, 10).map((item) => item.businessName),
      persisted_count: results.filter((item) => item.persisted).length
    }
  }).select('id').single();

  return data?.id as string | undefined;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const input = await req.json() as SearchInput;
    const zipCode = String(input.zipCode ?? '').trim();
    if (!zipCode) return json({ error: 'ZIP code is required.' }, 400);

    const maxResults = input.maxResults ?? 10;
    const [internal, google, yelp] = await Promise.allSettled([
      loadInternalContractors(zipCode),
      searchGooglePlaces(zipCode, maxResults),
      searchYelp(zipCode, maxResults)
    ]);

    const allResults = [internal, google, yelp]
      .flatMap((settled) => settled.status === 'fulfilled' ? settled.value : []);

    let results = dedupe(allResults);
    if (input.emergencyOnly) results = results.filter((item) => item.emergencyService);
    results = results.slice(0, maxResults);

    const persistedResults = await persistDiscoveryResults(zipCode, results);
    const providerStatus = persistedResults.length ? 'live' : 'cached';
    const runId = await logDiscovery(zipCode, persistedResults, providerStatus);
    await saveSearchResults(zipCode, persistedResults, runId);

    return json({
      zipCode,
      providerStatus,
      results: persistedResults,
      persistedCount: persistedResults.filter((item) => item.persisted).length,
      message: persistedResults.length
        ? `Found ${persistedResults.length} contractor candidates for ${zipCode}. ${persistedResults.filter((item) => item.persisted).length} are tied to contractor records.`
        : 'No live provider results found. Add API keys, seed contractors, or broaden the ZIP/service-area search.'
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});

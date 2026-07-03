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
  discoverySource: string;
  sources: string[];
  sourceIds: Record<string, string>;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

function normalizePhone(value?: string | null) {
  return value || undefined;
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
    const key = (result.phone || result.businessName).toLowerCase().replace(/[^a-z0-9]/g, '');
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, result);
      continue;
    }
    byKey.set(key, {
      ...existing,
      ...result,
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

async function loadInternalContractors(zipCode: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY')!;
  const client = createClient(supabaseUrl, serviceRoleKey);
  const { data } = await client
    .from('contractors')
    .select('*')
    .or(`zip_code.eq.${zipCode},hvac_truth_verified.eq.true`)
    .limit(20);

  return (data ?? []).map((contractor: any): DiscoveryResult => ({
    contractorId: contractor.id,
    businessName: contractor.business_name,
    phone: contractor.phone,
    website: contractor.website,
    contactPageUrl: contractor.contact_page_url,
    publishedEmail: contractor.published_email,
    googlePlaceId: contractor.google_place_id,
    googleMapsUrl: contractor.google_maps_url,
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
    discoverySource: contractor.discovery_source ?? 'manual_seed',
    sources: [contractor.discovery_source ?? 'manual_seed'],
    sourceIds: contractor.google_place_id ? { googlePlaceId: contractor.google_place_id } : {}
  }));
}

async function logDiscovery(zipCode: string, results: DiscoveryResult[], providerStatus: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY')!;
  const client = createClient(supabaseUrl, serviceRoleKey);
  await client.from('contractor_discovery_runs').insert({
    zip_code: zipCode,
    provider_status: providerStatus,
    result_count: results.length,
    providers_used: Array.from(new Set(results.flatMap((item) => item.sources))),
    raw_summary: { names: results.slice(0, 10).map((item) => item.businessName) }
  });
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

    const providerStatus = results.length ? 'live' : 'cached';
    await logDiscovery(zipCode, results, providerStatus);

    return json({
      zipCode,
      providerStatus,
      results,
      message: results.length
        ? `Found ${results.length} contractor candidates for ${zipCode}.`
        : 'No live provider results found. Add API keys, seed contractors, or broaden the ZIP/service-area search.'
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});

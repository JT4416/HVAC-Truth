import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

type ExtractionField = {
  value?: string;
  confidence: 'high' | 'medium' | 'low' | 'none';
  source: 'ocr' | 'manual' | 'pattern' | 'unknown';
};

type DataPlateExtraction = {
  rawText: string;
  brand: ExtractionField;
  modelNumber: ExtractionField;
  serialNumber: ExtractionField;
  equipmentType: ExtractionField;
  refrigerantType: ExtractionField;
  voltage: ExtractionField;
  warnings: string[];
  candidates: {
    modelNumbers: string[];
    serialNumbers: string[];
    brands: string[];
  };
};

function emptyExtraction(rawText = ''): DataPlateExtraction {
  return {
    rawText,
    brand: { confidence: 'none', source: 'unknown' },
    modelNumber: { confidence: 'none', source: 'unknown' },
    serialNumber: { confidence: 'none', source: 'unknown' },
    equipmentType: { confidence: 'none', source: 'unknown' },
    refrigerantType: { confidence: 'none', source: 'unknown' },
    voltage: { confidence: 'none', source: 'unknown' },
    warnings: [],
    candidates: { modelNumbers: [], serialNumbers: [], brands: [] }
  };
}

function normalizeCandidate(value: string) {
  return value.replace(/[^A-Z0-9\-.]/gi, '').toUpperCase();
}

function parseTextFallback(rawText: string): DataPlateExtraction {
  const extraction = emptyExtraction(rawText);
  const upper = rawText.toUpperCase().replace(/\s+/g, ' ');
  const brandNames = ['GOODMAN', 'AMANA', 'DAIKIN', 'CARRIER', 'BRYANT', 'PAYNE', 'LENNOX', 'TRANE', 'AMERICAN STANDARD', 'RHEEM', 'RUUD', 'YORK', 'COLEMAN', 'LUXAIRE'];
  const brands = brandNames.filter((brand) => upper.includes(brand));
  const modelMatch = upper.match(/(?:MODEL|MOD|M\/N|MODEL NO\.?|MODEL NUMBER)\s*[:#-]?\s*([A-Z0-9][A-Z0-9\-.]{3,24})/i);
  const serialMatch = upper.match(/(?:SERIAL|SER|S\/N|SERIAL NO\.?|SERIAL NUMBER)\s*[:#-]?\s*([A-Z0-9][A-Z0-9\-.]{4,24})/i);
  const refrigerantMatch = upper.match(/\bR[- ]?(22|410A|32|454B|407C)\b/);
  const voltageMatch = upper.match(/\b(115|208|230|240|460)\s*V\b/);

  extraction.candidates.brands = brands;
  extraction.candidates.modelNumbers = modelMatch?.[1] ? [normalizeCandidate(modelMatch[1])] : [];
  extraction.candidates.serialNumbers = serialMatch?.[1] ? [normalizeCandidate(serialMatch[1])] : [];
  extraction.brand = { value: brands[0], confidence: brands[0] ? 'medium' : 'none', source: brands[0] ? 'ocr' : 'unknown' };
  extraction.modelNumber = { value: extraction.candidates.modelNumbers[0], confidence: extraction.candidates.modelNumbers[0] ? 'medium' : 'none', source: extraction.candidates.modelNumbers[0] ? 'ocr' : 'unknown' };
  extraction.serialNumber = { value: extraction.candidates.serialNumbers[0], confidence: extraction.candidates.serialNumbers[0] ? 'medium' : 'none', source: extraction.candidates.serialNumbers[0] ? 'ocr' : 'unknown' };
  extraction.refrigerantType = { value: refrigerantMatch?.[0], confidence: refrigerantMatch ? 'medium' : 'none', source: refrigerantMatch ? 'ocr' : 'unknown' };
  extraction.voltage = { value: voltageMatch?.[0], confidence: voltageMatch ? 'medium' : 'none', source: voltageMatch ? 'ocr' : 'unknown' };
  if (/HEAT\s*PUMP/i.test(upper)) extraction.equipmentType = { value: 'heat_pump', confidence: 'medium', source: 'pattern' };
  else if (/AIR\s*HANDLER|FAN\s*COIL/i.test(upper)) extraction.equipmentType = { value: 'air_handler', confidence: 'medium', source: 'pattern' };
  else if (/FURNACE/i.test(upper)) extraction.equipmentType = { value: 'furnace', confidence: 'medium', source: 'pattern' };
  else if (/CONDENSING\s*UNIT|AIR\s*CONDITIONER|A\/C/i.test(upper)) extraction.equipmentType = { value: 'central_ac', confidence: 'medium', source: 'pattern' };
  if (!extraction.modelNumber.value) extraction.warnings.push('No clear model number was found. Ask the homeowner to confirm manually.');
  if (!extraction.serialNumber.value) extraction.warnings.push('No clear serial number was found. Ask the homeowner to confirm manually.');
  return extraction;
}

async function imageToBase64FromStorage(storageBucket: string, storagePath: string, authHeader: string | null) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const client = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader ?? '' } } });
  const { data, error } = await client.storage.from(storageBucket).download(storagePath);
  if (error) throw error;
  const bytes = new Uint8Array(await data.arrayBuffer());
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json();
    const openAiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAiKey) {
      return new Response(JSON.stringify({ extraction: emptyExtraction(), warning: 'OPENAI_API_KEY is not configured for this function.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let imageBase64: string | undefined;
    if (body.storageBucket && body.storagePath) {
      imageBase64 = await imageToBase64FromStorage(body.storageBucket, body.storagePath, req.headers.get('Authorization'));
    } else if (body.imageBase64) {
      imageBase64 = body.imageBase64;
    }

    if (!imageBase64) throw new Error('No image was provided. Upload the photo first or pass imageBase64.');

    const prompt = `You are reading an HVAC equipment data plate for a homeowner app. Extract only visible text and likely fields. Return strict JSON with this shape: {"rawText":"...","brand":{"value":"","confidence":"high|medium|low|none","source":"ocr"},"modelNumber":{"value":"","confidence":"high|medium|low|none","source":"ocr"},"serialNumber":{"value":"","confidence":"high|medium|low|none","source":"ocr"},"equipmentType":{"value":"central_ac|heat_pump|air_handler|furnace|evaporator_coil|package_unit|mini_split|unknown","confidence":"high|medium|low|none","source":"ocr|pattern"},"refrigerantType":{"value":"","confidence":"high|medium|low|none","source":"ocr"},"voltage":{"value":"","confidence":"high|medium|low|none","source":"ocr"},"warnings":[],"candidates":{"modelNumbers":[],"serialNumbers":[],"brands":[]}}. Do not guess hidden characters. If unsure, include candidates and warning. Homeowner hint: ${body.homeownerHint ?? 'none'}.`;

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${openAiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        input: [{ role: 'user', content: [{ type: 'input_text', text: prompt }, { type: 'input_image', image_url: `data:image/jpeg;base64,${imageBase64}` }] }],
        text: { format: { type: 'json_object' } }
      })
    });

    if (!response.ok) throw new Error(await response.text());
    const json = await response.json();
    const outputText = json.output_text ?? json.output?.flatMap((item: any) => item.content ?? []).find((part: any) => part.type === 'output_text')?.text;
    const parsed = outputText ? JSON.parse(outputText) : emptyExtraction();
    const extraction = parsed.rawText ? { ...parseTextFallback(parsed.rawText), ...parsed } : parsed;

    return new Response(JSON.stringify({ extraction }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

import * as FileSystem from 'expo-file-system';
import { supabase } from './supabase';
import { DataPlateExtraction, parseDataPlateText } from '../domain/decoder/dataPlateExtraction';

export type OcrRequest = {
  imageUri?: string;
  storageBucket?: string;
  storagePath?: string;
  homeownerHint?: string;
};

export async function extractDataPlateFromPhoto(params: OcrRequest): Promise<DataPlateExtraction> {
  if (!params.imageUri && !params.storagePath) {
    throw new Error('A photo URI or storage path is required for OCR.');
  }

  const imageBase64 = params.imageUri ? await FileSystem.readAsStringAsync(params.imageUri, { encoding: FileSystem.EncodingType.Base64 }) : undefined;

  const { data, error } = await supabase.functions.invoke('data-plate-ocr', {
    body: {
      imageBase64,
      storageBucket: params.storageBucket,
      storagePath: params.storagePath,
      homeownerHint: params.homeownerHint
    }
  });

  if (error) throw error;

  if (data?.extraction) return data.extraction as DataPlateExtraction;
  if (data?.rawText) return parseDataPlateText(String(data.rawText));

  throw new Error('OCR did not return readable data plate text.');
}

export function extractDataPlateFromPastedText(rawText: string): DataPlateExtraction {
  return parseDataPlateText(rawText);
}

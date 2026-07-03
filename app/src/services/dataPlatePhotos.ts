import { supabase } from './supabase';
import { DataPlateSide } from '../domain/systemProfileTypes';
import { DataPlateExtraction } from '../domain/decoder/dataPlateExtraction';

export type UploadDataPlatePhotoParams = {
  userId: string;
  hvacSystemId: string;
  side: DataPlateSide;
  uri: string;
  contentType?: string;
  ocrText?: string;
  ocrExtraction?: DataPlateExtraction;
};

export async function uploadDataPlatePhoto(params: UploadDataPlatePhotoParams) {
  const contentType = params.contentType ?? 'image/jpeg';
  const extension = contentType.includes('png') ? 'png' : 'jpg';
  const storagePath = `${params.userId}/${params.hvacSystemId}/${params.side}-${Date.now()}.${extension}`;

  const response = await fetch(params.uri);
  const blob = await response.blob();

  const { error: uploadError } = await supabase.storage
    .from('system-data-plates')
    .upload(storagePath, blob, {
      contentType,
      upsert: false
    });

  if (uploadError) throw uploadError;

  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from('system-data-plates')
    .createSignedUrl(storagePath, 60 * 60);

  if (signedUrlError) throw signedUrlError;

  const { data, error } = await supabase
    .from('hvac_system_photos')
    .insert({
      user_id: params.userId,
      hvac_system_id: params.hvacSystemId,
      photo_type: `${params.side}_data_plate`,
      storage_bucket: 'system-data-plates',
      storage_path: storagePath,
      mime_type: contentType,
      ocr_text: params.ocrText ?? null,
      ocr_extraction: params.ocrExtraction ?? null,
      ocr_status: params.ocrExtraction ? 'completed' : 'not_requested'
    })
    .select()
    .single();

  if (error) throw error;

  return {
    record: data,
    storagePath,
    signedUrl: signedUrlData.signedUrl
  };
}

export async function listSystemPhotos(hvacSystemId: string) {
  const { data, error } = await supabase
    .from('hvac_system_photos')
    .select('*')
    .eq('hvac_system_id', hvacSystemId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return Promise.all((data ?? []).map(async (photo) => {
    const { data: signedUrlData } = await supabase.storage
      .from(photo.storage_bucket)
      .createSignedUrl(photo.storage_path, 60 * 60);

    return {
      ...photo,
      signed_url: signedUrlData?.signedUrl
    };
  }));
}

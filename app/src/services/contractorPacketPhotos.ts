import { supabase } from './supabase';
import type { ContractorPacketPhotoPrompt } from './troubleshootingSessions';

export type ContractorPacketPhotoStatus = 'needed' | 'attached' | 'skipped' | 'not_applicable' | 'blocked_by_safety';

export type ContractorPacketPhotoAttachment = {
  promptId: string;
  promptLabel: string;
  instruction: string;
  safetyNote: string;
  status: ContractorPacketPhotoStatus;
  localUri?: string;
  storageBucket?: string;
  storagePath?: string;
  signedUrl?: string;
  skippedReason?: string;
  capturedAt?: string;
  uploadedAt?: string;
};

export type UploadContractorPacketPhotoParams = {
  userId: string;
  leadDraftId: string;
  attachment: ContractorPacketPhotoAttachment;
  contentType?: string;
};

export function createPhotoAttachmentsFromPrompts(prompts: ContractorPacketPhotoPrompt[]): ContractorPacketPhotoAttachment[] {
  return prompts.map((prompt) => ({
    promptId: prompt.id,
    promptLabel: prompt.label,
    instruction: prompt.instruction,
    safetyNote: prompt.safetyNote,
    status: 'needed'
  }));
}

export function updateAttachmentStatus(
  attachments: ContractorPacketPhotoAttachment[],
  promptId: string,
  status: ContractorPacketPhotoStatus,
  skippedReason?: string
) {
  return attachments.map((attachment) => attachment.promptId === promptId ? {
    ...attachment,
    status,
    skippedReason,
    localUri: status === 'attached' ? attachment.localUri : undefined
  } : attachment);
}

export function attachLocalPhoto(
  attachments: ContractorPacketPhotoAttachment[],
  promptId: string,
  localUri: string
) {
  return attachments.map((attachment) => attachment.promptId === promptId ? {
    ...attachment,
    localUri,
    status: 'attached' as const,
    capturedAt: new Date().toISOString(),
    skippedReason: undefined
  } : attachment);
}

export async function uploadContractorPacketPhoto(params: UploadContractorPacketPhotoParams) {
  if (!params.attachment.localUri) return params.attachment;

  const contentType = params.contentType ?? 'image/jpeg';
  const extension = contentType.includes('png') ? 'png' : 'jpg';
  const safePromptId = params.attachment.promptId.replace(/[^a-z0-9-_]/gi, '-').toLowerCase();
  const storagePath = `${params.userId}/${params.leadDraftId}/${safePromptId}-${Date.now()}.${extension}`;

  const response = await fetch(params.attachment.localUri);
  const blob = await response.blob();

  const { error: uploadError } = await supabase.storage
    .from('contractor-packet-photos')
    .upload(storagePath, blob, { contentType, upsert: false });

  if (uploadError) throw uploadError;

  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from('contractor-packet-photos')
    .createSignedUrl(storagePath, 60 * 60);

  if (signedUrlError) throw signedUrlError;

  return {
    ...params.attachment,
    status: 'attached' as const,
    storageBucket: 'contractor-packet-photos',
    storagePath,
    signedUrl: signedUrlData.signedUrl,
    uploadedAt: new Date().toISOString(),
    localUri: undefined
  };
}

export async function uploadPendingContractorPacketPhotos(params: {
  userId: string;
  leadDraftId: string;
  attachments: ContractorPacketPhotoAttachment[];
}) {
  const uploaded: ContractorPacketPhotoAttachment[] = [];

  for (const attachment of params.attachments) {
    if (attachment.status === 'attached' && attachment.localUri) {
      uploaded.push(await uploadContractorPacketPhoto({
        userId: params.userId,
        leadDraftId: params.leadDraftId,
        attachment
      }));
    } else {
      uploaded.push(attachment);
    }
  }

  return uploaded;
}

export function summarizePhotoAttachments(attachments: ContractorPacketPhotoAttachment[]) {
  const attached = attachments.filter((item) => item.status === 'attached').length;
  const skipped = attachments.filter((item) => item.status === 'skipped').length;
  const notApplicable = attachments.filter((item) => item.status === 'not_applicable').length;
  const blocked = attachments.filter((item) => item.status === 'blocked_by_safety').length;
  const needed = attachments.filter((item) => item.status === 'needed').length;

  return { attached, skipped, notApplicable, blocked, needed, total: attachments.length };
}

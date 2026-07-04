import { supabase } from './supabase';
import { TroubleshootingResult, TroubleshootingWorkflow, TroubleshootingAnswers } from '../domain/troubleshootingWorkflowEngine';

export type TroubleshootingSessionRecord = {
  id: string;
  user_id: string;
  hvac_system_id?: string | null;
  workflow_id: string;
  workflow_title: string;
  symptom?: string | null;
  severity: TroubleshootingResult['severity'];
  answers: TroubleshootingAnswers;
  result_summary?: string | null;
  safe_steps: TroubleshootingResult['safeSteps'];
  do_not_do: string[];
  call_pro_when: string[];
  homeowner_script?: string | null;
  contractor_report_notes: string[];
  attach_to_contractor_report: boolean;
  attach_to_lead_request: boolean;
  homeowner_label?: string | null;
  archived_at?: string | null;
  last_used_in_lead_at?: string | null;
  last_used_in_report_at?: string | null;
  created_at?: string;
};

export type SaveTroubleshootingSessionInput = {
  userId: string;
  hvacSystemId?: string;
  workflow: TroubleshootingWorkflow;
  answers: TroubleshootingAnswers;
  result: TroubleshootingResult;
  attachToContractorReport?: boolean;
  attachToLeadRequest?: boolean;
  homeownerLabel?: string;
};

export type TroubleshootingAttachmentSettings = {
  attachToContractorReport?: boolean;
  attachToLeadRequest?: boolean;
  homeownerLabel?: string;
};

export async function saveTroubleshootingSession(input: SaveTroubleshootingSessionInput) {
  const { data, error } = await supabase
    .from('troubleshooting_sessions')
    .insert({
      user_id: input.userId,
      hvac_system_id: input.hvacSystemId ?? null,
      workflow_id: input.workflow.id,
      workflow_title: input.workflow.title,
      symptom: input.workflow.symptom,
      severity: input.result.severity,
      answers: input.answers,
      result_summary: input.result.summary,
      safe_steps: input.result.safeSteps,
      do_not_do: input.result.doNotDo,
      call_pro_when: input.result.callProWhen,
      homeowner_script: input.result.homeownerScript,
      contractor_report_notes: input.result.contractorReportNotes,
      attach_to_contractor_report: input.attachToContractorReport ?? true,
      attach_to_lead_request: input.attachToLeadRequest ?? true,
      homeowner_label: input.homeownerLabel ?? null
    })
    .select('*')
    .single();

  if (error) throw error;
  return data as TroubleshootingSessionRecord;
}

export async function getRecentTroubleshootingSessions(userId: string, limit = 5, includeArchived = false) {
  let query = supabase
    .from('troubleshooting_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (!includeArchived) query = query.is('archived_at', null);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as TroubleshootingSessionRecord[];
}

export async function getTroubleshootingSession(sessionId: string) {
  const { data, error } = await supabase
    .from('troubleshooting_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error) throw error;
  return data as TroubleshootingSessionRecord;
}

export async function updateTroubleshootingSessionControls(sessionId: string, settings: TroubleshootingAttachmentSettings) {
  const updates: Record<string, unknown> = {};
  if (settings.attachToContractorReport !== undefined) updates.attach_to_contractor_report = settings.attachToContractorReport;
  if (settings.attachToLeadRequest !== undefined) updates.attach_to_lead_request = settings.attachToLeadRequest;
  if (settings.homeownerLabel !== undefined) updates.homeowner_label = settings.homeownerLabel || null;

  const { data, error } = await supabase
    .from('troubleshooting_sessions')
    .update(updates)
    .eq('id', sessionId)
    .select('*')
    .single();

  if (error) throw error;
  return data as TroubleshootingSessionRecord;
}

export async function archiveTroubleshootingSession(sessionId: string) {
  const { data, error } = await supabase
    .from('troubleshooting_sessions')
    .update({
      archived_at: new Date().toISOString(),
      attach_to_contractor_report: false,
      attach_to_lead_request: false
    })
    .eq('id', sessionId)
    .select('*')
    .single();

  if (error) throw error;
  return data as TroubleshootingSessionRecord;
}

export async function markTroubleshootingSessionUsed(sessionId: string, destination: 'lead' | 'report') {
  const column = destination === 'lead' ? 'last_used_in_lead_at' : 'last_used_in_report_at';
  const { data, error } = await supabase
    .from('troubleshooting_sessions')
    .update({ [column]: new Date().toISOString() })
    .eq('id', sessionId)
    .select('*')
    .single();

  if (error) throw error;
  return data as TroubleshootingSessionRecord;
}

export async function getLatestTroubleshootingSessionForReport(userId: string, hvacSystemId?: string) {
  let query = supabase
    .from('troubleshooting_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('attach_to_contractor_report', true)
    .is('archived_at', null)
    .order('created_at', { ascending: false })
    .limit(1);

  if (hvacSystemId) query = query.eq('hvac_system_id', hvacSystemId);

  const { data, error } = await query;
  if (error) throw error;
  return ((data ?? [])[0] ?? null) as TroubleshootingSessionRecord | null;
}

export async function getLatestTroubleshootingSessionForLead(userId: string, hvacSystemId?: string) {
  let query = supabase
    .from('troubleshooting_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('attach_to_lead_request', true)
    .is('archived_at', null)
    .order('created_at', { ascending: false })
    .limit(1);

  if (hvacSystemId) query = query.eq('hvac_system_id', hvacSystemId);

  const { data, error } = await query;
  if (error) throw error;
  return ((data ?? [])[0] ?? null) as TroubleshootingSessionRecord | null;
}

export function getRecommendedWorkflowIdForServiceType(serviceType?: string) {
  switch (serviceType) {
    case 'no_cooling':
      return 'no-cooling-warm-air';
    case 'water_leak':
    case 'drain_issue':
      return 'water-leak-drain-pan';
    case 'frozen_coil':
      return 'frozen-coil-airflow';
    case 'poor_airflow':
      return 'weak-airflow';
    case 'odor':
      return 'odor-safety';
    case 'noise':
      return 'noise-vibration';
    case 'quote_review':
      return 'quote-validation-safe';
    case 'system_not_running':
      return 'both-indoor-outdoor-off-drain-float';
    default:
      return 'both-indoor-outdoor-off-drain-float';
  }
}

export function buildTroubleshootingReportText(session?: TroubleshootingSessionRecord | null) {
  if (!session) return 'No saved troubleshooting session attached.';

  return [
    `Workflow: ${session.workflow_title}`,
    `Severity: ${session.severity}`,
    `Summary: ${session.result_summary ?? 'Not provided'}`,
    '',
    'Technician script:',
    session.homeowner_script ?? 'Not provided',
    '',
    'Contractor notes:',
    ...(session.contractor_report_notes ?? []).map((note) => `- ${note}`),
    '',
    'Call-a-pro triggers:',
    ...(session.call_pro_when ?? []).map((note) => `- ${note}`)
  ].join('\n');
}

export function buildTroubleshootingSnapshot(session?: TroubleshootingSessionRecord | null) {
  if (!session) return null;
  return {
    id: session.id,
    workflowId: session.workflow_id,
    workflowTitle: session.workflow_title,
    symptom: session.symptom,
    severity: session.severity,
    summary: session.result_summary,
    safeSteps: session.safe_steps,
    doNotDo: session.do_not_do,
    callProWhen: session.call_pro_when,
    homeownerScript: session.homeowner_script,
    contractorReportNotes: session.contractor_report_notes,
    homeownerLabel: session.homeowner_label,
    createdAt: session.created_at
  };
}

export function buildLeadPacketPreview(session?: TroubleshootingSessionRecord | null) {
  if (!session) return 'No troubleshooting session selected for this lead packet.';
  return [
    'Troubleshooting session selected for contractor:',
    `Workflow: ${session.workflow_title}`,
    `Severity: ${session.severity}`,
    `Summary: ${session.result_summary ?? 'Not provided'}`,
    '',
    'What the homeowner will tell the technician:',
    session.homeowner_script ?? 'Not provided',
    '',
    'Contractor notes:',
    ...(session.contractor_report_notes ?? []).map((note) => `- ${note}`)
  ].join('\n');
}

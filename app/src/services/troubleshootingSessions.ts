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
      attach_to_lead_request: input.attachToLeadRequest ?? true
    })
    .select('*')
    .single();

  if (error) throw error;
  return data as TroubleshootingSessionRecord;
}

export async function getRecentTroubleshootingSessions(userId: string, limit = 5) {
  const { data, error } = await supabase
    .from('troubleshooting_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as TroubleshootingSessionRecord[];
}

export async function getLatestTroubleshootingSessionForReport(userId: string, hvacSystemId?: string) {
  let query = supabase
    .from('troubleshooting_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('attach_to_contractor_report', true)
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
    .order('created_at', { ascending: false })
    .limit(1);

  if (hvacSystemId) query = query.eq('hvac_system_id', hvacSystemId);

  const { data, error } = await query;
  if (error) throw error;
  return ((data ?? [])[0] ?? null) as TroubleshootingSessionRecord | null;
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
    createdAt: session.created_at
  };
}

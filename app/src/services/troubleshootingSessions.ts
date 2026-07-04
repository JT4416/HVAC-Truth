import { supabase } from './supabase';
import { TroubleshootingResult, TroubleshootingWorkflow, TroubleshootingAnswers } from '../domain/troubleshootingWorkflowEngine';
import type { LeadServiceType, LeadUrgency } from './contractorLeadFlow';

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

export type TroubleshootingLeadDefaults = {
  troubleshootingSessionId?: string;
  sourceWorkflowId: string;
  serviceType: LeadServiceType;
  urgency: LeadUrgency;
  symptomSummary: string;
  desiredOutcome: string;
};

export type ContractorPacketPhotoPrompt = {
  id: string;
  label: string;
  instruction: string;
  safetyNote: string;
};

export type ContractorPacketChecklistItem = {
  label: string;
  status: 'recorded' | 'not_recorded' | 'stopped_for_safety';
  detail: string;
};

export type ContractorPacketIntelligence = {
  workflowId: string;
  workflowTitle: string;
  severity: TroubleshootingResult['severity'];
  severityExplanation: string;
  professionalVerificationFocus: string[];
  homeownerSafetyBoundary: string[];
  suggestedPhotoPrompts: ContractorPacketPhotoPrompt[];
  safeChecklist: ContractorPacketChecklistItem[];
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
    case 'quote_second_opinion':
      return 'quote-validation-safe';
    case 'system_not_running':
    case 'not_turning_on':
      return 'both-indoor-outdoor-off-drain-float';
    default:
      return 'both-indoor-outdoor-off-drain-float';
  }
}

export function getServiceTypeForWorkflowId(workflowId?: string): LeadServiceType {
  switch (workflowId) {
    case 'both-indoor-outdoor-off-drain-float':
      return 'not_turning_on';
    case 'water-leak-drain-pan':
      return 'water_leak';
    case 'noise-vibration':
      return 'noise';
    case 'quote-validation-safe':
      return 'quote_second_opinion';
    case 'frozen-coil-airflow':
    case 'weak-airflow':
    case 'no-cooling-warm-air':
      return 'no_cooling';
    default:
      return 'other';
  }
}

export function getLeadUrgencyForTroubleshootingSeverity(severity?: TroubleshootingSessionRecord['severity']): LeadUrgency {
  switch (severity) {
    case 'urgent-stop':
      return 'emergency_today';
    case 'call-pro':
      return 'within_24_hours';
    case 'caution':
      return 'this_week';
    case 'safe-check':
    default:
      return 'within_24_hours';
  }
}

export function buildLeadDefaultsFromTroubleshootingSession(session: TroubleshootingSessionRecord): TroubleshootingLeadDefaults {
  const topTriggers = (session.call_pro_when ?? []).slice(0, 3);
  const triggerText = topTriggers.length ? ` Contractor should especially verify: ${topTriggers.join(' ')}` : '';

  return {
    troubleshootingSessionId: session.id,
    sourceWorkflowId: session.workflow_id,
    serviceType: getServiceTypeForWorkflowId(session.workflow_id),
    urgency: getLeadUrgencyForTroubleshootingSeverity(session.severity),
    symptomSummary: [
      `Homeowner completed HVAC Truth troubleshooting workflow: ${session.workflow_title}.`,
      session.result_summary ?? 'No troubleshooting summary was saved.',
      session.homeowner_label ? `Homeowner label: ${session.homeowner_label}.` : ''
    ].filter(Boolean).join(' '),
    desiredOutcome: `Request contractor help based on the completed safe troubleshooting session. Homeowner wants a technician to confirm the cause, avoid unsafe DIY work, and provide a fair estimate before repair.${triggerText}`
  };
}

function basePhotoPrompts(): ContractorPacketPhotoPrompt[] {
  return [
    {
      id: 'thermostat-screen',
      label: 'Thermostat screen',
      instruction: 'Photo of the thermostat display showing mode, setpoint, and room temperature.',
      safetyNote: 'Do not remove the thermostat from the wall or open any wiring.'
    },
    {
      id: 'outdoor-unit-clearance',
      label: 'Outdoor unit clearance',
      instruction: 'Photo of the outdoor unit from a safe distance showing airflow clearance around the cabinet.',
      safetyNote: 'Do not remove panels or reach inside the unit.'
    },
    {
      id: 'filter-area-exterior',
      label: 'Filter area exterior',
      instruction: 'Photo of the filter grille or accessible filter slot exterior only.',
      safetyNote: 'Only photograph accessible areas. Do not open equipment compartments.'
    }
  ];
}

export function getSuggestedPhotoPromptsForWorkflow(workflowId?: string): ContractorPacketPhotoPrompt[] {
  switch (workflowId) {
    case 'both-indoor-outdoor-off-drain-float':
      return [
        ...basePhotoPrompts(),
        { id: 'air-handler-area', label: 'Air handler area', instruction: 'Photo of the air handler location and nearby drain/pan area if visible.', safetyNote: 'Do not open panels or bypass float/pan switches.' },
        { id: 'drain-termination', label: 'Drain termination', instruction: 'Photo of the visible condensate drain termination if easily accessible.', safetyNote: 'Do not cut, disconnect, or alter piping.' }
      ];
    case 'water-leak-drain-pan':
      return [
        { id: 'visible-water', label: 'Visible water', instruction: 'Photo of visible water near the unit, pan, ceiling, wall, or floor.', safetyNote: 'Avoid standing water near electrical equipment.' },
        { id: 'emergency-pan', label: 'Emergency pan', instruction: 'Photo of the emergency pan if visible without opening equipment.', safetyNote: 'Do not bypass pan switches or float switches.' },
        { id: 'drain-termination', label: 'Drain termination', instruction: 'Photo of the drain outlet if safely accessible.', safetyNote: 'Do not modify drain piping.' }
      ];
    case 'frozen-coil-airflow':
      return [
        ...basePhotoPrompts(),
        { id: 'ice-visible', label: 'Visible ice', instruction: 'Photo of visible ice/frost from outside the cabinet only.', safetyNote: 'Do not chip ice, open panels, or force the system to run.' },
        { id: 'return-grille', label: 'Return grille', instruction: 'Photo of the return grille and filter area exterior.', safetyNote: 'Do not remove blower access panels.' }
      ];
    case 'no-cooling-warm-air':
      return [
        ...basePhotoPrompts(),
        { id: 'supply-vent', label: 'Supply vent airflow', instruction: 'Photo of a representative supply vent and room thermostat reading.', safetyNote: 'Do not access duct interiors.' }
      ];
    case 'quote-validation-safe':
      return [
        { id: 'quote-document', label: 'Quote document', instruction: 'Photo or upload of the written quote, scope, or invoice.', safetyNote: 'Hide payment details or unrelated personal information.' },
        { id: 'model-serial-plates', label: 'Equipment data plates', instruction: 'Photos of indoor/outdoor data plates if accessible without opening electrical compartments.', safetyNote: 'Do not remove covers to reach a data plate.' }
      ];
    default:
      return basePhotoPrompts();
  }
}

export function getProfessionalVerificationFocusForWorkflow(workflowId?: string) {
  switch (workflowId) {
    case 'both-indoor-outdoor-off-drain-float':
      return ['Control voltage path', 'Thermostat call', 'Float or pan switch status', 'Condensate drain/pan condition', 'Safe restoration without bypassing safeties'];
    case 'water-leak-drain-pan':
      return ['Condensate drain restriction', 'Trap and slope condition', 'Emergency pan condition', 'Float/pan switch operation', 'Water damage risk'];
    case 'frozen-coil-airflow':
      return ['Airflow restrictions', 'Filter and coil condition', 'Blower operation', 'Refrigerant-side diagnostics by licensed technician', 'Restart timing after thaw'];
    case 'no-cooling-warm-air':
      return ['Thermostat call', 'Indoor airflow', 'Outdoor unit operation', 'Refrigerant-side diagnostics by licensed technician', 'Temperature split after safe restart'];
    case 'quote-validation-safe':
      return ['Quoted scope accuracy', 'Part and labor reasonableness', 'Replacement vs repair logic', 'Code or permit implications', 'Second-opinion documentation'];
    case 'noise-vibration':
      return ['Source of sound', 'Fan/motor/compressor condition', 'Loose panels or mounting', 'Duct vibration', 'Safe operation assessment'];
    default:
      return ['Confirm homeowner observations', 'Verify system access', 'Perform licensed diagnostic work', 'Provide repair or estimate recommendation'];
  }
}

export function getSeverityExplanation(severity: TroubleshootingSessionRecord['severity']) {
  switch (severity) {
    case 'urgent-stop':
      return 'HVAC Truth advised the homeowner to stop and request professional help because the situation may involve equipment protection, water risk, electrical risk, or another safety boundary.';
    case 'call-pro':
      return 'HVAC Truth found homeowner-safe checks were not enough to resolve or explain the issue, so the next step is professional diagnosis.';
    case 'caution':
      return 'HVAC Truth allowed only limited homeowner-safe observation or maintenance steps and preserved a contractor handoff if symptoms continue.';
    case 'safe-check':
    default:
      return 'HVAC Truth provided homeowner-safe checks only and did not authorize electrical, refrigerant, gas, combustion, or disassembly work.';
  }
}

export function buildContractorPacketIntelligence(session?: TroubleshootingSessionRecord | null): ContractorPacketIntelligence | null {
  if (!session) return null;

  return {
    workflowId: session.workflow_id,
    workflowTitle: session.workflow_title,
    severity: session.severity,
    severityExplanation: getSeverityExplanation(session.severity),
    professionalVerificationFocus: getProfessionalVerificationFocusForWorkflow(session.workflow_id),
    homeownerSafetyBoundary: session.do_not_do ?? [],
    suggestedPhotoPrompts: getSuggestedPhotoPromptsForWorkflow(session.workflow_id),
    safeChecklist: [
      ...(session.safe_steps ?? []).map((step) => ({
        label: step.title,
        status: 'recorded' as const,
        detail: step.detail
      })),
      ...((session.call_pro_when ?? []).length ? [{
        label: 'Safety stop / call-a-pro trigger',
        status: 'stopped_for_safety' as const,
        detail: (session.call_pro_when ?? []).join(' ')
      }] : [])
    ]
  };
}

export function buildContractorPacketPreview(session?: TroubleshootingSessionRecord | null) {
  const intelligence = buildContractorPacketIntelligence(session);
  if (!intelligence) return 'No contractor packet intelligence available until a troubleshooting session is selected.';

  return [
    'Contractor packet intelligence:',
    `Workflow: ${intelligence.workflowTitle}`,
    `Severity explanation: ${intelligence.severityExplanation}`,
    '',
    'Professional verification focus:',
    ...intelligence.professionalVerificationFocus.map((item) => `- ${item}`),
    '',
    'Homeowner safety boundary:',
    ...intelligence.homeownerSafetyBoundary.map((item) => `- ${item}`),
    '',
    'Suggested safe photos before submission:',
    ...intelligence.suggestedPhotoPrompts.map((prompt) => `- ${prompt.label}: ${prompt.instruction} Safety: ${prompt.safetyNote}`),
    '',
    'Safe checklist status:',
    ...intelligence.safeChecklist.map((item) => `- ${item.label} [${item.status}]: ${item.detail}`)
  ].join('\n');
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
    ...(session.call_pro_when ?? []).map((note) => `- ${note}`),
    '',
    buildContractorPacketPreview(session)
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
    contractorPacket: buildContractorPacketIntelligence(session),
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
    ...(session.contractor_report_notes ?? []).map((note) => `- ${note}`),
    '',
    buildContractorPacketPreview(session)
  ].join('\n');
}

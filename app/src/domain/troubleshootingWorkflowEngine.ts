export type TroubleshootingSeverity = 'safe-check' | 'caution' | 'call-pro' | 'urgent-stop';

export type TroubleshootingQuestionType = 'yes_no' | 'single_choice';

export type TroubleshootingQuestion = {
  id: string;
  prompt: string;
  helper?: string;
  type: TroubleshootingQuestionType;
  options?: { label: string; value: string }[];
};

export type TroubleshootingWorkflow = {
  id: string;
  title: string;
  symptom: string;
  homeownerGoal: string;
  safetyBoundary: string;
  questions: TroubleshootingQuestion[];
  evaluate: (answers: TroubleshootingAnswers) => TroubleshootingResult;
};

export type TroubleshootingAnswers = Record<string, boolean | string | undefined>;

export type TroubleshootingStep = {
  title: string;
  detail: string;
  safetyNote?: string;
};

export type TroubleshootingResult = {
  workflowId: string;
  severity: TroubleshootingSeverity;
  title: string;
  summary: string;
  safeSteps: TroubleshootingStep[];
  doNotDo: string[];
  callProWhen: string[];
  homeownerScript: string;
  contractorReportNotes: string[];
};

export function answerYes(answers: TroubleshootingAnswers, key: string) {
  return answers[key] === true;
}

export function answerNo(answers: TroubleshootingAnswers, key: string) {
  return answers[key] === false;
}

export function selected(answers: TroubleshootingAnswers, key: string, value: string) {
  return answers[key] === value;
}

export function runTroubleshootingWorkflow(workflow: TroubleshootingWorkflow, answers: TroubleshootingAnswers) {
  return workflow.evaluate(answers);
}

export function buildTroubleshootingSessionSnapshot(params: {
  workflow: TroubleshootingWorkflow;
  answers: TroubleshootingAnswers;
  result: TroubleshootingResult;
}) {
  return {
    workflowId: params.workflow.id,
    workflowTitle: params.workflow.title,
    symptom: params.workflow.symptom,
    answers: params.answers,
    severity: params.result.severity,
    resultTitle: params.result.title,
    summary: params.result.summary,
    safeSteps: params.result.safeSteps,
    doNotDo: params.result.doNotDo,
    callProWhen: params.result.callProWhen,
    homeownerScript: params.result.homeownerScript,
    contractorReportNotes: params.result.contractorReportNotes,
    createdAt: new Date().toISOString()
  };
}

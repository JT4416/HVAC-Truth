import React, { useMemo, useState } from 'react';
import { View, Text, Switch, StyleSheet, ScrollView, Pressable } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import { getTroubleshootingWorkflow, troubleshootingWorkflows } from '../domain/troubleshootingWorkflows';
import { TroubleshootingAnswers, buildTroubleshootingSessionSnapshot, runTroubleshootingWorkflow } from '../domain/troubleshootingWorkflowEngine';

export default function TroubleshootingScreen() {
  const [workflowId, setWorkflowId] = useState('both-indoor-outdoor-off-drain-float');
  const [answers, setAnswers] = useState<TroubleshootingAnswers>({});
  const [result, setResult] = useState<ReturnType<typeof runTroubleshootingWorkflow> | null>(null);

  const workflow = useMemo(() => getTroubleshootingWorkflow(workflowId), [workflowId]);
  const snapshot = useMemo(() => result ? buildTroubleshootingSessionSnapshot({ workflow, answers, result }) : null, [workflow, answers, result]);

  function selectWorkflow(id: string) {
    setWorkflowId(id);
    setAnswers({});
    setResult(null);
  }

  function setAnswer(id: string, value: boolean | string) {
    setAnswers((current) => ({ ...current, [id]: value }));
  }

  function evaluate() {
    setResult(runTroubleshootingWorkflow(workflow, answers));
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Safe AC Troubleshooting</Text>
      <Text style={styles.subtitle}>Choose the closest symptom. HVAC Truth will only show homeowner-safe checks and will stop at pro-only work.</Text>

      <View style={styles.workflowGrid}>
        {troubleshootingWorkflows.map((item) => (
          <Pressable key={item.id} style={[styles.workflowCard, workflowId === item.id && styles.workflowCardSelected]} onPress={() => selectWorkflow(item.id)}>
            <Text style={[styles.workflowTitle, workflowId === item.id && styles.workflowTitleSelected]}>{item.title}</Text>
            <Text style={[styles.workflowSymptom, workflowId === item.id && styles.workflowSymptomSelected]}>{item.symptom}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{workflow.title}</Text>
        <Text style={styles.goal}>{workflow.homeownerGoal}</Text>
        <Text style={styles.safetyBoundary}>Safety boundary: {workflow.safetyBoundary}</Text>

        {workflow.questions.map((question) => (
          <View key={question.id} style={styles.questionRow}>
            <View style={styles.questionBlock}>
              <Text style={styles.question}>{question.prompt}</Text>
              {question.helper ? <Text style={styles.helper}>{question.helper}</Text> : null}
              {question.type === 'single_choice' ? (
                <View style={styles.choiceWrap}>
                  {(question.options ?? []).map((option) => (
                    <Pressable key={option.value} style={[styles.choice, answers[question.id] === option.value && styles.choiceSelected]} onPress={() => setAnswer(question.id, option.value)}>
                      <Text style={[styles.choiceText, answers[question.id] === option.value && styles.choiceTextSelected]}>{option.label}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>
            {question.type === 'yes_no' ? <Switch value={answers[question.id] === true} onValueChange={(value) => setAnswer(question.id, value)} /> : null}
          </View>
        ))}

        <PrimaryButton title="Evaluate Workflow" onPress={evaluate} />
      </View>

      {result ? (
        <View style={styles.resultCard}>
          <Text style={styles.badge}>{result.severity.toUpperCase()}</Text>
          <Text style={styles.resultTitle}>{result.title}</Text>
          <Text style={styles.resultSummary}>{result.summary}</Text>

          <Text style={styles.sectionTitle}>Safe homeowner steps</Text>
          {result.safeSteps.map((step) => (
            <View key={`${step.title}-${step.detail}`} style={styles.stepCard}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDetail}>{step.detail}</Text>
              {step.safetyNote ? <Text style={styles.stepSafety}>{step.safetyNote}</Text> : null}
            </View>
          ))}

          <Text style={styles.sectionTitle}>Do not do this</Text>
          {result.doNotDo.map((item) => <Text key={item} style={styles.noBullet}>• {item}</Text>)}

          <Text style={styles.sectionTitle}>Call a pro when</Text>
          {result.callProWhen.map((item) => <Text key={item} style={styles.bullet}>• {item}</Text>)}

          <Text style={styles.sectionTitle}>What to tell the technician</Text>
          <Text style={styles.script}>{result.homeownerScript}</Text>

          <Text style={styles.sectionTitle}>Contractor report notes</Text>
          {result.contractorReportNotes.map((item) => <Text key={item} style={styles.bullet}>• {item}</Text>)}

          {snapshot ? <Text style={styles.snapshotNote}>Session snapshot is ready for future report/lead packet attachment.</Text> : null}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: '#F8FAFC' },
  title: { fontSize: 28, fontWeight: '900', marginBottom: 8, color: '#0F172A' },
  subtitle: { fontSize: 15, lineHeight: 22, color: '#475569', marginBottom: 14 },
  workflowGrid: { gap: 10, marginBottom: 14 },
  workflowCard: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 14, padding: 14 },
  workflowCardSelected: { backgroundColor: '#0B66E4', borderColor: '#0B66E4' },
  workflowTitle: { color: '#0F172A', fontWeight: '900', marginBottom: 4 },
  workflowTitleSelected: { color: '#FFFFFF' },
  workflowSymptom: { color: '#64748B', lineHeight: 19 },
  workflowSymptomSelected: { color: '#DBEAFE' },
  section: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#D8E2F0', marginBottom: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '900', marginTop: 10, marginBottom: 8, color: '#0F172A' },
  goal: { color: '#334155', lineHeight: 21, marginBottom: 8 },
  safetyBoundary: { color: '#9A3412', lineHeight: 21, fontWeight: '800', backgroundColor: '#FFF7ED', borderRadius: 12, padding: 10, marginBottom: 8 },
  questionRow: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  questionBlock: { flex: 1 },
  question: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  helper: { fontSize: 13, color: '#64748B', marginTop: 4, lineHeight: 18 },
  choiceWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  choice: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 999, paddingVertical: 8, paddingHorizontal: 10, backgroundColor: '#FFFFFF' },
  choiceSelected: { backgroundColor: '#0B66E4', borderColor: '#0B66E4' },
  choiceText: { color: '#334155', fontWeight: '800' },
  choiceTextSelected: { color: '#FFFFFF' },
  resultCard: { marginTop: 4, padding: 16, borderRadius: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D8E2F0' },
  badge: { alignSelf: 'flex-start', fontSize: 12, fontWeight: '900', color: '#334155', backgroundColor: '#E2E8F0', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, marginBottom: 8 },
  resultTitle: { fontSize: 22, fontWeight: '900', marginBottom: 8, color: '#0F172A' },
  resultSummary: { fontSize: 16, lineHeight: 24, marginBottom: 12, color: '#334155' },
  stepCard: { backgroundColor: '#EFF6FF', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#BFDBFE', marginBottom: 8 },
  stepTitle: { fontWeight: '900', color: '#0F2E5F', marginBottom: 4 },
  stepDetail: { color: '#334155', lineHeight: 20 },
  stepSafety: { color: '#9A3412', fontWeight: '800', lineHeight: 19, marginTop: 6 },
  bullet: { fontSize: 15, lineHeight: 22, color: '#334155' },
  noBullet: { fontSize: 15, lineHeight: 22, color: '#991B1B', fontWeight: '700' },
  script: { fontSize: 15, lineHeight: 22, fontStyle: 'italic', color: '#334155', backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12 },
  snapshotNote: { marginTop: 12, color: '#0F766E', fontWeight: '800' }
});

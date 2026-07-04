import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, View, Text, Switch, StyleSheet, ScrollView, Pressable } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import { getTroubleshootingWorkflow, troubleshootingWorkflows } from '../domain/troubleshootingWorkflows';
import { TroubleshootingAnswers, buildTroubleshootingSessionSnapshot, runTroubleshootingWorkflow } from '../domain/troubleshootingWorkflowEngine';
import { getPrimarySystem } from '../services/profilePersistence';
import { TroubleshootingSessionRecord, getRecentTroubleshootingSessions, saveTroubleshootingSession } from '../services/troubleshootingSessions';

export default function TroubleshootingScreen({ navigation }: any) {
  const { user } = useAuth();
  const [workflowId, setWorkflowId] = useState('both-indoor-outdoor-off-drain-float');
  const [answers, setAnswers] = useState<TroubleshootingAnswers>({});
  const [result, setResult] = useState<ReturnType<typeof runTroubleshootingWorkflow> | null>(null);
  const [hvacSystemId, setHvacSystemId] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [recentSessions, setRecentSessions] = useState<TroubleshootingSessionRecord[]>([]);

  const workflow = useMemo(() => getTroubleshootingWorkflow(workflowId), [workflowId]);
  const snapshot = useMemo(() => result ? buildTroubleshootingSessionSnapshot({ workflow, answers, result }) : null, [workflow, answers, result]);

  useEffect(() => {
    loadTroubleshootingContext();
  }, [user?.id]);

  async function loadTroubleshootingContext() {
    if (!user?.id) return;
    try {
      setLoadingSessions(true);
      const [system, sessions] = await Promise.all([
        getPrimarySystem(user.id),
        getRecentTroubleshootingSessions(user.id, 8)
      ]);
      setHvacSystemId(system?.id);
      setRecentSessions(sessions);
    } catch (error: any) {
      Alert.alert('Could not load troubleshooting history', error?.message ?? 'Please try again.');
    } finally {
      setLoadingSessions(false);
    }
  }

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

  async function saveSession() {
    if (!user?.id || !result) return;
    try {
      setSaving(true);
      const saved = await saveTroubleshootingSession({
        userId: user.id,
        hvacSystemId,
        workflow,
        answers,
        result,
        attachToContractorReport: true,
        attachToLeadRequest: true
      });
      setRecentSessions((current) => [saved, ...current.filter((item) => item.id !== saved.id)].slice(0, 8));
      Alert.alert('Troubleshooting saved', 'This workflow result can now be attached to contractor reports and lead requests.');
    } catch (error: any) {
      Alert.alert('Could not save troubleshooting', error?.message ?? 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Safe AC Troubleshooting</Text>
      <Text style={styles.subtitle}>Choose the closest symptom. HVAC Truth will only show homeowner-safe checks and will stop at pro-only work.</Text>

      <View style={styles.historyCard}>
        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>Recent saved sessions</Text>
          <Pressable onPress={loadTroubleshootingContext}><Text style={styles.refreshText}>Refresh</Text></Pressable>
        </View>
        {loadingSessions ? <ActivityIndicator color="#0B66E4" /> : null}
        {!loadingSessions && !recentSessions.length ? <Text style={styles.helper}>No saved troubleshooting sessions yet.</Text> : null}
        {recentSessions.map((session) => (
          <Pressable key={session.id} style={styles.historyItem} onPress={() => navigation.navigate('TroubleshootingSessionDetail', { sessionId: session.id })}>
            <Text style={styles.historyWorkflow}>{session.homeowner_label || session.workflow_title}</Text>
            <Text style={styles.historyMeta}>{session.workflow_title}</Text>
            <Text style={styles.historyMeta}>{session.severity.toUpperCase()} • {session.result_summary ?? 'No summary'}</Text>
            <Text style={styles.historyFlags}>Report: {session.attach_to_contractor_report ? 'Attached' : 'Hidden'} • Leads: {session.attach_to_lead_request ? 'Attached' : 'Hidden'}</Text>
          </Pressable>
        ))}
      </View>

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

          {snapshot ? <Text style={styles.snapshotNote}>Session snapshot is ready for report and lead packet attachment.</Text> : null}
          <PrimaryButton title={saving ? 'Saving...' : 'Save Troubleshooting Session'} onPress={saveSession} />
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: '#F8FAFC' },
  title: { fontSize: 28, fontWeight: '900', marginBottom: 8, color: '#0F172A' },
  subtitle: { fontSize: 15, lineHeight: 22, color: '#475569', marginBottom: 14 },
  historyCard: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#D8E2F0', padding: 14, marginBottom: 14 },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  historyTitle: { color: '#0F172A', fontWeight: '900' },
  refreshText: { color: '#0B66E4', fontWeight: '900' },
  historyItem: { borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 9, marginTop: 9 },
  historyWorkflow: { color: '#0F172A', fontWeight: '900', marginBottom: 3 },
  historyMeta: { color: '#64748B', lineHeight: 18, fontSize: 12 },
  historyFlags: { color: '#0F766E', lineHeight: 18, fontSize: 12, fontWeight: '800', marginTop: 2 },
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
  snapshotNote: { marginTop: 12, marginBottom: 8, color: '#0F766E', fontWeight: '800' }
});

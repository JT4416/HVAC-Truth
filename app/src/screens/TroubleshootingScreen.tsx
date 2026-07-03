import React, { useState } from 'react';
import { View, Text, Switch, StyleSheet, ScrollView } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import { evaluateTroubleshooting, troubleshootingQuestions, TroubleshootingAnswerKey } from '../domain/troubleshootingRules';

export default function TroubleshootingScreen() {
  const [answers, setAnswers] = useState<Partial<Record<TroubleshootingAnswerKey, boolean>>>({});
  const [result, setResult] = useState<ReturnType<typeof evaluateTroubleshooting> | null>(null);

  function evaluate() {
    setResult(evaluateTroubleshooting(answers));
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Safe AC Troubleshooting</Text>
      <Text style={styles.subtitle}>Answer what you can. The app will separate safe homeowner checks from technician-only work.</Text>
      {troubleshootingQuestions.map((q) => (
        <View key={q.key} style={styles.row}>
          <View style={styles.questionBlock}>
            <Text style={styles.question}>{q.prompt}</Text>
            <Text style={styles.helper}>{q.helper}</Text>
          </View>
          <Switch value={!!answers[q.key]} onValueChange={(value) => setAnswers({ ...answers, [q.key]: value })} />
        </View>
      ))}
      <PrimaryButton title="Evaluate" onPress={evaluate} />
      {result ? (
        <View style={styles.resultCard}>
          <Text style={styles.badge}>{result.severity.toUpperCase()}</Text>
          <Text style={styles.resultTitle}>{result.title}</Text>
          <Text style={styles.resultSummary}>{result.summary}</Text>
          <Text style={styles.sectionTitle}>Safe next steps</Text>
          {result.safeSteps.map((step) => <Text key={step} style={styles.bullet}>• {step}</Text>)}
          <Text style={styles.sectionTitle}>Call a pro when</Text>
          {result.callProWhen.map((step) => <Text key={step} style={styles.bullet}>• {step}</Text>)}
          <Text style={styles.sectionTitle}>What to tell the technician</Text>
          <Text style={styles.script}>{result.homeownerScript}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24 },
  title: { fontSize: 26, fontWeight: '800', marginBottom: 8 },
  subtitle: { fontSize: 15, lineHeight: 22, color: '#475569', marginBottom: 12 },
  row: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  questionBlock: { flex: 1, marginRight: 12 },
  question: { fontSize: 16, fontWeight: '700' },
  helper: { fontSize: 13, color: '#64748B', marginTop: 4, lineHeight: 18 },
  resultCard: { marginTop: 20, padding: 16, borderRadius: 12, backgroundColor: '#F1F5F9' },
  badge: { fontSize: 12, fontWeight: '800', color: '#334155', marginBottom: 8 },
  resultTitle: { fontSize: 20, fontWeight: '800', marginBottom: 8 },
  resultSummary: { fontSize: 16, lineHeight: 24, marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '800', marginTop: 10, marginBottom: 4 },
  bullet: { fontSize: 15, lineHeight: 22, color: '#334155' },
  script: { fontSize: 15, lineHeight: 22, fontStyle: 'italic', color: '#334155' }
});

import React, { useState } from 'react';
import { Text, TextInput, StyleSheet, ScrollView, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import { assessQuote } from '../domain/quoteRules';

function normalizeRepairType(text: string) {
  const value = text.toLowerCase();
  if (value.includes('capacitor')) return 'capacitor';
  if (value.includes('contactor')) return 'contactor';
  if (value.includes('thermostat')) return 'thermostat';
  if (value.includes('drain')) return 'drain';
  if (value.includes('blower')) return 'blowerMotor';
  if (value.includes('fan')) return 'condenserFanMotor';
  if (value.includes('leak') || value.includes('refrigerant') || value.includes('freon')) return 'refrigerantLeak';
  if (value.includes('compressor')) return 'compressor';
  if (value.includes('replace') || value.includes('new unit') || value.includes('system')) return 'replacement';
  return value.trim();
}

export default function QuoteCheckerScreen() {
  const [repair, setRepair] = useState('');
  const [amount, setAmount] = useState('');
  const [systemAge, setSystemAge] = useState('');
  const [result, setResult] = useState<ReturnType<typeof assessQuote> | null>(null);

  function checkQuote() {
    const assessment = assessQuote({
      repairType: normalizeRepairType(repair),
      quotedTotal: Number(amount),
      systemAgeYears: systemAge ? Number(systemAge) : undefined
    });
    setResult(assessment);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Check My Quote</Text>
      <Text style={styles.subtitle}>Starter quote check. This is not a final market price engine yet, but it already gives homeowners the right questions and red flags.</Text>
      <TextInput style={styles.input} placeholder="Repair quoted, e.g. capacitor, blower motor, compressor" value={repair} onChangeText={setRepair} />
      <TextInput style={styles.input} placeholder="Total quote amount" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />
      <TextInput style={styles.input} placeholder="System age, if known" keyboardType="number-pad" value={systemAge} onChangeText={setSystemAge} />
      <PrimaryButton title="Check Quote" onPress={checkQuote} />
      {result ? (
        <View style={styles.resultCard}>
          <Text style={styles.badge}>{result.band.toUpperCase()}</Text>
          <Text style={styles.resultTitle}>{result.title}</Text>
          <Text style={styles.resultText}>{result.explanation}</Text>
          <Text style={styles.section}>Questions to ask</Text>
          {result.questionsToAsk.map((item) => <Text key={item} style={styles.bullet}>• {item}</Text>)}
          <Text style={styles.section}>Red flags</Text>
          {result.redFlags.map((item) => <Text key={item} style={styles.bullet}>• {item}</Text>)}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 8 },
  subtitle: { fontSize: 15, lineHeight: 22, color: '#475569', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 12 },
  resultCard: { marginTop: 16, padding: 16, borderRadius: 12, backgroundColor: '#F1F5F9' },
  badge: { fontSize: 12, fontWeight: '800', color: '#334155', marginBottom: 8 },
  resultTitle: { fontSize: 20, fontWeight: '800', marginBottom: 8 },
  resultText: { fontSize: 16, lineHeight: 24 },
  section: { fontSize: 14, fontWeight: '800', marginTop: 12, marginBottom: 4 },
  bullet: { fontSize: 14, lineHeight: 21, color: '#334155' }
});

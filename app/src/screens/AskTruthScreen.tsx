import React, { useState } from 'react';
import { ScrollView, Text, TextInput, StyleSheet } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import { homeownerSafetyRules } from '../data/safetyRules';

export default function AskTruthScreen() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  function ask() {
    setAnswer('MVP placeholder: route this question to a secure backend that calls the OpenAI API with HVAC Truth safety rules. Never expose the OpenAI API key inside the mobile app.');
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Ask HVAC Truth</Text>
      <TextInput style={styles.input} placeholder="Ask about your AC problem, quote, smell, noise, or maintenance question." value={question} onChangeText={setQuestion} multiline />
      <PrimaryButton title="Ask" onPress={ask} />
      {answer ? <Text style={styles.answer}>{answer}</Text> : null}
      <Text style={styles.warningTitle}>Safety rules</Text>
      {homeownerSafetyRules.map((rule) => <Text key={rule} style={styles.warning}>• {rule}</Text>)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 16 },
  input: { minHeight: 120, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 12, textAlignVertical: 'top' },
  answer: { marginTop: 16, padding: 16, borderRadius: 12, backgroundColor: '#F1F5F9', fontSize: 16, lineHeight: 24 },
  warningTitle: { fontSize: 18, fontWeight: '800', marginTop: 24, marginBottom: 8 },
  warning: { fontSize: 14, lineHeight: 21 }
});
